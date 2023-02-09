export type Listener<
  TEventNames extends string = string
> = {
  eventName: TEventNames
  uuid: string
  handler: (...args: any) => any
  removeOnceCalled: boolean
}

export type UuidToListenerDict<
  TEventNames extends string = string
> = {
  [uuid: string]: Listener<TEventNames>
}

export type EventNameToListenersDict<
  TEventNames extends string = string
> = {
  [eventName in TEventNames]: UuidToListenerDict<TEventNames>
}

export type ListenerStore<
  TEventNames extends string = string
> = {
  count: number
  listeners: UuidToListenerDict<TEventNames>
  eventNameToListeners: EventNameToListenersDict<TEventNames>
  call: (eventName: TEventNames, ...args: any) => void
  add: <TTEventName extends TEventNames>(
    eventName: TTEventName,
    handler: (...args: any[]) => void,
    options?: {
      uuid?: string,
      removeOnceCalled?: boolean
    }
  ) => string // Returns uuid
  remove: (uuid: string) => void
}
