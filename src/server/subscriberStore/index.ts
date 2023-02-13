import { Subscriber, SubscriberStore } from './types'

export const createSubscriberStore = (): SubscriberStore => {
  let instance: SubscriberStore

  return instance = {
    numSubscribers: 0,
    subscribers: {},
    add: subscriberOptions => {
      const uuidAlreadyExists = subscriberOptions.client.uuid in instance.subscribers
      const subscriber: Subscriber = {
        client: subscriberOptions.client,
        dateSubscribed: Date.now(),
      }
      instance.subscribers[subscriberOptions.client.uuid] = subscriber

      if (!uuidAlreadyExists)
        instance.numSubscribers += 1

      return subscriber
    },
    broadcast: msg => {
      const serializedMsg = JSON.stringify(msg)
      Object.values(instance.subscribers).forEach(subscriber => {
        subscriber.client.ws.send(serializedMsg)
      })
    },
    remove: clientUuid => {
      const uuidExists = clientUuid in instance.subscribers
      if (!uuidExists)
        return

      delete instance.subscribers[clientUuid]
      instance.numSubscribers -= 1
    },
  }
}
