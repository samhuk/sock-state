import WebSocket, { RawData } from 'ws'
import { wait } from '../../util/async'
import { ConnectionStatus } from '../../util/connectionStatus'
import { Logger } from '../../util/logging'
import { createListenerStore } from '../../listenerStore'
import { WebSocketEventHandlerMap, WebSocketEventName } from '../types'
import { WebSocketAdapter, WebSocketAdapterOptions } from './types'
import { DEFAULT_LOGGER } from './common'

const _connect = (host: string, port: number, logger: Logger, retryDelayMs: number, onConnect: (ws: WebSocket) => void) => {
  let ws: WebSocket
  ws = new WebSocket(`ws://${host}:${port}`)
  ws.onerror = () => {} // onClose function below will handle failed connection logic. This prevents crashes in nodejs envs.
  let onOpen: () => void = null
  let onClose: () => void = null
  onOpen = () => {
    ws.removeEventListener('open', onOpen)
    ws.removeEventListener('close', onClose)
    logger.log('Connected.')
    onConnect(ws)
  }
  onClose = () => {
    ws.removeEventListener('open', onOpen)
    ws.removeEventListener('close', onClose)
    ws.close()
    ws = null
    logger.log('Failed to connect. Trying again.')
    wait(retryDelayMs).then(() => {
      _connect(host, port, logger, retryDelayMs, onConnect)
    })
  }
  ws.addEventListener('open', onOpen)
  ws.addEventListener('close', onClose)
}

const connect = (host: string, port: number, logger: Logger, retryDelayMs: number) => new Promise<WebSocket>(res => {
  logger.log(`Trying to connect at ${host}:${port}.`)
  _connect(host, port, logger, retryDelayMs, res)
})

export const createNodeWebSocketAdapter = <TMessage extends any>(
  options: WebSocketAdapterOptions,
): WebSocketAdapter<TMessage> => {
  let ws: WebSocket
  let instance: WebSocketAdapter<TMessage>
  let previousHost: string
  let previousPort: number
  let manuallyClosed: boolean = false
  const serializer = options.serializer ?? (msg => JSON.stringify(msg))
  const deserializer = options.deserializer ?? (msg => JSON.parse(msg))
  const listenerStore = createListenerStore<WebSocketEventName, WebSocketEventHandlerMap>()

  const logger = options.logger ?? DEFAULT_LOGGER

  const changeConnectionStatus = (newStatus: ConnectionStatus) => {
    const prevStatus = instance.connectionStatus
    instance.connectionStatus = newStatus
    listenerStore.call('connection-status-change', newStatus, prevStatus)
  }

  const onConnecting = () => {
    changeConnectionStatus(ConnectionStatus.CONNECTING)
  }

  const onConnect = () => {
    changeConnectionStatus(ConnectionStatus.CONNECTED)
    listenerStore.call('connect')
  }

  const onDisconnect = () => {
    changeConnectionStatus(ConnectionStatus.DISCONNECTED)
    listenerStore.call('disconnect')
    // Try to reconnect
    if (!manuallyClosed)
      instance.connect(previousHost, previousPort)
  }

  const onMessage = (rawData: RawData) => {
    const msg = deserializer(String(rawData)) as TMessage
    listenerStore.call('message', msg)
  }

  return instance = {
    connectionStatus: ConnectionStatus.DISCONNECTED,
    connect: async (host, port) => {
      manuallyClosed = false // Reset manaully closed flag
      previousHost = host
      previousPort = port

      if (ws?.readyState === WebSocket.OPEN)
        instance.disconnect()

      onConnecting()
      ws = await connect(host, port, logger, 1000)
      ws.addEventListener('close', () => onDisconnect())
      ws.on('message', rawData => onMessage(rawData))
      onConnect()
      return ws as any
    },
    send: msg => ws?.send(serializer(msg)),
    disconnect: () => new Promise(res => {
      manuallyClosed = true
      instance.once('disconnect', res)
      ws?.close()
    }),
    once: (eventName, handler) => listenerStore.add(eventName, handler as any, { removeOnceCalled: true }),
    on: (eventName, handler) => listenerStore.add(eventName, handler as any),
    off: listenerUuid => listenerStore.remove(listenerUuid),
  }
}
