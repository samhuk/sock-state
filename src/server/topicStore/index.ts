import { TopicStore, TopicStoreOptions } from './types'

import { AddSubscriberResult } from '../subscriberStore/types'
import { Client } from '../../common/server/clientStore/types'
import { Topic } from './topic/types'
import { createTopic } from './topic'
import { sortActionMessagesByTopic } from '../../message'

type TopicsDict = { [topicName: string]: Topic }

type ClientUuidToSubscribeTopicNamesDict = { [clientUuid: string]: { [topicName: string]: boolean } }

const subscribeClientToTopic = (
  topics: TopicsDict,
  clientUuidToSubscribedTopicNames: ClientUuidToSubscribeTopicNamesDict,
  client: Client,
  topicName: string,
): AddSubscriberResult | undefined => {
  const topic = topics[topicName]
  if (topic == null)
    return undefined

  const addSubscriberResult = topic.subscribeClient(client)
  if (addSubscriberResult.isNew) {
    if (clientUuidToSubscribedTopicNames[client.uuid] == null)
      clientUuidToSubscribedTopicNames[client.uuid] = {}

    clientUuidToSubscribedTopicNames[client.uuid][topicName] = true
  }

  return addSubscriberResult
}

const unsubscribeClientToTopic = (
  topics: TopicsDict,
  clientUuidToSubscribedTopicNames: ClientUuidToSubscribeTopicNamesDict,
  clientUuid: string,
  topicName: string,
): boolean | undefined => {
  const topic = topics[topicName]
  if (topic == null)
    return undefined

  const wasSubscribed = topic.unsubscribeClient(clientUuid)
  if (wasSubscribed
    && (clientUuid in clientUuidToSubscribedTopicNames)
    && (topicName in clientUuidToSubscribedTopicNames[clientUuid]))
    delete clientUuidToSubscribedTopicNames[clientUuid][topicName]

  if (Object.keys(clientUuidToSubscribedTopicNames?.[clientUuid] ?? {}).length === 0)
    delete clientUuidToSubscribedTopicNames[clientUuid]

  return wasSubscribed
}

const unsubscribeClientFromAllTopics = (
  topics: TopicsDict,
  clientUuidToSubscribedTopicNames: ClientUuidToSubscribeTopicNamesDict,
  clientUuid: string,
) => {
  const subscribedTopicNames = Object.keys(clientUuidToSubscribedTopicNames?.[clientUuid] ?? {})
  subscribedTopicNames.forEach(topicName => {
    topics[topicName]?.unsubscribeClient(clientUuid)
  })
  delete clientUuidToSubscribedTopicNames[clientUuid]
  return subscribedTopicNames
}

const unsubscribeAllClientsFromTopic = (
  clientUuidToSubscribedTopicNames: ClientUuidToSubscribeTopicNamesDict,
  topicName: string,
) => {
  const clientUuids = Object.keys(clientUuidToSubscribedTopicNames)

  for (let i = 0; i < clientUuids.length; i += 1) {
    const clientUuid = clientUuids[i]
    const subscribedTopicsDict = clientUuidToSubscribedTopicNames[clientUuid]
    const subscribedTopicNames = Object.keys(subscribedTopicsDict)

    for (let j = 0; j < subscribedTopicNames.length; j += 1) {
      const subscribedTopicName = subscribedTopicNames[j]
      if (subscribedTopicName === topicName)
        delete subscribedTopicsDict[topicName]
    }

    // If the client is no longer subscribed to any topics, remove them from the dict
    if (Object.keys(subscribedTopicsDict).length === 0)
      delete clientUuidToSubscribedTopicNames[clientUuid]
  }
}

const deleteTopic = (
  topics: TopicsDict,
  clientUuidToSubscribedTopicNames: ClientUuidToSubscribeTopicNamesDict,
  topicName: string,
  data?: any,
) => {
  if (!(topicName in topics))
    return false

  unsubscribeAllClientsFromTopic(clientUuidToSubscribedTopicNames, topicName)
  topics[topicName].broadcastDeleted(data)
  delete topics[topicName]
  return true
}

export const createTopicStore = (options: TopicStoreOptions): TopicStore => {
  let instance: TopicStore
  const topics: TopicsDict = {}

  Object.entries(options.topics ?? {}).forEach(([topicName, topicOptions]) => {
    topics[topicName] = createTopic(topicName, topicOptions)
  })

  const clientUuidToSubscribedTopicNames: ClientUuidToSubscribeTopicNamesDict = {}

  return instance = {
    getTopic: topicName => topics[topicName],
    getTopicList: () => Object.values(topics),
    addTopic: _options => {
      const newTopic = createTopic(_options.name, _options)
      topics[_options.name] = newTopic
      return newTopic
    },
    deleteTopic: (topicName, data) => (
      deleteTopic(topics, clientUuidToSubscribedTopicNames, topicName, data)
    ),
    subscribeClientToTopic: (client, topicName) => (
      subscribeClientToTopic(topics, clientUuidToSubscribedTopicNames, client, topicName)?.subscriber
    ),
    unsubscribeClientFromTopic: (clientUuid, topicName) => (
      unsubscribeClientToTopic(topics, clientUuidToSubscribedTopicNames, clientUuid, topicName)
    ),
    unsubscribeClientFromAllTopics: clientUuid => (
      unsubscribeClientFromAllTopics(topics, clientUuidToSubscribedTopicNames, clientUuid)
    ),
    digest: msgs => {
      if (Array.isArray(msgs)) {
        Object.entries(sortActionMessagesByTopic(msgs)).forEach(([topicName, _msgs]) => {
          topics[topicName].digestActionMsgs(_msgs)
        })
      }
      else {
        topics[msgs.data.topic].digestActionMsgs(msgs)
      }
    },
  }
}
