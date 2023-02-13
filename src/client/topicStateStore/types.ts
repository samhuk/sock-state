import { ActionMessage, StateMessage } from '../../message/types'
import { Reducer } from '../../reducer/types'

export type ClientTopic = {
  digestActionMsgs: (actionMsgs: ActionMessage | ActionMessage[]) => void
  digestStateMsg: (stateMsg: StateMessage) => void
}

export type ClientTopicStateStoreOptions<TState extends any = any> = {
  reducer: Reducer<TState>
  onStateChange: (state: TState) => void
}

export type ClientTopicStateStore<TState extends any = any> = ClientTopic & {
  loaded: boolean
  getState: () => TState
}
