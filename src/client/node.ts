import { createClient } from '.'
import { Client, NodeClientOptions } from './types'
import { createNodeWebSocketAdapter } from './webSocketAdapter/node'

export const createNodeClient = <TMessage extends any>(
  options: NodeClientOptions<TMessage>,
): Client<TMessage> => createClient({
    ...options,
    wsAdapter: createNodeWebSocketAdapter({
      deserializer: options.deserializer,
      serializer: options.serializer,
      logger: options.logger,
    }),
  })
