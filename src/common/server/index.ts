import { Server, ServerEventNameHandlerMap, ServerEventNames, ServerOptions } from './types'

import { DisconnectInfo } from '../types'
// eslint-disable-next-line import/order
import { WebSocketServer } from 'ws'
import { createClientStore } from './clientStore'
import { createListenerStore } from '../listenerStore'

export const createServer = <
  TMessage extends any = any,
  TServerOptions extends ServerOptions = ServerOptions,
>(options: TServerOptions): Server<TMessage, TServerOptions> => {
  options.reporter?.onBegin?.(options)
  const listenerStore = createListenerStore<ServerEventNames, ServerEventNameHandlerMap<TMessage>>()

  options.reporter?.onCreatingServer?.(options)
  const wss = new WebSocketServer({ host: options.host, port: options.port })
  options.reporter?.onCreateServer?.(options)
  const clientStore = createClientStore()

  wss.on('connection', (ws, req) => {
    listenerStore.call('connect', ws, req)
    options.reporter?.onClientConnect?.(ws, req)

    const connectionAcceptorResult = options.connectionAcceptor?.(ws, req)
    if (connectionAcceptorResult?.accepted === false) {
      listenerStore.call('connect-unaccepted', ws, req, connectionAcceptorResult.data)
      options.reporter?.onClientUnaccepted?.(ws, req, connectionAcceptorResult.data)
      const disconnectData: DisconnectInfo = { reason: 'rejected', data: connectionAcceptorResult.data }
      ws.close(1008, JSON.stringify(disconnectData))
      return
    }

    const client = clientStore.add({ ws, req })
    listenerStore.call('connect-accepted', client)
    options.reporter?.onClientAccepted?.(client)

    ws.on('message', msgData => {
      options.reporter?.onClientMessage?.(msgData)
      listenerStore.call('message', msgData as any, client)
    })

    ws.on('close', code => {
      listenerStore.call('disconnect', client)
      clientStore.remove(client.uuid)
      options.reporter?.onClientDisconnect?.(client)
    })
  })

  return {
    clients: clientStore.clients,
    getClient: uuid => clientStore.clients[uuid],
    close: () => wss.close(),
    once: (eventName, handler) => listenerStore.add(eventName, handler as any, { removeOnceCalled: true }),
    on: (eventName, handler) => listenerStore.add(eventName, handler as any),
    off: listenerUuid => listenerStore.remove(listenerUuid),
  }
}
