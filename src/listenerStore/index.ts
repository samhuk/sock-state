import { randomUUID } from 'crypto'
import { Listener, ListenerStore } from './types'

/**
 * Responsible for storing listeners for arbitrary event names.
 */
export const createListenerStore = <
  TEventNames extends string = string,
  TArgs extends any[] = any[]
>(): ListenerStore<TEventNames, TArgs> => {
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
        uuid: options?.uuid ?? randomUUID(),
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
  }
}
