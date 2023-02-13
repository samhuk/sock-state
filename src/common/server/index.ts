import { WebSocketServer } from 'ws'
import { DEFAULT_LOGGER } from '../client/webSocketAdapter/common'
import { createListenerStore } from '../listenerStore'
import { createClientStore } from './clientStore'
import { Server, ServerEventNameHandlerMap, ServerEventNames, ServerOptions } from './types'

export const createServer = <
  TMessage extends any = any
>(options: ServerOptions): Server<TMessage> => {
  const logger = options.logger ?? DEFAULT_LOGGER

  const listenerStore = createListenerStore<ServerEventNames, ServerEventNameHandlerMap<TMessage>>()

  logger.log(`Creating web socket server at ws://${options.host}:${options.port}`)
  const wss = new WebSocketServer({ host: options.host, port: options.port })
  const clientStore = createClientStore()

  wss.on('connection', (ws, req) => {
    const client = clientStore.add({ ws })
    listenerStore.call('connect', client)
    logger.log(`${client.shortUuid} connected (${clientStore.count} clients).`)

    ws.on('message', msgData => {
      listenerStore.call('message', msgData as any, client)
    })

    ws.on('close', code => {
      listenerStore.call('disconnect', client)
      clientStore.remove(client.uuid)
      logger.log(`${client.shortUuid} disconnected (${clientStore.count} clients) (code: ${code}).`)
    })
  })

  return {
    getClients: () => clientStore.clients,
    close: () => wss.close(),
    once: (eventName, handler) => listenerStore.add(eventName, handler as any, { removeOnceCalled: true }),
    on: (eventName, handler) => listenerStore.add(eventName, handler as any),
    off: listenerUuid => listenerStore.remove(listenerUuid),
  }
}
