import { StoreServer, StoreServerOptions } from './types'

import { Message } from '../message/types'
import { createMessageProcessor } from './messageProcessor'
import { createServer } from '../common/server'
import { createTopicStore } from './topicStore'

export const createStoreServer = (options: StoreServerOptions): StoreServer => {
  options.reporter?.onBegin?.(options)
  const server = createServer({
    host: options.host,
    port: options.port,
    reporter: {
      onCreateServer: () => options.reporter?.onCreateServer?.(options),
      onCreatingServer: () => options.reporter?.onCreatingServer?.(options),
      onClientConnect: (ws, req) => options.reporter?.onClientConnect?.(ws, req),
      onClientUnaccepted: (ws, req, data) => options.reporter?.onClientUnaccepted?.(ws, req, data),
      onClientAccepted: client => options.reporter?.onClientAccepted?.(client),
      // onClientDisconnect and onClientMessage are listened-to seperately below
    },
    connectionAcceptor: options.connectionAcceptor,
  })

  const topicStore = createTopicStore({
    topics: options.topics,
  })

  const messageProcessor = createMessageProcessor({
    topicStore,
    reporter: options.reporter,
  })

  server.on('message', (rawData, senderClient) => {
    const rawDataStr = String(rawData)
    options.reporter?.onClientMessage?.(senderClient, rawDataStr, options)
    const msgs = JSON.parse(rawDataStr) as Message | Message[]
    messageProcessor.process(msgs, senderClient)
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
