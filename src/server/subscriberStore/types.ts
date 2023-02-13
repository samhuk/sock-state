import { Client } from '../../common/server/clientStore/types'
import { ActionMessage } from '../../message/types'

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
  add: (subscriber: SubscriberOptions) => Subscriber
  remove: (clientUuid: string) => void
  broadcast: (msg: ActionMessage | ActionMessage[]) => void
}
