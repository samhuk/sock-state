import { Client } from '../common/client/types'
import { Action, ActionMessageOptions, Message } from '../message/types'
import { Reducer } from '../reducer/types'

export type ClientTopicHandlerEventName = 'get-state' | 'state-change' | 'action'

export type ClientTopicHandlerMap<TState extends any, TAction extends Action> = {
  'get-state': (state: TState) => void
  'state-change': (state: TState) => void
  action: (action: TAction | TAction[]) => void
}

export type ClientCreator = (options: { host: string, port: number }) => Client<Message>

export type StoreClientOptions = {
  host: string
  port: number
}

export type TopicSubscriptionOnFnArgsMap<TState extends any, TAction extends Action> = {
  'get-state': [handler: ClientTopicHandlerMap<TState, TAction>['get-state']]
  'state-change': [reducer: Reducer<TState, TAction>, handler: ClientTopicHandlerMap<TState, TAction>['state-change']]
  action: [handler: ClientTopicHandlerMap<TState, TAction>['action']]
}

export type TopicSubscription<
  TState extends any = any,
  TAction extends Action = Action,
> = {
  dispatch: (action: TAction) => void
  /**
   * @returns Handler UUID
   */
  on: <TEventName extends ClientTopicHandlerEventName>(
    eventName: TEventName,
    ...args: TopicSubscriptionOnFnArgsMap<TState, TAction>[TEventName]
  ) => string
  off: (handlerUuid: string) => void
}

export type StoreClient = {
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  dispatch: (action: ActionMessageOptions) => void
  subscribe: <
    TState extends any,
    TAction extends Action
  >(topic: string) => TopicSubscription<TState, TAction>
}
