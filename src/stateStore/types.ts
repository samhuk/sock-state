import { ActionMessage } from '../message/types'
import { Reducer } from '../reducer/types'

export type StateStoreOptions = {
  reducer: Reducer
}

export type StateStore<TState extends any = any> = {
  state: TState
  digest: (msgs: ActionMessage | ActionMessage[]) => void
  set: (state: TState) => void
}
