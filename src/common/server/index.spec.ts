import { createNodeClient } from '../client/node'
import { createServer } from '.'
import { wait } from '../async'

describe('server', () => {
  describe('createServer', () => {
    const fn = createServer

    test('basic test', async () => {
      const instance = fn({
        host: 'localhost',
        port: 4000,
      })

      type TestMessage = {
        type: string
        data: any,
        dateCreated: number
      }

      const client = createNodeClient<TestMessage>({
        host: 'localhost',
        port: 4000,
      })

      await client.connect()

      client.send({
        type: 'action',
        data: {
          type: 'topic1/actionName',
          payload: { foo: 'bar' },
        },
        dateCreated: Date.now(),
      })

      await wait(100)

      expect(Object.keys(instance.clients).length).toBe(1)

      await client.disconnect()
      await wait(100)
      instance.close()
      await wait(100)
    })
  })
})
