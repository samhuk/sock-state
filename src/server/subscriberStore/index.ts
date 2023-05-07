import { Subscriber, SubscriberStore } from './types'

export const createSubscriberStore = (): SubscriberStore => {
  let instance: SubscriberStore

  return instance = {
    numSubscribers: 0,
    subscribers: {},
    add: subscriberOptions => {
      const existingSubscriber = instance.subscribers[subscriberOptions.client.uuid]
      if (existingSubscriber != null)
        return { isNew: false, subscriber: existingSubscriber }

      const newSubscriber: Subscriber = {
        client: subscriberOptions.client,
        dateSubscribed: Date.now(),
      }
      instance.subscribers[subscriberOptions.client.uuid] = newSubscriber
      instance.numSubscribers += 1
      return { isNew: true, subscriber: newSubscriber }
    },
    broadcastMessage: msg => {
      const serializedMsg = JSON.stringify(msg)
      Object.values(instance.subscribers).forEach(subscriber => {
        subscriber.client.ws.send(serializedMsg)
      })
    },
    remove: clientUuid => {
      const uuidExists = clientUuid in instance.subscribers
      if (!uuidExists)
        return false

      delete instance.subscribers[clientUuid]
      instance.numSubscribers -= 1
      return true
    },
  }
}
