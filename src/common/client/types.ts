import { WebSocketAdapter, WebSocketAdapterOnFn } from './webSocketAdapter/types'

import { ConnectionStatus } from '../connectionStatus'
import { DisconnectInfo } from '../types'

export type ExtractMessageTypeFromOptions<
  TClientOptions extends { deserializer?: any }
> = TClientOptions extends { deserializer: any }
  ? TClientOptions['deserializer'] extends (msg: string) => any
    ? ReturnType<TClientOptions['deserializer']>
    : any
  : any

export type WebSocketEventName = 'connect-attempt-start' | 'connect' | 'connect-attempt-fail' | 'disconnect' | 'message' | 'connection-status-change'

export type WebSocketEventHandlerMap<TMessage extends any = any> = {
  connect: (host: string, port: number) => void
  disconnect: (host: string, port: number, info: DisconnectInfo) => void
  'connection-status-change': (newStatus: ConnectionStatus, prevStatus: ConnectionStatus) => void
  message: (msg: TMessage | TMessage[]) => void
  'connect-attempt-fail': (host: string, port: number) => void
  'connect-attempt-start': (host: string, port: number) => void
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
