export declare type TypeDependantBase<
  TType extends string | number,
  TMap extends { [k in TType]: any },
  TSpecificEnumType extends string | number = TType,
  TTypePropertyName extends string = 'type',
  TTypeOptionsPropertyName extends string = 'typeOptions'
> = {
  [K in TType]: {
      [k in TTypePropertyName]: K;
  } & {
      [k in TTypeOptionsPropertyName]: TMap[K];
  };
}[TType] & {
  [k in TTypePropertyName]: TSpecificEnumType;
}

export enum MessageType {
  UNSUBSCRIBE = 'unsubscribe',
  SUBSCRIBE = 'subscribe',
  ACTION = 'action',
  STATE = 'state',
  TOPIC_DELETED = 'topic_deleted'
}

export type Message<TMessageType extends MessageType = MessageType> = TypeDependantBase<MessageType, {
  [MessageType.SUBSCRIBE]: SubscribeMessageOptions
  [MessageType.UNSUBSCRIBE]: UnsubscribeMessageOptions
  [MessageType.ACTION]: ActionMessageOptions
  [MessageType.STATE]: StateMessageOptions
  [MessageType.TOPIC_DELETED]: TopicDeletedMessageOptions
}, TMessageType, 'type', 'data'> & { dateCreated: number }

export type MessageList = Message[]

export type ActionMessage = Message<MessageType.ACTION>

export type Action = {
  type: string
  payload: any
}

export type ActionMessageOptions<TAction extends Action = Action> = TAction & {
  topic: string
}

export type SubscribeMessage = Message<MessageType.SUBSCRIBE>

export type SubscribeMessageOptions = {
  topics: string | string[]
}

export type UnsubscribeMessageOptions = {
  topics: string | string[]
}

export type UnsubscribeMessage = Message<MessageType.UNSUBSCRIBE>

export type TopicDeletedMessageOptions = {
  topicName: string
  data?: any
}

export type TopicDeletedMessage = Message<MessageType.TOPIC_DELETED>

export type ResolvedMessages = {
  subscribe: SubscribeMessage[],
  action: { [topicName: string]: ActionMessage[] }
}

export type StateMessageOptions = {
  topic: string
  state: any
}

export type StateMessage = Message<MessageType.STATE>
