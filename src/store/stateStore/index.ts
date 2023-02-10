import { StateStore, StateStoreOptions } from './types'

export const createStateStore = (options: StateStoreOptions): StateStore => {
  let instance: StateStore

  return instance = {
    state: options.reducer(),
    digest: msgs => {
      if (Array.isArray(msgs))
        msgs.forEach(msg => instance.state = options.reducer(instance.state, msg.data))
      else
        instance.state = options.reducer(instance.state, msgs.data)
    },
    set: state => {
      instance.state = state
    },
  }
}
