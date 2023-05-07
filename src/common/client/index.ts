import { Client, ClientOptions, ExtractMessageTypeFromOptions, WebSocketEventHandlerMap, WebSocketEventName } from './types'

import { ConnectionStatus } from '../connectionStatus'
import { createListenerStore } from '../listenerStore'
import { createMessageSender } from './messageSender'

export const createClient = <TClientOptions extends ClientOptions>(
  options: TClientOptions,
): Client<ExtractMessageTypeFromOptions<TClientOptions>> => {
  let instance: Client
  const messageSender = createMessageSender(options.wsAdapter)
  const listenerStore = createListenerStore<WebSocketEventName, WebSocketEventHandlerMap>()

  // Keep our connection status up-to-date
  options.wsAdapter.on('connection-status-change', (newStatus, prevStatus) => {
    instance.connectionStatus = newStatus
    listenerStore.call('connection-status-change', newStatus, prevStatus)
  })

  options.wsAdapter.on('message', msg => {
    listenerStore.call('message', msg)
  })

  options.wsAdapter.on('connect', (host, port) => {
    listenerStore.call('connect', host, port)
  })

  options.wsAdapter.on('disconnect', (host, port, info) => {
    listenerStore.call('disconnect', host, port, info)
  })

  options.wsAdapter.on('connect-attempt-fail', (host, port) => {
    listenerStore.call('connect-attempt-fail', host, port)
  })

  options.wsAdapter.on('connect-attempt-start', (host, port) => {
    listenerStore.call('connect-attempt-start', host, port)
  })

  return instance = {
    connectionStatus: ConnectionStatus.DISCONNECTED,
    connect: async () => {
      await options.wsAdapter.connect(options.host, options.port)
    },
    send: msg => messageSender.send(msg),
    disconnect: () => options.wsAdapter.disconnect(),
    once: (eventName, handler) => listenerStore.add(eventName, handler as any, { removeOnceCalled: true }),
    on: (eventName, handler) => listenerStore.add(eventName, handler as any),
    off: listenerUuid => listenerStore.remove(listenerUuid),
  }
}
