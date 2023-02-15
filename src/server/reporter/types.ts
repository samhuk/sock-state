import { Client } from '../../common/server/clientStore/types'
import { Topic } from '../topicStore/topic/types'
import { StoreServerOptions } from '../types'

export type StoreServerReporter = {
  onBegin?: (options: StoreServerOptions) => void
  onCreatingServer?: (options: StoreServerOptions) => void
  onCreateServer?: (options: StoreServerOptions) => void
  onClientConnect?: (client: Client, options: StoreServerOptions) => void
  onClientMessage?: (client: Client, msgData: string, options: StoreServerOptions) => void
  onClientDisconnect?: (client: Client, options: StoreServerOptions) => void
  onClientSubscribeTopic?: (client: Client, topicName: Topic) => void
}
