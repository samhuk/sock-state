import { ConnectionStatus } from '../../common/connectionStatus'
import { DisconnectInfo } from '../../common/types'
import { Message } from '../../message/types'
import { StoreClientOptions } from '../types'

export type StoreClientReporter = {
  onBegin?: (options: StoreClientOptions) => void
  onConnect?: (host: string, port: number) => void
  onConnectAttemptStart?: (host: string, port: number) => void
  onConnectAttemptFail?: (host: string, port: number) => void
  onDisconnect?: (host: string, port: number, info: DisconnectInfo) => void
  onConnectionStatusChange?: (newStatus: ConnectionStatus, prevStatus: ConnectionStatus) => void
  onMessages?: (msgs: Message | Message[]) => void
  onSubscribe?: (topicName: string) => void
  onTopicDeleted?: (topicName: string, data?: any) => void
}
