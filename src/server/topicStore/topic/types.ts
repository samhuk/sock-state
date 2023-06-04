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
  /**
   * Sends a message to all subscribed clients that this topic has been deleted.
   * This will inform them that they need to unsubscribe from the topic on their side.
   */
  broadcastDeleted: (data?: any) => void
}
