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
  TOPIC_DELETED = 'topic_deleted',
  SUBSCRIBE_UNSUCCESSFUL = 'subscribe_unsuccessful',
  UNSUBSCRIBE_UNSUCCESSFUL = 'unsubscribe_unsuccessful'
}

export type Message<TMessageType extends MessageType = MessageType> = TypeDependantBase<MessageType, {
  [MessageType.SUBSCRIBE]: SubscribeMessageOptions
  [MessageType.UNSUBSCRIBE]: UnsubscribeMessageOptions
  [MessageType.ACTION]: ActionMessageOptions
  [MessageType.STATE]: StateMessageOptions
  [MessageType.TOPIC_DELETED]: TopicDeletedMessageOptions
  [MessageType.SUBSCRIBE_UNSUCCESSFUL]: SubscribeUnsuccessfulMessageOptions
  [MessageType.UNSUBSCRIBE_UNSUCCESSFUL]: UnsubscribeUnsuccessfulMessageOptions
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
  /**
   * The name of the topic that was deleted.
   */
  topicName: string
  data?: any
}

export type TopicDeletedMessage = Message<MessageType.TOPIC_DELETED>

export type SubscribeUnsuccessfulMessageOptions = {
  /**
   * The name of the topic that was unsuccessfully (un)subscribed to.
   */
  topic: string
  data?: any
}

export type SubscribeUnsuccessfulMessage = Message<MessageType.SUBSCRIBE_UNSUCCESSFUL>

export type UnsubscribeUnsuccessfulMessageOptions = {
  topic: string
  data?: 'topic-not-exist' | 'not-subscribed'
}

export type UnsubscribeUnsuccessfulMessage = Message<MessageType.UNSUBSCRIBE_UNSUCCESSFUL>

export type ResolvedMessages = {
  subscribe: SubscribeMessage[],
  action: { [topicName: string]: ActionMessage[] }
}

export type StateMessageOptions = {
  topic: string
  state: any
}

export type StateMessage = Message<MessageType.STATE>
