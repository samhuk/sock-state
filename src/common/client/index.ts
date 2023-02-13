import { ConnectionStatus } from '../connectionStatus'
import { createListenerStore } from '../listenerStore'
import { createMessageSender } from './messageSender'
import { Client, ClientOptions, ExtractMessageTypeFromOptions, WebSocketEventHandlerMap, WebSocketEventName } from './types'

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

  options.wsAdapter.on('connect', () => {
    listenerStore.call('connect')
  })

  options.wsAdapter.on('disconnect', () => {
    listenerStore.call('disconnect')
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
