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
  ACTION = 'action'
}

export type Message<TMessageType extends MessageType = MessageType> = TypeDependantBase<MessageType, {
  [MessageType.ACTION]: ActionMessageOptions
}, TMessageType, 'type', 'data'> & { dateCreated: number }

export type MessageList = Message[]

export type ActionMessage = Message<MessageType.ACTION>

export type ActionMessageOptions = {
  type: string
  payload: any
}
