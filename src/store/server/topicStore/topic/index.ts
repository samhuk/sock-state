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
    getState: () => stateStore.state,
    addSubscriber: client => subscriberStore.add({ client }),
    removeSubscriber: clientUuid => subscriberStore.remove(clientUuid),
    digest: msgs => {
      stateStore.digest(msgs)
      subscriberStore.broadcast(msgs)
    },
  }
}
