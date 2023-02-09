import { createServer } from '.'
import { createNodeClient } from '../client/node'
import { Message, MessageType } from '../message/types'
import { wait } from '../util/async'

describe('server', () => {
  describe('createServer', () => {
    const fn = createServer

    test('basic test', async () => {
      const instance = fn({
        host: 'localhost',
        port: 4000,
      })

      const client = createNodeClient<Message>({
        host: 'localhost',
        port: 4000,
      })

      await client.connect()

      client.send({
        type: MessageType.ACTION,
        data: {
          type: 'topic1/actionName',
          payload: { foo: 'bar' },
        },
        dateCreated: Date.now(),
      })

      await wait(100)

      expect(Object.keys(instance.getClients()).length).toBe(1)

      await client.disconnect()
      await wait(100)
      instance.close()
      await wait(100)
    })
  })
})
