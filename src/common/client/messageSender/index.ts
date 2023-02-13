import { ConnectionStatus } from '../../connectionStatus'
import { MessageSender } from './types'
import { WebSocketAdapter } from '../webSocketAdapter/types'

/**
 * Responsible for sending messages via web sockets and queuing messages
 * if connection is lost until connection is re-established.
 */
export const createMessageSender = <TMessage extends any>(webSocketAdapter: WebSocketAdapter): MessageSender => {
  let queuedMsgs: TMessage[] = []

  // Send any built-up messages on connect
  webSocketAdapter.on('connect', () => {
    if (queuedMsgs.length === 0)
      return

    webSocketAdapter.send(queuedMsgs)
    queuedMsgs = []
  })

  return {
    send: msg => {
      if (webSocketAdapter.connectionStatus !== ConnectionStatus.CONNECTED)
        queuedMsgs.push(msg)
      else
        webSocketAdapter.send(msg)
    },
  }
}
