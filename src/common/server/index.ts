import { WebSocketServer } from 'ws'
import { createListenerStore } from '../listenerStore'
import { createClientStore } from './clientStore'
import { Server, ServerEventNameHandlerMap, ServerEventNames, ServerOptions } from './types'

export const createServer = <
  TMessage extends any = any
>(options: ServerOptions): Server<TMessage> => {
  options.reporter?.onBegin?.(options)
  const listenerStore = createListenerStore<ServerEventNames, ServerEventNameHandlerMap<TMessage>>()

  options.reporter?.onCreatingServer?.(options)
  const wss = new WebSocketServer({ host: options.host, port: options.port })
  options.reporter?.onCreateServer?.(options)
  const clientStore = createClientStore()

  wss.on('connection', (ws, req) => {
    const client = clientStore.add({ ws })
    listenerStore.call('connect', client)
    options.reporter?.onClientConnect?.(client, options)

    ws.on('message', msgData => {
      options.reporter?.onClientMessage?.(msgData, options)
      listenerStore.call('message', msgData as any, client)
    })

    ws.on('close', code => {
      listenerStore.call('disconnect', client)
      clientStore.remove(client.uuid)
      options.reporter?.onClientDisconnect?.(client, options)
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
