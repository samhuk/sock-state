import { ConnectionAcceptor, Server } from '../common/server/types'
import { Topic, TopicOptions } from './topicStore/topic/types'

import { Client } from '../common/server/clientStore/types'
import { StoreServerReporter } from './reporter/types'
import { TopicOptionsDict } from './topicStore/types'

export type SubscriptionAcceptor<TResultReason extends any = any> =
  (client: Client, topic: Topic) => boolean | { accepted: boolean, reason: TResultReason }

export type StoreServer = {
  server: Server
  getTopic: (topicName: string) => Topic
  getTopicList: () => Topic[]
  /**
   * Adds a new topic to the store server.
   */
  addTopic: (options: TopicOptions) => Topic
  /**
   * Deletes a topic.
   *
   * This will remove all listeners associated with the topic and will notify any clients
   * that are subscribed to the topic that it has been deleted.
   *
   * @returns `true` whether the given `topicName` corresponded to an existing topic. `false` if not.
   */
  deleteTopic: (topicName: string, data?: any) => boolean
  /**
   * Disconnects a client.
   *
   * Additional `data` can be provided to the client, such as in order to inform it of the disconnect reason.
   *
   * @returns `true` whether the given `clientUuid` corresponded to a connected client. `false` if not.
   */
  disconnectClient: (clientUuid: string, data?: any) => boolean
  /**
   * Closes the store server.
   *
   * This will disconnect any and all connected clients.
   */
  close: () => void
}

export type StoreServerOptions<
  TSubscriptionAcceptorResultReason extends any = any
> = {
  /**
   * The IP address or host name that the store server will bind to.
   */
  host: string
  /**
   * The port number that the store server will bind to.
   */
  port: number
  /**
   * Optional pre-defined topics of the store server that clients will be able
   * to subscribe to.
   */
  topics?: TopicOptionsDict
  subscriptionAcceptor?: SubscriptionAcceptor<TSubscriptionAcceptorResultReason>
  /**
   * Optional reporter for the store server.
   *
   * This is useful for logging the various events of the store server.
   */
  reporter?: StoreServerReporter<TSubscriptionAcceptorResultReason>
  /**
   * Optional function that determines if a connection to the Web Socket server will be accepted
   * or rejected (therefore instantly closed).
   */
  connectionAcceptor?: ConnectionAcceptor
}
