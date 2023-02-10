import { Server } from '../../server/types'
import { TopicOptionsDict } from './topicStore/types'

export type StoreServer = {
  server: Server
  close: () => void
}

export type StoreServerOptions = {
  host: string
  port: number
  topics: TopicOptionsDict
}
