import { v4 as uuidv4 } from 'uuid'
import { Client } from '../common/client/types'
import { createListenerStore } from '../common/listenerStore'
import { sortActionMessagesByTopic, sortMessagesByType } from '../message'
import { ActionMessage, MessageType, StateMessage } from '../message/types'
import { createTopicStateStore } from './topicStateStore'
import { ClientCreator, StoreClient, StoreClientOptions, TopicSubscriptionOnFnArgsMap } from './types'

const sendSubscriptionRequest = (client: Client, topicName: string) => {
  client.send({
    type: MessageType.SUBSCRIBE,
    dateCreated: Date.now(),
    data: {
      topics: topicName,
    },
  })
}

export const createStoreClient = (options: StoreClientOptions, clientCreator: ClientCreator): StoreClient => {
  let instance: StoreClient

  const topicRecieveStateMsgListeners = createListenerStore<string, { [k: string]:(stateMsg: StateMessage) => void }>()
  const topicRecieveActionMsgsListeners = createListenerStore<string, { [k: string]:(actionMsgs: ActionMessage | ActionMessage[]) => void }>()

  const client = clientCreator({
    host: options.host,
    port: options.port,
  })

  // Start listening for all messages from store server
  client.on('message', msgs => {
    // Sort messages by their type
    const messagesByType = sortMessagesByType(msgs)

    // Handle any state messages
    messagesByType.state.forEach(stateMsg => {
      topicRecieveStateMsgListeners.call(stateMsg.data.topic, stateMsg)
    })

    // Handle any action messages
    const sortedActionMsgs = sortActionMessagesByTopic(messagesByType.action)
    Object.entries(sortedActionMsgs).forEach(([topicName, actionMsgs]) => {
      topicRecieveActionMsgsListeners.call(topicName, actionMsgs)
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
    topic: topicName => {
      sendSubscriptionRequest(client, topicName)

      const offFns: { [uuid: string]: () => void } = {}

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
        on: (eventName, ...args) => {
          if (eventName === 'state-change') {
            const [reducer, handler] = args as TopicSubscriptionOnFnArgsMap<any, any>['state-change']

            const topicStateStore = createTopicStateStore({
              reducer,
              onStateChange: state => handler(state),
            })

            const stateMsgListenerUuid = topicRecieveStateMsgListeners.add(topicName, stateMsg => topicStateStore.digestStateMsg(stateMsg))
            const actionMsgsListenerUuid = topicRecieveActionMsgsListeners.add(topicName, actionMsgs => topicStateStore.digestActionMsgs(actionMsgs))

            const offFnUuid = uuidv4()
            offFns[offFnUuid] = () => {
              topicRecieveStateMsgListeners.remove(stateMsgListenerUuid)
              topicRecieveActionMsgsListeners.remove(actionMsgsListenerUuid)
            }
            return offFnUuid
          }

          if (eventName === 'get-state') {
            const [handler] = args as TopicSubscriptionOnFnArgsMap<any, any>['get-state']

            const stateMsgListenerUuid = topicRecieveStateMsgListeners.add(topicName, stateMsg => handler(stateMsg.data.state))

            offFns[stateMsgListenerUuid] = () => {
              topicRecieveStateMsgListeners.remove(stateMsgListenerUuid)
            }
            return stateMsgListenerUuid
          }

          if (eventName === 'action') {
            const [handler] = args as TopicSubscriptionOnFnArgsMap<any, any>['action']

            const actionMsgsListenerUuid = topicRecieveActionMsgsListeners.add(topicName, actionMsgs => {
              if (Array.isArray(actionMsgs)) {
                const actions = actionMsgs.map(actionMsg => actionMsg.data)
                handler(actions)
              }
              else {
                handler(actionMsgs.data)
              }
            })

            offFns[actionMsgsListenerUuid] = () => {
              topicRecieveActionMsgsListeners.remove(actionMsgsListenerUuid)
            }
            return actionMsgsListenerUuid
          }
          return null
        },
        off: handlerUuid => offFns[handlerUuid]?.(),
      }
    },
  }
}
