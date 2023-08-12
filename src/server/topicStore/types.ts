import { Topic, TopicOptions, TopicOptionsWithoutName } from './topic/types'

import { ActionMessage } from '../../message/types'
import { Client } from '../../common/server/clientStore/types'
import { Subscriber } from '../subscriberStore/types'

export type TopicOptionsDict = {
  [topicName: string]: TopicOptionsWithoutName
}

export type TopicStoreOptions = {
  topics?: TopicOptionsDict
}

export type TopicStore = {
  getTopic: (topicName: string) => Topic
  getTopicList: () => Topic[]
  addTopic: (options: TopicOptions) => Topic
  /**
   * @returns `true` if given topic exists (therefore was removed), `false` if not.
   */
  deleteTopic: (topicName: string, data?: any) => boolean
  /**
   * @returns
   * * A `Subscriber` object if successful.
   * * `undefined` if topic does not exist by given `topicName`
   */
  subscribeClientToTopic: (client: Client, topicName: string) => Subscriber | undefined
  /**
   * @returns
   * * `true` if the client was indeed subscribed to the topic.
   * * `false` if not.
   * * `undefined` if the topic doesn't exist.
   */
  unsubscribeClientFromTopic: (clientUuid: string, topicName: string) => boolean | undefined
  /**
   * @returns List of topic uuids that the given client was unsubscribed to.
   */
  unsubscribeClientFromAllTopics: (clientUuid: string) => string[]
  digest: (msgs: ActionMessage | ActionMessage[]) => void
}
