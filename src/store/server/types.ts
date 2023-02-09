import { Server } from '../../server/types'
import { TopicOptionsDict } from './topicStore/types'

export type StoreServer = {
  server: Server
}

export type StoreServerOptions = {
  host: string
  port: number
  topics: TopicOptionsDict
}
