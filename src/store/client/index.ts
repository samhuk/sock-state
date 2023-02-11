import { createListenerStore } from '../../listenerStore'
import { sortActionMessagesByTopic, sortMessagesByType } from '../message'
import { MessageType } from '../message/types'
import { Reducer } from '../reducer/types'
import { createTopicStateStore } from './topicStateStore'
import { ClientTopicStateStore } from './topicStateStore/types'
import { ClientCreator, StoreClient, StoreClientOptions } from './types'

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
        dispatch: action => client.send({
          type: MessageType.ACTION,
          dateCreated: Date.now(),
          data: {
            topic: topicName,
            type: action.type,
            payload: action.payload,
          },
        }),
        addHandler: handler => stateChangeListeners.add('change', handler),
        removeHandler: handlerUuid => stateChangeListeners.remove(handlerUuid),
      }
    },
  }
}
