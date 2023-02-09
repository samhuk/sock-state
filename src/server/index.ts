import { WebSocketServer } from 'ws'
import { createListenerStore } from '../listenerStore'
import { Logger } from '../util/logging'
import { createClientStore } from './clientStore'
import { Server, ServerEventNames, ServerOptions } from './types'

export const createServer = <
  TMessage extends any = any
>(options: ServerOptions): Server<TMessage> => {
  const logger: Logger = {
    log: msg => console.log(msg),
  }
  const listenerStore = createListenerStore<ServerEventNames>()

  logger.log(`Creating web socket server at ws://${options.host}:${options.port}`)
  const wss = new WebSocketServer({ host: options.host, port: options.port })
  const clientStore = createClientStore()

  wss.on('connection', ws => {
    const client = clientStore.add({ ws })
    listenerStore.call('connect', client)
    logger.log(`${client.shortUuid} connected (${clientStore.count} clients).`)

    ws.on('message', msgData => {
      listenerStore.call('message', msgData)
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
    once: (eventName, handler) => listenerStore.add(eventName, handler, { removeOnceCalled: true }),
    on: (eventName, handler) => listenerStore.add(eventName, handler),
    off: listenerUuid => listenerStore.remove(listenerUuid),
  }
}
