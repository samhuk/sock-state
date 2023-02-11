import { ActionMessage, StateMessage } from '../../message/types'
import { Reducer } from '../../reducer/types'

export type ClientTopicStateStoreOptions<TState extends any = any> = {
  reducer: Reducer<TState>
  onStateChange: (state: TState) => void
}

export type ClientTopicStateStore<TState extends any = any> = {
  loaded: boolean
  getState: () => TState
  digestActionMsgs: (actionMsgs: ActionMessage | ActionMessage[]) => void
  digestStateMsg: (stateMsg: StateMessage) => void
}
