import { Client } from '../../common/server/clientStore/types'
// eslint-disable-next-line import/order
import { IncomingMessage } from 'http'
import { StoreServerOptions } from '../types'
import { Topic } from '../topicStore/topic/types'
// eslint-disable-next-line import/order
import { WebSocket } from 'ws'

export type StoreServerReporter<
  TSubscriptionAcceptorResultData extends any = any
> = {
  onBegin?: (options: StoreServerOptions) => void
  onCreatingServer?: (options: StoreServerOptions) => void
  onCreateServer?: (options: StoreServerOptions) => void
  onClientConnect?: (ws: WebSocket, req: IncomingMessage) => void
  onClientUnaccepted?: (ws: WebSocket, req: IncomingMessage, data?: any) => void
  onClientAccepted?: (client: Client) => void
  onClientMessage?: (client: Client, msgData: string, options: StoreServerOptions) => void
  onClientDisconnect?: (client: Client, topicNamesUnsubscribedFrom: string[], options: StoreServerOptions) => void
  onClientSubscribeTopic?: (client: Client, topic: Topic, subscriptionAcceptorData?: TSubscriptionAcceptorResultData) => void
  onClientUnsuccessfulSubscribeTopic?: (
    client: Client,
    topic: Topic,
    data?: 'topic-not-exist' | 'not-subscribed' | TSubscriptionAcceptorResultData
  ) => void
  onClientUnsubscribeTopic?: (client: Client, topic: Topic) => void
  onClientUnsuccessfulUnsubscribeTopic?: (client: Client, reason: 'topic-not-exist' | 'not-subscribed') => void
}
