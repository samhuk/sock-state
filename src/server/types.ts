import { Server } from '../common/server/types'
import { TopicOptionsDict } from './topicStore/types'

export type StoreServer = {
  server: Server
  /**
   * Closes the store server.
   *
   * This will disconnect any and all connected clients.
   */
  close: () => void
}

export type StoreServerOptions = {
  /**
   * The IP address or host name that the store server will bind to.
   */
  host: string
  /**
   * The port number that the store server will bind to.
   */
  port: number
  /**
   * The pre-defined topics of the store server that clients will be able
   * to subscribe to.
   */
  topics: TopicOptionsDict
}
