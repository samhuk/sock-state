import { Client } from '../../../common/server/clientStore/types'
import { Action, ActionMessage } from '../../../message/types'
import { Reducer } from '../../../reducer/types'
import { Subscriber } from '../../subscriberStore/types'

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
  getState: () => TState
  addSubscriber: (client: Client) => Subscriber
  removeSubscriber: (clientUuid: string) => void
  digest: (actions: ActionMessage | ActionMessage[]) => void
}
