import { StoreServerReporter } from './types'

export const CONSOLE_LOG_SERVER_REPORTER: StoreServerReporter = {
  onCreatingServer: options => console.log(`Creating store server on ws://${options.host}:${options.port}`),
  onCreateServer: options => console.log(`Created store server on ws://${options.host}:${options.port}`),
  onClientConnect: client => console.log(`Client ${client.shortUuid} connected.`),
  onClientDisconnect: client => console.log(`Client ${client.shortUuid} disconnected.`),
  onClientMessage: (client, msgData) => console.log(`Message recieved from client ${client.shortUuid}: ${msgData}`),
  onClientSubscribeTopic: (client, topic) => console.log(`Client ${client.shortUuid} subscribed to ${topic.name} (${topic.getNumSubscribers()} subscribers).`),
  onClientUnsubscribeTopic: (client, topic) => console.log(`Client ${client.shortUuid} unsubscribed from ${topic.name} (${topic.getNumSubscribers()} subscribers).`),
}
