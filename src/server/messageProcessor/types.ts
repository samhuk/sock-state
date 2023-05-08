import { Client } from '../../common/server/clientStore/types'
import { Message } from '../../message/types'
import { StoreServerReporter } from '../reporter/types'
import { TopicStore } from '../topicStore/types'

export type MessageProcessorOptions = {
  topicStore: TopicStore
  reporter?: StoreServerReporter
}

export type MessageProcessor = {
  process: (msgs: Message | Message[], sender: Client) => void
}
