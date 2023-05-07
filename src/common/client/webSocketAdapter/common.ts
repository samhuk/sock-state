import { DisconnectInfo } from '../../types'

const DEFAULT_DISCONNECT_INFO: DisconnectInfo = {
  reason: 'disconnected',
  data: undefined,
}

export const parseDisconnectReason = (reason: string | undefined | null): DisconnectInfo => {
  if (reason == null || reason.length === 0)
    return DEFAULT_DISCONNECT_INFO

  try {
    const info: DisconnectInfo = JSON.parse(reason)
    return {
      reason: info?.reason ?? DEFAULT_DISCONNECT_INFO.reason,
      data: info?.data ?? DEFAULT_DISCONNECT_INFO.data,
    }
  }
  catch {
    return DEFAULT_DISCONNECT_INFO
  }
}
