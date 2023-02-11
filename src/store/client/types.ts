import { Client } from '../../client/types'
import { Action, ActionMessageOptions, Message } from '../message/types'
import { Reducer } from '../reducer/types'

export type ClientCreator = (options: { host: string, port: number }) => Client<Message>

export type StoreClientOptions = {
  host: string
  port: number
}

export type StoreClient = {
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  dispatch: (action: ActionMessageOptions) => void
  subscribe: <
    TState extends any,
    TAction extends Action
  >(
    topic: string,
    reducer: Reducer<TState, TAction>
  ) => {
    dispatch: (action: TAction) => void
    addHandler: (handler: (state: TState) => void) => string
    removeHandler: (handlerUuid: string) => void
  }
}
