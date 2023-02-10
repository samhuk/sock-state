import { Client } from '../../client/types'
import { createListenerStore } from '../../listenerStore'
import { sortActionMessagesByTopic, sortMessagesByType } from '../message'
import { ActionMessage, Message, MessageType, StateMessage } from '../message/types'
import { Reducer } from '../reducer/types'
import { createStateStore } from '../stateStore'
import { ClientCreator, StoreClient, StoreClientOptions } from './types'

const waitUntilTopicStateMessage = (client: Client<Message>, topic: string) => new Promise<{
  state: any

}>(res => {
  const listenerUuid = client.on('message', msg => {

  })
})

type ClientTopicStateStoreOptions<TState extends any = any> = {
  reducer: Reducer<TState>
  onStateChange: (state: TState) => void
}

type ClientTopicStateStore<TState extends any = any> = {
  loaded: boolean
  getState: () => TState
  digestActionMsgs: (actionMsgs: ActionMessage | ActionMessage[]) => void
  digestStateMsg: (stateMsg: StateMessage) => void
}

const createTopicStateStore = (options: ClientTopicStateStoreOptions): ClientTopicStateStore => {
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
        options.onStateChange(stateStore.state)
      }
    },
    digestStateMsg: msg => {
      stateStore.set(msg.data.state)
      stateStore.digest(preLoadedActionMsgs)
      options.onStateChange(stateStore.state)
      instance.loaded = true
    },
  }
}

export const createStoreClient = (options: StoreClientOptions, clientCreator: ClientCreator): StoreClient => {
  let instance: StoreClient

  const topicStateStores: { [topicName: string]: ClientTopicStateStore } = {}

  const client = clientCreator({
    host: options.host,
    port: options.port,
  })

  client.on('message', msgs => {
    const messagesByType = sortMessagesByType(msgs)

    // Handle state messages
    messagesByType.state.forEach(stateMsg => {
      topicStateStores[stateMsg.data.topic].digestStateMsg(stateMsg)
    })

    // Handle action messages
    const sortedActionMsgs = sortActionMessagesByTopic(messagesByType.action)
    Object.entries(sortedActionMsgs).forEach(([topicName, actionMsgs]) => {
      topicStateStores[topicName].digestActionMsgs(actionMsgs)
    })
  })

  return instance = {
    connect: client.connect,
    disconnect: client.disconnect,
    dispatch: action => client.send({
      type: MessageType.ACTION,
      dateCreated: Date.now(),
      data: action,
    }),
    subscribe: (topicName, reducer) => {
      const stateChangeListeners = createListenerStore<'change', { change:(state: any) => any }>()

      const stateStore = createTopicStateStore({
        reducer: reducer as Reducer,
        onStateChange: state => stateChangeListeners.call('change', state),
      })

      topicStateStores[topicName] = stateStore

      client.send({
        type: MessageType.SUBSCRIBE,
        dateCreated: Date.now(),
        data: {
          topics: topicName,
        },
      })

      return {
        addHandler: handler => stateChangeListeners.add('change', handler),
        removeHandler: handlerUuid => stateChangeListeners.remove(handlerUuid),
      }
    },
  }
}
