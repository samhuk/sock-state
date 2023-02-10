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
    const msgs = JSON.parse(String(rawData)) as Message | Message[]
    processMessage(msgs, senderClient)
  })

  server.on('disconnect', client => {
    topicStore.removeSubscriber(client.uuid)
  })

  return {
    server,
  }
}
