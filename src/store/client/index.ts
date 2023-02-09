import { createListenerStore } from '../../listenerStore'
import { sortActionMessagesByTopic } from '../message'
import { ActionMessage, Message, MessageType } from '../message/types'
import { ClientCreator, StoreClient, StoreClientOptions } from './types'

export const createStoreClient = (options: StoreClientOptions, clientCreator: ClientCreator): StoreClient => {
  const listenerStore = createListenerStore<string, [ActionMessage[]]>()
  const client = clientCreator({
    host: options.host,
    port: options.port,
  })
  let instance: StoreClient

  client.on('message', msgs => {
    const normalizedMsgs = Array.isArray(msgs) ? msgs : [msgs]
    const actionMsgs = normalizedMsgs.filter(msg => msg.type === MessageType.ACTION) as Message<MessageType.ACTION>[]
    const sortedActionMsgs = sortActionMessagesByTopic(actionMsgs)

    Object.entries(sortedActionMsgs).forEach(([topicName, _actionMsgs]) => {
      listenerStore.call(topicName, _actionMsgs)
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
    subscribe: (topic, reducer) => {
      let state = reducer() // TODO: Need to get initial state from server
      const stateListeners = createListenerStore()
      const listenerUuid = listenerStore.add(topic, actionMsgs => {
        actionMsgs.forEach(actionMsg => {
          state = reducer(state, actionMsg.data as any)
        })
        stateListeners.call('change', state)
      })

      client.send({
        type: MessageType.SUBSCRIBE,
        dateCreated: Date.now(),
        data: {
          topics: topic,
        },
      })

      return {
        addHandler: handler => stateListeners.add('change', handler),
        removeHandler: handlerUuid => stateListeners.remove(handlerUuid),
      }
    },
  }
}
