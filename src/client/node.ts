import { createStoreClient } from '.'
import { createNodeClient } from '../common/client/node'
import { StoreClientOptions } from './types'

export const createNodeStoreClient = (options: StoreClientOptions) => createStoreClient(options, createNodeClient)

export default createNodeStoreClient
