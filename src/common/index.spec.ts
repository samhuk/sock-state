import { createNodeClient } from './client/node'
import { createServer } from './server'
import { wait } from './async'

describe('e2e of base server & client', () => {
  test('basic', async () => {
    const server = createServer({
      host: 'localhost',
      port: 4001,
    })

    const client = createNodeClient({
      host: 'localhost',
      port: 4001,
    })

    await client.connect()

    client.send({
      foo: 'bar',
    })

    await wait(100)

    expect(Object.keys(server.getClients()).length).toBe(1)

    await client.disconnect()
    server.close()

    await wait(500)
  })

  test('message queuing', async () => {
    type TestMessage = { i: number }
    const server = createServer<TestMessage>({
      host: 'localhost',
      port: 4002,
    })

    const messages: (TestMessage | TestMessage[])[] = []
    server.on('message', msg => messages.push(JSON.parse(String(msg))))

    const client = createNodeClient<TestMessage>({
      host: 'localhost',
      port: 4002,
    })

    client.send({
      i: 1,
    })

    client.send({
      i: 2,
    })

    await client.connect()

    client.send({
      i: 3,
    })

    client.send({
      i: 4,
    })

    await wait(100)

    await client.disconnect()

    client.send({
      i: 5,
    })

    client.send({
      i: 6,
    })

    await client.connect()

    await wait(500)

    expect(messages).toEqual([
      [
        { i: 1 },
        { i: 2 },
      ],
      { i: 3 },
      { i: 4 },
      [
        { i: 5 },
        { i: 6 },
      ],
    ])

    await client.disconnect()
    await wait(100)
    server.close()
    await wait(100)
  })
})
