import { IncomingMessage } from 'http'
import { RawData, WebSocket } from 'ws'
import { Client, Clients } from './clientStore/types'

export type ServerReporter = {
  onBegin?: (options: ServerOptions) => void
  onCreatingServer?: (options: ServerOptions) => void
  onCreateServer?: (options: ServerOptions) => void
  onClientConnect?: (ws: WebSocket, req: IncomingMessage) => void
  onClientUnaccepted?: (ws: WebSocket, req: IncomingMessage, data?: any) => void
  onClientAccepted?: (client: Client) => void
  onClientMessage?: (msgData: RawData) => void
  onClientDisconnect?: (client: Client) => void
}

export type ServerEventNames = 'connect' | 'connect-unaccepted' | 'connect-accepted' | 'disconnect' | 'message'

type ConnectionAcceptorDataTypeFromServerOptions<
  TServerOptions extends ServerOptions = ServerOptions
> = TServerOptions extends { connectionAcceptor: any }
  ? ReturnType<TServerOptions['connectionAcceptor']>['data']
  : undefined

export type ServerEventNameHandlerMap<
  TMessage extends any = any,
  TServerOptions extends ServerOptions = ServerOptions,
> = {
  connect: (ws: WebSocket, req: IncomingMessage) => void
  'connect-unaccepted': (ws: WebSocket, req: IncomingMessage, data: ConnectionAcceptorDataTypeFromServerOptions<TServerOptions>) => void
  'connect-accepted': (client: Client) => void
  disconnect: (client: Client) => void
  message: (msg: TMessage, sender: Client) => void
}

export type OnHandlerFn<
  TEvent extends ServerEventNames = ServerEventNames,
  TMessage extends any = any,
  TServerOptions extends ServerOptions = ServerOptions,
> = ServerEventNameHandlerMap<TMessage, TServerOptions>[TEvent]

/**
 * @returns Listener uuid
 */
export type OnFn<
  TMessage extends any = any,
  TServerOptions extends ServerOptions = ServerOptions,
> = <
  TEvent extends ServerEventNames,
>(event: TEvent, handler: OnHandlerFn<TEvent, TMessage, TServerOptions>) => string

export type ConnectionAcceptor = (ws: WebSocket, req: IncomingMessage) => {
  /**
   * Determines of the connection is accepted.
   */
  accepted: boolean
  /**
   * Optional additional data to add for the connection rejection.
   */
  data?: any
}

export type ServerOptions = {
  host: string
  port: number
  reporter?: ServerReporter
  connectionAcceptor?: ConnectionAcceptor
}

export type Server<
  TMessage extends any = any,
  TServerOptions extends ServerOptions = ServerOptions,
> = {
  clients: Clients
  getClient: (uuid: string) => Client
  disconnectClient: (uuid: string, data?: any) => boolean
  close: () => void
  once: OnFn<RawData, TServerOptions>
  on: OnFn<RawData, TServerOptions>
  off: (uuid: string) => void
}
