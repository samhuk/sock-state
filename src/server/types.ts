import { RawData } from 'ws'
import { Client, Clients } from './clientStore/types'

export type ServerEventNames = 'connect' | 'disconnect' | 'message'

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
