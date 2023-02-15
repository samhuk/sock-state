import { createServer } from '../common/server'
import { Client } from '../common/server/clientStore/types'
import { sortMessagesByType } from '../message'
import { Message, MessageType, SubscribeMessage } from '../message/types'
import { createTopicStore } from './topicStore'
import { StoreServer, StoreServerOptions } from './types'

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
      topicStore.addSubscriber(topicName, senderClient)
      options.reporter?.onClientSubscribeTopic?.(senderClient, topicStore.getTopic(topicName))
    })
  }

  const processMessage = (msgs: Message | Message[], senderClient: Client) => {
    if (Array.isArray(msgs)) {
      const messagesByType = sortMessagesByType(msgs)
      messagesByType.subscribe.forEach(msg => processSubscribeMessage(msg, senderClient))
      topicStore.digest(messagesByType.action)
    }
    else {
      switch (msgs.type) {
        case MessageType.SUBSCRIBE: {
          processSubscribeMessage(msgs, senderClient)
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
    options.reporter?.onClientDisconnect?.(client, options)
    topicStore.removeSubscriber(client.uuid)
  })

  return {
    server,
    close: () => server.close(),
  }
}
