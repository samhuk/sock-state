import { ConnectionStatus } from '../util/connectionStatus'
import { WebSocketAdapter, WebSocketAdapterOnFn } from './webSocketAdapter/types'

export type ExtractMessageTypeFromOptions<
  TClientOptions extends { deserializer?: any }
> = TClientOptions extends { deserializer: any }
  ? TClientOptions['deserializer'] extends (msg: string) => any
    ? ReturnType<TClientOptions['deserializer']>
    : any
  : any

export type WebSocketEventName = 'connect' | 'disconnect' | 'message' | 'connection-status-change'

export type OnHandlerFn<
  TEvent extends WebSocketEventName = WebSocketEventName,
  TMessage extends any = any
> = TEvent extends 'message'
  ? (msg: TMessage | TMessage[]) => void
  : TEvent extends 'connection-status-change'
    ? (newStatus: ConnectionStatus, prevStatus: ConnectionStatus) => void
    : () => void

export type ClientOptions<
  TMessage extends any = any
> = {
  host: string
  port: number
  wsAdapter: WebSocketAdapter<TMessage>
  /**
   * @default JSON.parse()
   */
  deserializer?: (msg: string) => TMessage
  /**
   * @default JSON.stringify()
   */
  serializer?: (msg: TMessage) => string
}

export type Client<
  TMessage extends any = any
> = {
  connectionStatus: ConnectionStatus
  connect: () => Promise<void>
  send: (msg: TMessage) => void
  disconnect: () => Promise<void>
  once: WebSocketAdapterOnFn<TMessage>
  on: WebSocketAdapterOnFn<TMessage>
  off: (uuid: string) => void
}

export type BrowserClientOptions<
  TMessage extends any = any
> = {
  host: string
  port: number
  /**
   * @default JSON.parse()
   */
  deserializer?: (msg: string) => TMessage
  /**
   * @default JSON.stringify()
   */
  serializer?: (msg: TMessage) => string
}

export type NodeClientOptions<
  TMessage extends any = any
> = BrowserClientOptions<TMessage>
