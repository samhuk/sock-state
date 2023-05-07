import { Client, ClientStore, Clients } from './types'

// eslint-disable-next-line import/order
import { v4 as uuidv4 } from 'uuid'

/**
 * Stores Web Socket clients
 */
export const createClientStore = () => {
  let instance: ClientStore

  return instance = {
    clients: { } as Clients,
    getClientList: () => Object.values(instance.clients),
    count: 0,
    clientList: [] as Client[], // TODO: Not sure why this is required
    add: options => {
      const uuid = options.uuid ?? uuidv4()
      const client: Client = {
        uuid,
        shortUuid: uuid.substring(0, 8), // Because that's what Docker does
        ws: options.ws,
        req: options.req,
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
