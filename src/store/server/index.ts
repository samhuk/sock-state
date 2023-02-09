import { createServer } from '../../server'
import { Client } from '../../server/clientStore/types'
import { sortMessagesByType } from '../message'
import { Message, MessageType, SubscribeMessage } from '../message/types'
import { createTopicStore } from './topicStore'
import { StoreServer, StoreServerOptions } from './types'

export const createStoreServer = (options: StoreServerOptions): StoreServer => {
  const server = createServer({
    host: options.host,
    port: options.port,
  })

  const topicStore = createTopicStore({
    topics: options.topics,
  })

  const processSubscribeMessage = (msg: SubscribeMessage, senderClient: Client) => {
    const topicNames = Array.isArray(msg.data.topics) ? msg.data.topics : [msg.data.topics]
    topicNames.forEach(topicName => topicStore.addSubscriber(topicName, senderClient))
  }

  const processMessage = (msg: Message, senderClient: Client) => {
    switch (msg.type) {
      case MessageType.SUBSCRIBE: {
        processSubscribeMessage(msg, senderClient)
        break
      }
      case MessageType.ACTION: {
        topicStore.broadcast(msg)
        break
      }
      default:
        break
    }
  }

  const processMessageBatch = (msgs: Message[], senderClient: Client) => {
    const messagesByType = sortMessagesByType(msgs)
    messagesByType.subscribe.forEach(msg => processSubscribeMessage(msg, senderClient))
    topicStore.broadcast(messagesByType.action)
  }

  server.on('message', (rawData, senderClient) => {
    const msg = JSON.parse(String(rawData)) as Message | Message[]

    if (Array.isArray(msg))
      processMessageBatch(msg, senderClient)
    else
      processMessage(msg, senderClient)
  })

  server.on('disconnect', client => {
    topicStore.removeSubscriber(client.uuid)
  })

  return {
    server,
  }
}
