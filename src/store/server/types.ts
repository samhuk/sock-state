export type StoreServer = {
  
}

export type Topic = {
  broadcast: (message)
  subscribers: {
    [clientUuid: string]: { dateSubscribed: number }
  }
}

export type TopicOptionsDict = {
  [topicName: string]: {

  }
}

export type StoreServerOptions = {
  host: string
  port: number
  topics: TopicOptionsDict
}
