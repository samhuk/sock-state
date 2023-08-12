import { Message, MessageType, SubscribeMessage, UnsubscribeMessage, UnsubscribeUnsuccessfulMessage } from '../../message/types'
import { MessageProcessor, MessageProcessorOptions } from './types'

import { Client } from '../../common/server/clientStore/types'
import { StoreServerReporter } from '../reporter/types'
import { SubscriptionAcceptor } from '../types'
import { TopicStore } from '../topicStore/types'
import { sendMessageToClient } from '..'
import { sortMessagesByType } from '../../message'

const createUnsubscribeUnsuccessfulMessage = (
  topicName: string,
  reason: 'topic-not-exist' | 'not-subscribed',
): UnsubscribeUnsuccessfulMessage => ({
  type: MessageType.UNSUBSCRIBE_UNSUCCESSFUL,
  dateCreated: Date.now(),
  data: {
    topic: topicName,
    data: reason,
  },
})

const createSubscribeUnsuccessfulMessage = (
  topicName: string,
  reason: any,
): UnsubscribeUnsuccessfulMessage => ({
  type: MessageType.UNSUBSCRIBE_UNSUCCESSFUL,
  dateCreated: Date.now(),
  data: {
    topic: topicName,
    data: reason,
  },
})

const processSubscribeMessage = (
  msg: SubscribeMessage,
  senderClient: Client,
  topicStore: TopicStore,
  reporter?: StoreServerReporter,
  subscriptionAcceptor?: SubscriptionAcceptor,
) => {
  const topicNames = Array.isArray(msg.data.topics) ? msg.data.topics : [msg.data.topics]
  topicNames.forEach(topicName => {
    const topic = topicStore.getTopic(topicName)
    let subscriptionAcceptorResultData: any = null

    // Guard by subscription acceptor if defined
    if (subscriptionAcceptor != null) {
      const subscriptionAcceptorResult = subscriptionAcceptor?.(senderClient, topic)

      // If result is null or false, then subscription is rejected for undefined reason
      if (subscriptionAcceptorResult == null || subscriptionAcceptorResult === false) {
        sendMessageToClient(senderClient, createSubscribeUnsuccessfulMessage(topicName, undefined))
        reporter?.onClientUnsuccessfulSubscribeTopic?.(senderClient, topicStore.getTopic(topicName), undefined)
        return
      }

      // This reduces the possible results to the full object with `accepted` and (potentially) `data` (could be a reason or something else entirely)
      if (subscriptionAcceptorResult !== true) {
        // If result accepted is false, then subscription is rejected for *potentially* a reason ("data")
        if (!subscriptionAcceptorResult.accepted) {
          sendMessageToClient(senderClient, createSubscribeUnsuccessfulMessage(topicName, subscriptionAcceptorResult.data))
          reporter?.onClientUnsuccessfulSubscribeTopic?.(senderClient, topicStore.getTopic(topicName), subscriptionAcceptorResult.data)
          return
        }

        // Subscription acceptor guard is passed
        subscriptionAcceptorResultData = subscriptionAcceptorResult.data
      }
    }

    const susbcribeResult = topicStore.subscribeClientToTopic(senderClient, topicName)

    // Client tries to subscribe to nonexistent topic
    if (susbcribeResult === undefined) {
      sendMessageToClient(senderClient, createSubscribeUnsuccessfulMessage(topicName, 'topic-not-exist'))
      reporter?.onClientUnsuccessfulSubscribeTopic?.(senderClient, topicStore.getTopic(topicName), 'topic-not-exist')
      return
    }

    reporter?.onClientSubscribeTopic?.(susbcribeResult.client, topicStore.getTopic(topicName), subscriptionAcceptorResultData)
  })
}

const processUnsubscribeMessage = (
  msg: UnsubscribeMessage,
  senderClient: Client,
  topicStore: TopicStore,
  reporter?: StoreServerReporter,
) => {
  const topicNames = Array.isArray(msg.data.topics) ? msg.data.topics : [msg.data.topics]
  topicNames.forEach(topicName => {
    const wasSubscribed = topicStore.unsubscribeClientFromTopic(senderClient.uuid, topicName)

    // Cannot unsubscribe, topic doesn't exist
    if (wasSubscribed === undefined) {
      reporter?.onClientUnsuccessfulUnsubscribeTopic?.(senderClient, 'topic-not-exist')
      sendMessageToClient(senderClient, createUnsubscribeUnsuccessfulMessage(topicName, 'topic-not-exist'))
      return
    }

    // Cannot unsubscribe, client isn't subscribed to the topic
    if (!wasSubscribed) {
      reporter?.onClientUnsuccessfulUnsubscribeTopic?.(senderClient, 'not-subscribed')
      sendMessageToClient(senderClient, createUnsubscribeUnsuccessfulMessage(topicName, 'not-subscribed'))
      return
    }

    // Successfully unsubscribed
    reporter?.onClientUnsubscribeTopic?.(senderClient, topicStore.getTopic(topicName))
  })
}

const processMsg = (
  msg: Message,
  senderClient: Client,
  topicStore: TopicStore,
  reporter?: StoreServerReporter,
  subscriptionAcceptor?: SubscriptionAcceptor,
): void => {
  switch (msg.type) {
    case MessageType.SUBSCRIBE: {
      processSubscribeMessage(msg, senderClient, topicStore, reporter, subscriptionAcceptor)
      break
    }
    case MessageType.UNSUBSCRIBE: {
      processUnsubscribeMessage(msg, senderClient, topicStore, reporter)
      break
    }
    case MessageType.ACTION: {
      topicStore.digest(msg)
      break
    }
    default:
      break
  }
}

const processMsgList = (
  msgs: Message[],
  senderClient: Client,
  topicStore: TopicStore,
  reporter?: StoreServerReporter,
  subscriptionAcceptor?: SubscriptionAcceptor,
): void => {
  const messagesByType = sortMessagesByType(msgs)
  messagesByType.subscribe.forEach(msg => processSubscribeMessage(msg, senderClient, topicStore, reporter, subscriptionAcceptor))
  messagesByType.unsubscribe.forEach(msg => processUnsubscribeMessage(msg, senderClient, topicStore, reporter))
  topicStore.digest(messagesByType.action)
}

export const createMessageProcessor = (
  options: MessageProcessorOptions,
): MessageProcessor => ({
  process: (msgs, senderClient) => {
    if (Array.isArray(msgs))
      processMsgList(msgs, senderClient, options.topicStore, options.reporter, options.subscriptionAcceptor)
    else
      processMsg(msgs, senderClient, options.topicStore, options.reporter, options.subscriptionAcceptor)
  },
})
