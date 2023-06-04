import { MessageType, StateMessage, TopicDeletedMessage } from '../../../message/types'
import { Topic, TopicOptionsWithoutName } from './types'

import { StateStore } from '../../../stateStore/types'
import { createStateStore } from '../../../stateStore'
import { createSubscriberStore } from '../../subscriberStore'
import { sendMessageToClient } from '../..'

const createStateMessage = (stateStore: StateStore, topicName: string): StateMessage => ({
  type: MessageType.STATE,
  dateCreated: Date.now(),
  data: {
    topic: topicName,
    state: stateStore.state,
  },
})

const createTopicDeletedMessage = (topicName: string, data?: any): TopicDeletedMessage => ({
  type: MessageType.TOPIC_DELETED,
  dateCreated: Date.now(),
  data: {
    topicName,
    data,
  },
})

export const createTopic = <TState extends any>(
  name: string,
  options: TopicOptionsWithoutName<TState>,
): Topic<TState> => {
  let instance: Topic<TState>
  const subscriberStore = createSubscriberStore()
  const stateStore = createStateStore({ reducer: options.reducer })

  return instance = {
    name,
    getNumSubscribers: () => subscriberStore.numSubscribers,
    getState: () => stateStore.state,
    subscribeClient: client => {
      const addSubscriberResult = subscriberStore.add({ client })
      sendMessageToClient(client, createStateMessage(stateStore, name))
      return addSubscriberResult
    },
    unsubscribeClient: clientUuid => subscriberStore.remove(clientUuid),
    digestActionMsgs: msgs => {
      stateStore.digest(msgs)
      subscriberStore.broadcastMessage(msgs)
    },
    broadcastDeleted: data => {
      subscriberStore.broadcastMessage(createTopicDeletedMessage(name, data))
    },
  }
}
