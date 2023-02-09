import { randomUUID } from 'crypto'
import { Client, ClientStore } from './types'

/**
 * Stores Web Socket clients
 */
export const createClientStore = () => {
  let instance: ClientStore

  return instance = {
    clients: { },
    count: 0,
    clientList: [] as Client[], // TODO: Not sure why this is required
    add: options => {
      const uuid = options.uuid ?? randomUUID()
      const client: Client = {
        uuid,
        ws: options.ws,
        shortUuid: uuid.substring(0, 8), // Because that's what Docker does
      }
      instance.clients[client.uuid] = client
      instance.clientList.push(client)
      instance.count += 1
      return client
    },
    remove: uuid => {
      const client = instance.clients[uuid]
      if (client == null)
        return

      instance.clientList.splice(instance.clientList.indexOf(client), 1)
      delete instance.clients[uuid]
      instance.count -= 1
    },
  }
}
