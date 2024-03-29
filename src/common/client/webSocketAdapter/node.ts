import WebSocket, { RawData } from 'ws'
import { WebSocketAdapter, WebSocketAdapterOptions } from './types'
import { WebSocketEventHandlerMap, WebSocketEventName } from '../types'

import { ConnectionStatus } from '../../connectionStatus'
import { createListenerStore } from '../../listenerStore'
import { parseDisconnectReason } from './common'
import { wait } from '../../async'

const _connect = (host: string, port: number, retryDelayMs: number, onConnect: (ws: WebSocket) => void, onConnectAttemptFail: () => void) => {
  let ws: WebSocket
  ws = new WebSocket(`ws://${host}:${port}`)
  ws.onerror = () => {} // onClose function below will handle failed connection logic. This prevents crashes in nodejs envs.
  let onOpen: () => void
  let onClose: () => void
  // eslint-disable-next-line prefer-const
  onOpen = () => {
    ws.removeEventListener('open', onOpen)
    ws.removeEventListener('close', onClose)
    onConnect(ws)
  }
  onClose = () => {
    ws.removeEventListener('open', onOpen)
    ws.removeEventListener('close', onClose)
    ws.close()
    // We do an ignore here as the required JS logic to avoid this is extensive and adds overhead
    // @ts-ignore
    ws = undefined
    wait(retryDelayMs).then(() => {
      _connect(host, port, retryDelayMs, onConnect, onConnectAttemptFail)
    })
  }
  ws.addEventListener('open', onOpen)
  ws.addEventListener('close', onClose)
}

const connect = (host: string, port: number, retryDelayMs: number, onConnectAttemptFail: () => void) => new Promise<WebSocket>(res => {
  _connect(host, port, retryDelayMs, res, onConnectAttemptFail)
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

  const changeConnectionStatus = (newStatus: ConnectionStatus) => {
    const prevStatus = instance.connectionStatus
    instance.connectionStatus = newStatus
    listenerStore.call('connection-status-change', newStatus, prevStatus)
  }

  const onConnecting = (host: string, port: number) => {
    changeConnectionStatus(ConnectionStatus.CONNECTING)
    listenerStore.call('connect-attempt-start', host, port)
  }

  const onConnect = (host: string, port: number) => {
    changeConnectionStatus(ConnectionStatus.CONNECTED)
    listenerStore.call('connect', host, port)
  }

  const onDisconnect = (host: string, port: number, reason: string) => {
    const disconnectInfo = parseDisconnectReason(reason)
    changeConnectionStatus(ConnectionStatus.DISCONNECTED)
    listenerStore.call('disconnect', host, port, disconnectInfo)
    // Try to reconnect if it wasn't because of a rejection
    if (!manuallyClosed && disconnectInfo.reason !== 'rejected')
      instance.connect(previousHost, previousPort)
  }

  const onMessage = (rawData: RawData) => {
    const msg = deserializer(String(rawData)) as TMessage
    listenerStore.call('message', msg)
  }

  const onConnectAttempFail = (host: string, port: number) => {
    listenerStore.call('connect-attempt-fail', host, port)
  }

  return instance = {
    connectionStatus: ConnectionStatus.DISCONNECTED,
    connect: async (host, port) => {
      manuallyClosed = false // Reset manaully closed flag
      previousHost = host
      previousPort = port

      if (ws?.readyState === WebSocket.OPEN)
        instance.disconnect()

      onConnecting(host, port)
      ws = await connect(host, port, 1000, () => onConnectAttempFail(host, port))
      ws.addEventListener('close', e => onDisconnect(host, port, e.reason))
      ws.on('message', rawData => onMessage(rawData))
      onConnect(host, port)
      return ws as any
    },
    send: msg => ws?.send(serializer(msg)),
    disconnect: () => new Promise(res => {
      manuallyClosed = true
      instance.once('disconnect', () => res())
      ws?.close()
    }),
    once: (eventName, handler) => listenerStore.add(eventName, handler as any, { removeOnceCalled: true }),
    on: (eventName, handler) => listenerStore.add(eventName, handler as any),
    off: listenerUuid => listenerStore.remove(listenerUuid),
  }
}
