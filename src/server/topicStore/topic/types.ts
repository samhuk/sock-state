import { Action, ActionMessage } from '../../../message/types'

import { AddSubscriberResult } from '../../subscriberStore/types'
import { Client } from '../../../common/server/clientStore/types'
import { Reducer } from '../../../reducer/types'

export type TopicOptionsWithoutName<
  TState extends any = any,
  TAction extends Action = Action,
> = {
  reducer: Reducer<TState, TAction>
}

export type TopicOptions<
  TState extends any = any
> = TopicOptionsWithoutName<TState> & {
  name: string
}

export type Topic<TState extends any = any> = {
  name: string
  getNumSubscribers: () => number
  getState: () => TState
  subscribeClient: (client: Client) => AddSubscriberResult
  /**
   * @returns `true` if given client was subscribed to the given topic, `false` if it wasn't.
   */
  unsubscribeClient: (clientUuid: string) => boolean
  digestActionMsgs: (actions: ActionMessage | ActionMessage[]) => void
  broadcastDeleted: (data?: any) => void
}
