import { Client } from '../../common/server/clientStore/types'
import { Message } from '../../message/types'

export type AddSubscriberResult = { isNew: boolean, subscriber: Subscriber }

export type SubscriberOptions = {
  client: Client
}

export type Subscriber = {
  client: Client
  dateSubscribed: number
}

export type Subscribers = {
  [clientUuid: string]: Subscriber
}

export type SubscriberStore = {
  numSubscribers: number
  subscribers: Subscribers
  add: (subscriber: SubscriberOptions) => AddSubscriberResult
  /**
   * @returns `true` if subscriber existed, `false` if it didn't exist.
   */
  remove: (clientUuid: string) => boolean
  broadcastMessage: (msg: Message | Message[]) => void
}
