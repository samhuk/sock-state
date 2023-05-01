import { Client } from '../../common/server/clientStore/types'
import { StoreServerOptions } from '../types'
import { Topic } from '../topicStore/topic/types'

export type StoreServerReporter = {
  onBegin?: (options: StoreServerOptions) => void
  onCreatingServer?: (options: StoreServerOptions) => void
  onCreateServer?: (options: StoreServerOptions) => void
  onClientConnect?: (client: Client, options: StoreServerOptions) => void
  onClientMessage?: (client: Client, msgData: string, options: StoreServerOptions) => void
  onClientDisconnect?: (client: Client, topicNamesUnsubscribedFrom: string[], options: StoreServerOptions) => void
  onClientSubscribeTopic?: (client: Client, topic: Topic) => void
  onClientUnsubscribeTopic?: (client: Client, topic: Topic) => void
}
