import { ConnectionStatus } from '../../common/connectionStatus'
import { Message } from '../../message/types'
import { StoreClientOptions } from '../types'

export type StoreClientReporter = {
  onBegin?: (options: StoreClientOptions) => void
  onConnect?: (host: string, port: number) => void
  onConnectAttemptStart?: (host: string, port: number) => void
  onConnectAttemptFail?: (host: string, port: number) => void
  onDisconnect?: (host: string, port: number) => void
  onConnectionStatusChange?: (newStatus: ConnectionStatus, prevStatus: ConnectionStatus) => void
  onMessages?: (msgs: Message | Message[]) => void
}
