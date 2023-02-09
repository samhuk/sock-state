import { createSubscriberStore } from '../../subscriberStore'
import { Topic, TopicOptionsWithoutName } from './types'

export const createTopic = <TState extends any>(
  name: string,
  options: TopicOptionsWithoutName<TState>,
): Topic<TState> => {
  let instance: Topic<TState>
  const subscriberStore = createSubscriberStore()

  return instance = {
    state: options.reducer(),
    addSubscriber: client => subscriberStore.add({ client }),
    removeSubscriber: clientUuid => subscriberStore.remove(clientUuid),
    broadcast: msgs => {
      if (Array.isArray(msgs))
        msgs.forEach(msg => instance.state = options.reducer(instance.state, msg.data))
      else
        instance.state = options.reducer(instance.state, msgs.data)

      subscriberStore.broadcast(msgs)
    },
  }
}
