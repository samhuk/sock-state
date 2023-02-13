import { ConnectionStatus } from '../connectionStatus'
import { Logger } from '../logging'
import { WebSocketAdapter, WebSocketAdapterOnFn } from './webSocketAdapter/types'

export type ExtractMessageTypeFromOptions<
  TClientOptions extends { deserializer?: any }
> = TClientOptions extends { deserializer: any }
  ? TClientOptions['deserializer'] extends (msg: string) => any
    ? ReturnType<TClientOptions['deserializer']>
    : any
  : any

export type WebSocketEventName = 'connect' | 'disconnect' | 'message' | 'connection-status-change'

export type WebSocketEventHandlerMap<TMessage extends any = any> = {
  connect: () => void
  disconnect: () => void
  'connection-status-change': (newStatus: ConnectionStatus, prevStatus: ConnectionStatus) => void
  message: (msg: TMessage | TMessage[]) => void
}

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
  logger?: Logger
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
  logger?: Logger
}

export type NodeClientOptions<
  TMessage extends any = any
> = BrowserClientOptions<TMessage>
