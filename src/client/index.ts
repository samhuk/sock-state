import { Action, ActionMessage, Message, MessageType, StateMessage, TopicDeletedMessage } from '../message/types'
import {
  ClientCreator,
  StoreClient,
  StoreClientEventHandlerMap,
  StoreClientEventName,
  StoreClientOptions,
  TopicSubscription,
  TopicSubscriptionOnFnArgsMap,
} from './types'
import { sortActionMessagesByTopic, sortMessagesByType } from '../message'

import { Client } from '../common/client/types'
import { ListenerStore } from '../common/listenerStore/types'
import { createListenerStore } from '../common/listenerStore'
import { createTopicStateStore } from './topicStateStore'
// eslint-disable-next-line import/order
import { v4 as uuidv4 } from 'uuid'

const sendActionMessage = (client: Client, action: Action) => {
  client.send({
    type: MessageType.ACTION,
    dateCreated: Date.now(),
    data: action,
  })
}

const sendUnsubscribeMessage = (client: Client, topicName: string) => {
  client.send({
    type: MessageType.UNSUBSCRIBE,
    dateCreated: Date.now(),
    data: {
      topics: topicName,
    },
  })
}

const sendSubscriptionRequest = (client: Client, topicName: string) => {
  client.send({
    type: MessageType.SUBSCRIBE,
    dateCreated: Date.now(),
    data: {
      topics: topicName,
    },
  })
}

const createTopicSubscription = (
  topicName: string,
  client: Client<Message>,
  topicRecieveStateMsgListeners: ListenerStore<string, { [k: string]: (stateMsg: StateMessage) => void }>,
  topicRecieveActionMsgsListeners: ListenerStore<string, { [k: string]: (actionMsgs: ActionMessage | ActionMessage[]) => void }>,
  topicRecieveTopicDeletedMsgListeners: ListenerStore<string, { [k: string]: (topicDeletedMsg: TopicDeletedMessage) => void }>,
): TopicSubscription => {
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
          onStateChange: (state, isGetInitialState) => handler(state, isGetInitialState),
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

      if (eventName === 'topic-deleted') {
        const [handler] = args as TopicSubscriptionOnFnArgsMap<any, any>['topic-deleted']
        const listenerUuid = topicRecieveTopicDeletedMsgListeners.add(topicName, topicDeletedMsg => {
          handler(topicDeletedMsg.data.data)
        })

        offFns[listenerUuid] = () => {
          topicRecieveStateMsgListeners.remove(listenerUuid)
        }
        return listenerUuid
      }

      return null as unknown as string
    },
    off: handlerUuid => offFns[handlerUuid]?.(),
    unsubscribe: () => {
      // Remove the topic message listener functions first so that no more will be received
      Object.values(offFns).forEach(offFn => offFn())
      // Send message to server to unsubscribe, removing this topic subscription from the topic subscribers pool.
      sendUnsubscribeMessage(client, topicName)
    },
  }
}

const connectReporterToBaseClient = (
  client: Client,
  options: StoreClientOptions,
) => {
  client.on('connect', (host, port) => {
    options.reporter?.onConnect?.(host, port)
  })

  client.on('disconnect', (host, port, info) => {
    options.reporter?.onDisconnect?.(host, port, info)
  })

  client.on('connect-attempt-fail', (host, port) => {
    options.reporter?.onConnectAttemptFail?.(host, port)
  })

  client.on('connect-attempt-start', (host, port) => {
    options.reporter?.onConnectAttemptStart?.(host, port)
  })
}

export const createStoreClient = (options: StoreClientOptions, clientCreator: ClientCreator): StoreClient => {
  options.reporter?.onBegin?.(options)
  let instance: StoreClient

  const topicRecieveStateMsgListeners = createListenerStore<string, { [k: string]:(stateMsg: StateMessage) => void }>()
  const topicRecieveActionMsgsListeners = createListenerStore<string, { [k: string]:(actionMsgs: ActionMessage | ActionMessage[]) => void }>()
  const topicDeletedMsgListeners = createListenerStore<string, { [k: string]:(topicDeletedMsg: TopicDeletedMessage) => void }>()

  const listenerStore = createListenerStore<StoreClientEventName, StoreClientEventHandlerMap>()

  const client = clientCreator({
    host: options.host,
    port: options.port,
  })

  // Start listening for all messages from store server
  client.on('message', msgs => {
    options.reporter?.onMessages?.(msgs)

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

    // Handle any topic deleted messages
    messagesByType.topic_deleted.forEach(topicDeletedMsg => {
      const topicName = topicDeletedMsg.data.topicName
      options.reporter?.onTopicDeleted?.(topicName, topicDeletedMsg.data.data)
      // Remove the state change msg and action msg(s) listeners as the topic for them has been deleted
      topicRecieveStateMsgListeners.removeByEventName(topicName)
      topicRecieveActionMsgsListeners.removeByEventName(topicName)
      // Call any of the topic's on-delete listeners
      topicDeletedMsgListeners.call(topicName, topicDeletedMsg)
      // Remove any of the topic's on-delete listeners since the topic for them has been deleted
      topicDeletedMsgListeners.removeByEventName(topicName)
    })
  })

  connectReporterToBaseClient(client, options)

  client.on('connection-status-change', (newStatus, prevStatus) => {
    options.reporter?.onConnectionStatusChange?.(newStatus, prevStatus)
    listenerStore.call('connection-status-change', newStatus, prevStatus)
  })

  return instance = {
    getConnectionStatus: () => client.connectionStatus,
    connect: client.connect,
    disconnect: client.disconnect,
    dispatch: action => sendActionMessage(client, action),
    on: (eventName, handler) => listenerStore.add(eventName, handler),
    off: handlerUuid => listenerStore.remove(handlerUuid),
    topic: topicName => {
      options.reporter?.onSubscribe?.(topicName)
      return createTopicSubscription(
        topicName,
        client,
        topicRecieveStateMsgListeners,
        topicRecieveActionMsgsListeners,
        topicDeletedMsgListeners,
      )
    },
  }
}
