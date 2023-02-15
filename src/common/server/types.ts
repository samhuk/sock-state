import { RawData } from 'ws'
import { Client, Clients } from './clientStore/types'

export type ServerReporter = {
  onBegin?: (options: ServerOptions) => void
  onCreatingServer?: (options: ServerOptions) => void
  onCreateServer?: (options: ServerOptions) => void
  onClientConnect?: (client: Client, options: ServerOptions) => void
  onClientMessage?: (msgData: RawData, options: ServerOptions) => void
  onClientDisconnect?: (client: Client, options: ServerOptions) => void
}

export type ServerEventNames = 'connect' | 'disconnect' | 'message'

export type ServerEventNameHandlerMap<TMessage extends any = any> = {
  connect: (client: Client) => void
  disconnect: (client: Client) => void
  message: (msg: TMessage, sender: Client) => void
}

export type OnHandlerFn<
  TEvent extends ServerEventNames = ServerEventNames,
  TMessage extends any = any
> = TEvent extends 'message'
  ? (msg: TMessage, senderClient: Client) => void
  : (client: Client) => void

/**
 * @returns Listener uuid
 */
export type OnFn<TMessage extends any = any> = <
  TEvent extends ServerEventNames,
>(event: TEvent, handler: OnHandlerFn<TEvent, TMessage>) => string

export type ServerOptions = {
  host: string
  port: number
  reporter?: ServerReporter
}

export type Server<
  TMessage extends any = any
> = {
  getClients: () => Clients
  close: () => void
  once: OnFn<RawData>
  on: OnFn<RawData>
  off: (uuid: string) => void
}
