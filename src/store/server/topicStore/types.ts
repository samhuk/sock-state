import { Client } from '../../../server/clientStore/types'
import { ActionMessage } from '../../message/types'
import { Subscriber } from '../subscriberStore/types'
import { TopicOptionsWithoutName } from './topic/types'

export type TopicOptionsDict = {
  [topicName: string]: TopicOptionsWithoutName
}

export type TopicStoreOptions = {
  topics: TopicOptionsDict
}

export type TopicStore = {
  addSubscriber: (topicName: string, client: Client) => Subscriber
  removeSubscriber: (clientUuid: string) => void
  broadcast: (msgs: ActionMessage | ActionMessage[]) => void
}
