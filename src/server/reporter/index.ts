import { StoreServerReporter } from './types'

export const CONSOLE_LOG_SERVER_REPORTER: StoreServerReporter = {
  onCreatingServer: options => `Creating store server on ws://${options.host}:${options.port}`,
  onClientConnect: client => `Client ${client.shortUuid} connected.`,
  onClientDisconnect: client => `Client ${client.shortUuid} disconnected.`,
  onClientMessage: (client, msgData) => `Message recieved from client ${client.shortUuid}: ${msgData}`,
}
