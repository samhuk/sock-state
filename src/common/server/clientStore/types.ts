import WebSocket from 'ws'

export type AddClientOptions = {
  uuid?: string
  ws: WebSocket
}

export type Client = {
  uuid: string
  shortUuid: string
  ws: WebSocket
}

export type Clients = { [uuid: string]: Client }

export type ClientStore = {
  clients: Clients
  clientList: Client[]
  count: number
  add: (options: AddClientOptions) => Client
  remove: (uuid: string) => void
}
