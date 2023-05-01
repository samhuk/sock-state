import { Message, MessageType, SubscribeMessage, UnsubscribeMessage } from '../message/types'
import { StoreServer, StoreServerOptions } from './types'

import { Client } from '../common/server/clientStore/types'
import { createServer } from '../common/server'
import { createTopicStore } from './topicStore'
import { sortMessagesByType } from '../message'

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

  const processSubscribeMessage = (msg: SubscribeMessage, senderClient: Client) => {
    const topicNames = Array.isArray(msg.data.topics) ? msg.data.topics : [msg.data.topics]
    topicNames.forEach(topicName => {
      topicStore.subscribeClientToTopic(senderClient, topicName)
      options.reporter?.onClientSubscribeTopic?.(senderClient, topicStore.getTopic(topicName))
    })
  }

  const processUnsubscribeMessage = (msg: UnsubscribeMessage, senderClient: Client) => {
    const topicNames = Array.isArray(msg.data.topics) ? msg.data.topics : [msg.data.topics]
    topicNames.forEach(topicName => {
      const wasSubscribed = topicStore.unsubscribeClientFromTopic(senderClient.uuid, topicName)
      if (wasSubscribed)
        options.reporter?.onClientUnsubscribeTopic?.(senderClient, topicStore.getTopic(topicName))
    })
  }

  const processMessage = (msgs: Message | Message[], senderClient: Client) => {
    if (Array.isArray(msgs)) {
      const messagesByType = sortMessagesByType(msgs)
      messagesByType.subscribe.forEach(msg => processSubscribeMessage(msg, senderClient))
      messagesByType.unsubscribe.forEach(msg => processUnsubscribeMessage(msg, senderClient))
      topicStore.digest(messagesByType.action)
    }
    else {
      switch (msgs.type) {
        case MessageType.SUBSCRIBE: {
          processSubscribeMessage(msgs, senderClient)
          break
        }
        case MessageType.UNSUBSCRIBE: {
          processUnsubscribeMessage(msgs, senderClient)
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

  server.on('message', (rawData, senderClient) => {
    const rawDataStr = String(rawData)
    options.reporter?.onClientMessage?.(senderClient, rawDataStr, options)
    const msgs = JSON.parse(rawDataStr) as Message | Message[]
    processMessage(msgs, senderClient)
  })

  server.on('disconnect', client => {
    const topicNamesUnsubscribedFrom = topicStore.unsubscribeClientFromAllTopics(client.uuid)
    options.reporter?.onClientDisconnect?.(client, topicNamesUnsubscribedFrom, options)
  })

  return {
    server,
    close: () => server.close(),
  }
}
