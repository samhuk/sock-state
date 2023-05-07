import { Message, MessageType, SubscribeMessage, UnsubscribeMessage } from '../message/types'
import { StoreServer, StoreServerOptions } from './types'

import { Client } from '../common/server/clientStore/types'
import { StoreServerReporter } from '../types'
import { TopicStore } from './topicStore/types'
import { createServer } from '../common/server'
import { createTopicStore } from './topicStore'
import { sortMessagesByType } from '../message'

const processSubscribeMessage = (
  msg: SubscribeMessage,
  senderClient: Client,
  topicStore: TopicStore,
  reporter?: StoreServerReporter,
) => {
  const topicNames = Array.isArray(msg.data.topics) ? msg.data.topics : [msg.data.topics]
  topicNames.forEach(topicName => {
    topicStore.subscribeClientToTopic(senderClient, topicName)
    reporter?.onClientSubscribeTopic?.(senderClient, topicStore.getTopic(topicName))
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
    if (wasSubscribed)
      reporter?.onClientUnsubscribeTopic?.(senderClient, topicStore.getTopic(topicName))
  })
}

const processMessages = (
  msgs: Message | Message[],
  senderClient: Client,
  topicStore: TopicStore,
) => {
  if (Array.isArray(msgs)) {
    const messagesByType = sortMessagesByType(msgs)
    messagesByType.subscribe.forEach(msg => processSubscribeMessage(msg, senderClient, topicStore))
    messagesByType.unsubscribe.forEach(msg => processUnsubscribeMessage(msg, senderClient, topicStore))
    topicStore.digest(messagesByType.action)
  }
  else {
    switch (msgs.type) {
      case MessageType.SUBSCRIBE: {
        processSubscribeMessage(msgs, senderClient, topicStore)
        break
      }
      case MessageType.UNSUBSCRIBE: {
        processUnsubscribeMessage(msgs, senderClient, topicStore)
        break
      }
      case MessageType.ACTION: {
        topicStore.digest(msgs)
        break
      }
      default:
        break
    }
  }
}

export const createStoreServer = (options: StoreServerOptions): StoreServer => {
  options.reporter?.onBegin?.(options)
  const server = createServer({
    host: options.host,
    port: options.port,
    reporter: {
      onCreateServer: () => options.reporter?.onCreateServer?.(options),
      onCreatingServer: () => options.reporter?.onCreatingServer?.(options),
      onClientConnect: client => options.reporter?.onClientConnect?.(client, options),
    },
  })

  const topicStore = createTopicStore({
    topics: options.topics,
  })

  server.on('message', (rawData, senderClient) => {
    const rawDataStr = String(rawData)
    options.reporter?.onClientMessage?.(senderClient, rawDataStr, options)
    const msgs = JSON.parse(rawDataStr) as Message | Message[]
    processMessages(msgs, senderClient, topicStore)
  })

  server.on('disconnect', client => {
    const topicNamesUnsubscribedFrom = topicStore.unsubscribeClientFromAllTopics(client.uuid)
    options.reporter?.onClientDisconnect?.(client, topicNamesUnsubscribedFrom, options)
  })

  return {
    server,
    getTopic: topicStore.getTopic,
    getTopicList: topicStore.getTopicList,
    addTopic: _options => (
      topicStore.addTopic(_options)
    ),
    deleteTopic: (topicName, data) => (
      topicStore.deleteTopic(topicName, data)
    ),
    close: () => server.close(),
  }
}
