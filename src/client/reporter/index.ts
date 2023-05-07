import { StoreClientReporter } from './types'

export const CONSOLE_LOG_CLIENT_REPORTER: StoreClientReporter = {
  onConnectAttemptStart: (host, port) => console.log(`Connecting to ws://${host}:${port}`),
  onConnect: (host, port) => console.log(`Connected to ws://${host}:${port}`),
  onConnectAttemptFail: (host, port) => console.log(`Could not connect to ws://${host}:${port}`),
  onDisconnect: (host, port, info) => console.log(`Disconnected from ws://${host}:${port}. Reason: ${info.reason}${info.data != null ? ` (${JSON.stringify(info.data)})` : ''}`),
  onMessages: msgs => console.log(`Recieved message(s): ${msgs}`),
  onSubscribe: topicName => console.log(`Subscribing to topic "${topicName}".`),
  onTopicDeleted: (topicName, data) => console.log(`Topic "${topicName}" was deleted from server. Additional data: `, data),
  onConnectionStatusChange: (newStatus, prevStatus) => console.log(`Connection status changed: ${prevStatus} --> ${newStatus}`),
}
