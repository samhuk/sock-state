import { createClient } from '.'
import { BrowserClientOptions, Client } from './types'
import { createBrowserWebSocketAdapter } from './webSocketAdapter/browser'

export const createBrowserClient = <TMessage extends any>(
  options: BrowserClientOptions<TMessage>,
): Client<TMessage> => createClient({
    ...options,
    wsAdapter: createBrowserWebSocketAdapter({
      deserializer: options.deserializer,
      serializer: options.serializer,
    }),
  })
