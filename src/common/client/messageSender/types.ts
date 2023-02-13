export type MessageSender<
  TMessage extends any = any
> = {
  send: (msg: TMessage) => void
}
