import { Client } from '../common/client/types'
import { ConnectionStatus } from '../common/connectionStatus'
import { Action, ActionMessageOptions, Message } from '../message/types'
import { Reducer } from '../reducer/types'
import { StoreClientReporter } from './reporter/types'

export type ClientTopicHandlerEventName = 'get-state' | 'state-change' | 'action'

export type ClientTopicHandlerMap<TState extends any, TAction extends Action> = {
  'get-state': (state: TState) => void
  'state-change': (state: TState) => void
  action: (action: TAction | TAction[]) => void
}

export type ClientCreator = (options: { host: string, port: number }) => Client<Message>

export type StoreClientOptions = {
  /**
   * The IP address or host name that the store client will bind to.
   */
  host: string
  /**
   * The port number that the store client will bind to.
   */
  port: number
  /**
   * Optional reporter for the store client.
   *
   * This is useful for logging the various events of the store client.
   */
  reporter?: StoreClientReporter
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
  /**
   * Dispatch an action to the topic.
   */
  dispatch: (action: TAction) => void
  /**
   * Start listening for various events of a topic, such as when an action is dispatched
   * to it, when the store client receives it's current state, and when it's state changes.
   *
   * Subscription to state changes require a reducer to be provided. You should provide the
   * same one that the store server uses for the topic.
   *
   * @returns Handler UUID
   */
  on: <TEventName extends ClientTopicHandlerEventName>(
    /**
     * The event name to listen to. Available:
     *
     * * `get-state` - When the store client receives the topic's current state.
     * * `state-change` - When the store client receives the topic's current state.
     * * `action` - When an action is dispatched to the topic (by any client).
     */
    eventName: TEventName,
    ...args: TopicSubscriptionOnFnArgsMap<TState, TAction>[TEventName]
  ) => string
  /**
   * Removes a listener of various events of a topic.
   */
  off: (handlerUuid: string) => void
}

export type StoreClientEventName = 'connection-status-change'

export type StoreClientEventHandlerMap= {
  'connection-status-change': (newStatus: ConnectionStatus, prevStatus: ConnectionStatus) => void
}

export type StoreClientOnFn = <
  TEvent extends StoreClientEventName,
>(event: TEvent, handler: StoreClientEventHandlerMap[TEvent]) => string

export type StoreClient = {
  getConnectionStatus: () => ConnectionStatus
  /**
   * Connect the store client to the store server.
   */
  connect: () => Promise<void>
  /**
   * Disconnect the store client from the store server.
   */
  disconnect: () => Promise<void>
  /**
   * Dispatch an action to any topic without necessarily being subscribed to it.
   */
  dispatch: (action: ActionMessageOptions) => void
  /**
   * Listen for events.
   *
   * @returns Listener UUID
   */
  on: StoreClientOnFn
  /**
   * Stop a listener.
   */
  off: (uuid: string) => void
  /**
   * Subscribe to a topic.
   */
  topic: <
    TState extends any,
    TAction extends Action
  >(topic: string) => TopicSubscription<TState, TAction>
}
