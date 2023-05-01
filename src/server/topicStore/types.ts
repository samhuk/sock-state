import { Topic, TopicOptionsWithoutName } from './topic/types'

import { ActionMessage } from '../../message/types'
import { Client } from '../../common/server/clientStore/types'
import { Subscriber } from '../subscriberStore/types'

export type TopicOptionsDict = {
  [topicName: string]: TopicOptionsWithoutName
}

export type TopicStoreOptions = {
  topics: TopicOptionsDict
}

export type TopicStore = {
  getTopic: (topicName: string) => Topic
  subscribeClientToTopic: (client: Client, topicName: string) => Subscriber
  unsubscribeClientFromTopic: (clientUuid: string, topicName: string) => boolean
  /**
   * @returns List of topic uuids that the given client was unsubscribed to.
   */
  unsubscribeClientFromAllTopics: (clientUuid: string) => string[]
  digest: (msgs: ActionMessage | ActionMessage[]) => void
}
