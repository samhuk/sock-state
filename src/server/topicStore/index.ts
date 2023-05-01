import { TopicStore, TopicStoreOptions } from './types'

import { Topic } from './topic/types'
import { createTopic } from './topic'
import { sortActionMessagesByTopic } from '../../message'

export const createTopicStore = (options: TopicStoreOptions): TopicStore => {
  let instance: TopicStore
  const topics: { [topicName: string]: Topic } = {}

  Object.entries(options.topics).forEach(([topicName, topicOptions]) => {
    topics[topicName] = createTopic(topicName, topicOptions)
  })

  const clientUuidToSubscribedTopicNames: { [clientUuid: string]: { [topicName: string]: boolean } } = {}

  return instance = {
    getTopic: topicName => topics[topicName],
    subscribeClientToTopic: (client, topicName) => {
      const addSubscriberResult = topics[topicName]?.subscribeClient(client)
      if (addSubscriberResult.isNew) {
        if (clientUuidToSubscribedTopicNames[client.uuid] == null)
          clientUuidToSubscribedTopicNames[client.uuid] = {}

        clientUuidToSubscribedTopicNames[client.uuid][topicName] = true
      }

      return addSubscriberResult.subscriber
    },
    unsubscribeClientFromTopic: (clientUuid, topicName) => {
      const wasSubscribed = topics[topicName]?.unsubscribeClient(clientUuid)
      if (wasSubscribed
        && (clientUuid in clientUuidToSubscribedTopicNames)
        && (topicName in clientUuidToSubscribedTopicNames[clientUuid]))
        delete clientUuidToSubscribedTopicNames[clientUuid][topicName]

      if (Object.keys(clientUuidToSubscribedTopicNames?.[clientUuid] ?? {}).length === 0)
        delete clientUuidToSubscribedTopicNames[clientUuid]

      return wasSubscribed
    },
    unsubscribeClientFromAllTopics: clientUuid => {
      const subscribedTopicNames = Object.keys(clientUuidToSubscribedTopicNames?.[clientUuid] ?? {})
      subscribedTopicNames.forEach(topicName => {
        topics[topicName]?.unsubscribeClient(clientUuid)
      })
      delete clientUuidToSubscribedTopicNames[clientUuid]
      return subscribedTopicNames
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
