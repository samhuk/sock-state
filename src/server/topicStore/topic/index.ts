import { MessageType, StateMessage } from '../../../message/types'
import { createStateStore } from '../../../stateStore'
import { createSubscriberStore } from '../../subscriberStore'
import { Topic, TopicOptionsWithoutName } from './types'

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
    addSubscriber: client => {
      const subscriber = subscriberStore.add({ client })
      const stateMsg: StateMessage = {
        type: MessageType.STATE,
        dateCreated: Date.now(),
        data: {
          topic: name,
          state: stateStore.state,
        },
      }
      const serializedStateMsg = JSON.stringify(stateMsg)
      client.ws.send(serializedStateMsg)
      return subscriber
    },
    removeSubscriber: clientUuid => subscriberStore.remove(clientUuid),
    digest: msgs => {
      stateStore.digest(msgs)
      subscriberStore.broadcast(msgs)
    },
  }
}
