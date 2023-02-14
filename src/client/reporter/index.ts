import { StoreClientReporter } from './types'

export const CONSOLE_LOG_CLIENT_REPORTER: StoreClientReporter = {
  onConnectAttemptStart: (host, port) => console.log(`Connecting to ws://${host}:${port}`),
  onConnect: (host, port) => console.log(`Connected to ws://${host}:${port}`),
  onConnectAttemptFail: (host, port) => console.log(`Could not connect to ws://${host}:${port}`),
  onDisconnect: (host, port) => console.log(`Disconnected from ws://${host}:${port}`),
  onMessages: msgs => console.log(`Recieved message(s): ${msgs}`),
}
