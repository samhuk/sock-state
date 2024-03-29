import { Listener, ListenerStore } from './types'

// eslint-disable-next-line import/order
import { v4 as uuidv4 } from 'uuid'

/**
 * Responsible for storing listeners for arbitrary event names.
 */
export const createListenerStore = <
  TEventNames extends string = string,
  TEventHandlerMap extends { [k in TEventNames]: (...args: any[]) => any } = { [k in TEventNames]: (...args: any[]) => any }
>(): ListenerStore<TEventNames, TEventHandlerMap> => {
  let instance: ListenerStore<TEventNames>

  return instance = {
    count: 0,
    listeners: {},
    eventNameToListeners: {} as any,
    call: (eventName, ...args) => {
      const listenersToCall = Object.values(instance.eventNameToListeners[eventName] ?? {})
      const listenersToRemove = listenersToCall.filter(l => l.removeOnceCalled)

      listenersToCall.forEach(l => l.handler(...args))
      listenersToRemove.forEach(l => instance.remove(l.uuid))
    },
    // @ts-ignore
    add: (eventName, handler, options) => {
      const listener: Listener<TEventNames> = {
        uuid: options?.uuid ?? uuidv4(),
        eventName,
        handler,
        removeOnceCalled: options?.removeOnceCalled ?? false,
      }
      if (instance.eventNameToListeners[eventName] == null)
        instance.eventNameToListeners[eventName] = {}

      instance.listeners[listener.uuid] = listener;
      (instance.eventNameToListeners[eventName][listener.uuid] as any) = listener
      instance.count += 1
      return listener.uuid
    },
    remove: uuid => {
      const listener = instance.listeners[uuid]
      if (listener == null)
        return

      delete instance.eventNameToListeners[listener.eventName][uuid]
      delete instance.listeners[uuid]
      instance.count -= 1
    },
    removeByEventName: eventName => {
      const listenerUuidsToRemove = Object.keys(instance.eventNameToListeners[eventName] ?? {})
      for (let i = 0; i < listenerUuidsToRemove.length; i += 1) {
        const listenerUuid = listenerUuidsToRemove[i]
        delete instance.listeners[listenerUuid]
        instance.eventNameToListeners[eventName] = {}
      }

      instance.count -= listenerUuidsToRemove.length
    },
  }
}
