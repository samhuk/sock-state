import { Action } from '../message/types'

export type Reducer<
  TState extends any = any,
  TAction extends Action = Action,
> = (state?: TState, action?: TAction) => TState
