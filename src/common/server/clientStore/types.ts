import { IncomingMessage } from 'http'
import WebSocket from 'ws'

export type AddClientOptions = {
  uuid?: string
  ws: WebSocket
  req: IncomingMessage
}

export type Client = {
  uuid: string
  shortUuid: string
  ws: WebSocket
  req: IncomingMessage
}

export type Clients = { [uuid: string]: Client }

export type ClientStore = {
  clients: Clients
  getClientList: () => Client[]
  clientList: Client[]
  count: number
  add: (options: AddClientOptions) => Client
  remove: (uuid: string) => void
}
