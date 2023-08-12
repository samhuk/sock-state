import { Client } from '../../common/server/clientStore/types'
import { Message } from '../../message/types'
import { StoreServerReporter } from '../reporter/types'
import { TopicStore } from '../topicStore/types'
import { SubscriptionAcceptor } from '../types'

export type MessageProcessorOptions = {
  topicStore: TopicStore
  reporter?: StoreServerReporter
  subscriptionAcceptor?: SubscriptionAcceptor,
}

export type MessageProcessor = {
  process: (msgs: Message | Message[], sender: Client) => void
}
