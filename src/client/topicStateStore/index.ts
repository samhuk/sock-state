import { ActionMessage } from '../../message/types'
import { createStateStore } from '../../stateStore'
import { ClientTopicStateStoreOptions, ClientTopicStateStore } from './types'

export const createTopicStateStore = (options: ClientTopicStateStoreOptions): ClientTopicStateStore => {
  const stateStore = createStateStore({
    reducer: options.reducer,
  })
  let instance: ClientTopicStateStore
  let preLoadedActionMsgs: ActionMessage[] = []

  return instance = {
    loaded: false,
    getState: () => stateStore.state,
    digestActionMsgs: msgs => {
      if (!instance.loaded) {
        preLoadedActionMsgs = preLoadedActionMsgs.concat(msgs)
      }
      else {
        stateStore.digest(msgs)
        options.onStateChange(stateStore.state, false)
      }
    },
    digestStateMsg: msg => {
      stateStore.set(msg.data.state)
      stateStore.digest(preLoadedActionMsgs)
      options.onStateChange(stateStore.state, true)
      instance.loaded = true
    },
  }
}
