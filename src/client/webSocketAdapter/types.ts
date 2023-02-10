import { ConnectionStatus } from '../../util/connectionStatus'
import { Logger } from '../../util/logging'
import { WebSocketEventHandlerMap, WebSocketEventName } from '../types'

export type WebSocketAdapterOptions = {
  deserializer?: (msg: string) => any
  serializer?: (msg: any) => string
  logger?: Logger
}

/**
 * @returns Listener uuid
 */
export type WebSocketAdapterOnFn<TMessage extends any = any> = <
  TEvent extends WebSocketEventName,
>(event: TEvent, handler: WebSocketEventHandlerMap<TMessage>[TEvent]) => string

export type WebSocketAdapter<TMessage extends any = any> = {
  connectionStatus: ConnectionStatus
  connect: (host: string, port: number) => Promise<WebSocket>
  send: (msg: TMessage | TMessage[]) => void
  disconnect: () => Promise<void>
  once: WebSocketAdapterOnFn<TMessage>
  on: WebSocketAdapterOnFn<TMessage>
  off: (uuid: string) => void
}
