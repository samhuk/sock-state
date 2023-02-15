import { sortActionMessagesByTopic } from '../../message'
import { createTopic } from './topic'
import { Topic } from './topic/types'
import { TopicStore, TopicStoreOptions } from './types'

export const createTopicStore = (options: TopicStoreOptions): TopicStore => {
  let instance: TopicStore
  const topics: { [topicName: string]: Topic } = {}

  Object.entries(options.topics).forEach(([topicName, topicOptions]) => {
    topics[topicName] = createTopic(topicName, topicOptions)
  })

  return instance = {
    getTopic: topicName => topics[topicName],
    addSubscriber: (topicName, client) => topics[topicName]?.addSubscriber(client),
    removeSubscriber: clientUuid => {
      Object.values(topics).forEach(topic => topic.removeSubscriber(clientUuid))
    },
    digest: msgs => {
      if (Array.isArray(msgs)) {
        Object.entries(sortActionMessagesByTopic(msgs)).forEach(([topicName, _msgs]) => {
          topics[topicName].digest(_msgs)
        })
      }
      else {
        topics[msgs.data.topic].digest(msgs)
      }
    },
  }
}
