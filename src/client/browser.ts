import { createStoreClient } from '.'
import { createBrowserClient } from '../common/client/browser'
import { StoreClientOptions } from './types'

export const createBrowserStoreClient = (options: StoreClientOptions) => createStoreClient(options, createBrowserClient)
