import { Client } from '../../common/server/clientStore/types'
import { ActionMessage } from '../../message/types'
import { Subscriber } from '../subscriberStore/types'
import { Topic, TopicOptionsWithoutName } from './topic/types'

export type TopicOptionsDict = {
  [topicName: string]: TopicOptionsWithoutName
}

export type TopicStoreOptions = {
  topics: TopicOptionsDict
}

export type TopicStore = {
  getTopic: (topicName: string) => Topic
  addSubscriber: (topicName: string, client: Client) => Subscriber
  removeSubscriber: (clientUuid: string) => void
  digest: (msgs: ActionMessage | ActionMessage[]) => void
}
