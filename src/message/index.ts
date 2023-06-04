import { ActionMessage, Message, MessageType } from './types'

export const sortMessagesByType = (msgs: Message | Message[]): { [TMessageType in MessageType]: Message<TMessageType>[] } => {
  const normalizedMsgs = Array.isArray(msgs) ? msgs : [msgs]

  const result: { [TMessageType in MessageType]: Message<TMessageType>[] } = {
    subscribe: [],
    unsubscribe: [],
    action: [],
    state: [],
    topic_deleted: [],
    subscribe_unsuccessful: [],
    unsubscribe_unsuccessful: [],
  }

  normalizedMsgs.forEach(msg => {
    // Typescript just isn't ready for this kind of stuff.
    // @ts-ignore
    result[msg.type].push(msg)
  })

  return result
}

export const sortActionMessagesByTopic = (msgs: ActionMessage | ActionMessage[]): { [topicName: string]: ActionMessage[] } => {
  const normalizedMsgs = Array.isArray(msgs) ? msgs : [msgs]
  const result: { [topicName: string]: ActionMessage[] } = {}

  normalizedMsgs.forEach(msg => {
    if (result[msg.data.topic] == null)
      result[msg.data.topic] = []
    result[msg.data.topic].push(msg)
  })
  return result
}
