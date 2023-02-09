import { createStoreClient } from '.'
import { createNodeClient } from '../../client/node'
import { StoreClientOptions } from './types'

export const createNodeStoreClient = (options: StoreClientOptions) => createStoreClient(options, createNodeClient)
