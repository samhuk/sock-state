import { Reducer } from './reducer/types'
import { createNodeStoreClient } from './client/node'
import { createStoreServer } from './server'
import { wait } from './common/async'

type FooBarState = {
  foo: boolean
  bar: boolean
}

type SetFooAction = {
  type: 'setFoo'
  payload: {
    foo: boolean
  }
}

type SetBarAction = {
  type: 'setBar'
  payload: {
    bar: boolean
  }
}

type FooBarActions = SetFooAction | SetBarAction

const INITIAL_FOO_BAR_STATE: FooBarState = {
  foo: false,
  bar: false,
}

const fooBarReducer: Reducer<FooBarState, FooBarActions> = (state, action) => {
  if (state == null)
    return INITIAL_FOO_BAR_STATE

  if (action == null)
    return state

  switch (action.type) {
    case 'setFoo':
      return {
        ...state,
        foo: action.payload.foo,
      }
    case 'setBar':
      return {
        ...state,
        bar: action.payload.bar,
      }
    default:
      return state
  }
}

const setFoo = (val: boolean): FooBarActions => ({
  type: 'setFoo',
  payload: {
    foo: val,
  },
})

const setBar = (val: boolean): FooBarActions => ({
  type: 'setBar',
  payload: {
    bar: val,
  },
})

describe('e2e', () => {
  test('basic', async () => {
    const server = createStoreServer({
      host: 'localhost',
      port: 4003,
      topics: {
        fooBar: {
          reducer: fooBarReducer as Reducer,
        },
      },
    })

    const client1 = createNodeStoreClient({
      host: 'localhost',
      port: 4003,
    })

    const client2 = createNodeStoreClient({
      host: 'localhost',
      port: 4003,
    })

    await client1.connect()
    await client2.connect()

    const client1FooBarTopic = client1.topic<FooBarState, FooBarActions>('fooBar')
    const client2FooBarTopic = client2.topic<FooBarState, FooBarActions>('fooBar')

    const stateUpdatesClient1: FooBarState[] = []
    const stateUpdatesClient2: FooBarState[] = []

    client1FooBarTopic.on('state-change', fooBarReducer, state => {
      stateUpdatesClient1.push(state)
    })

    client2FooBarTopic.on('state-change', fooBarReducer, state => {
      stateUpdatesClient2.push(state)
    })

    await wait(100)

    client1FooBarTopic.dispatch(setFoo(true))
    client2FooBarTopic.dispatch(setBar(true))
    client2FooBarTopic.dispatch(setBar(false))
    client2FooBarTopic.dispatch(setFoo(false))

    await wait(500)

    expect(stateUpdatesClient1).toEqual([
      { foo: false, bar: false }, // Initial state
      { foo: true, bar: false }, // Client 1 updates foo
      { foo: true, bar: true }, // Client 2 update bar
      { foo: true, bar: false }, // Client 2 update bar
      { foo: false, bar: false }, // Client 2 update foo
    ])

    expect(stateUpdatesClient2).toEqual(stateUpdatesClient1)

    await client1.disconnect()
    await client2.disconnect()
    server.close()

    await wait(100)
  })

  test('dynamic topics', async () => {
    const server = createStoreServer({
      host: 'localhost',
      port: 4004,
    })

    const client1 = createNodeStoreClient({
      host: 'localhost',
      port: 4004,
    })

    const client2 = createNodeStoreClient({
      host: 'localhost',
      port: 4004,
    })

    await client1.connect()
    await client2.connect()

    server.addTopic({
      name: 'fooBar',
      reducer: fooBarReducer as Reducer,
    })

    const client1FooBarTopic = client1.topic<FooBarState, FooBarActions>('fooBar')
    const client2FooBarTopic = client2.topic<FooBarState, FooBarActions>('fooBar')

    const stateUpdatesClient1: FooBarState[] = []
    const stateUpdatesClient2: FooBarState[] = []

    const topicDeletedUpdatesClient1: any[] = []
    const topicDeletedUpdatesClient2: any[] = []

    client1FooBarTopic.on('state-change', fooBarReducer, state => {
      stateUpdatesClient1.push(state)
    })

    client2FooBarTopic.on('state-change', fooBarReducer, state => {
      stateUpdatesClient2.push(state)
    })

    client1FooBarTopic.on('topic-deleted', data => {
      topicDeletedUpdatesClient1.push(data)
    })

    client2FooBarTopic.on('topic-deleted', data => {
      topicDeletedUpdatesClient2.push(data)
    })

    await wait(100)

    client1FooBarTopic.dispatch(setFoo(true))
    client2FooBarTopic.dispatch(setBar(true))
    client2FooBarTopic.dispatch(setBar(false))
    client2FooBarTopic.dispatch(setFoo(false))

    await wait(500)

    expect(stateUpdatesClient1).toEqual([
      { foo: false, bar: false }, // Initial state
      { foo: true, bar: false }, // Client 1 updates foo
      { foo: true, bar: true }, // Client 2 update bar
      { foo: true, bar: false }, // Client 2 update bar
      { foo: false, bar: false }, // Client 2 update foo
    ])

    // Expect client 2 to recieve same state updates as client 1
    expect(stateUpdatesClient2).toEqual(stateUpdatesClient1)

    server.deleteTopic('fooBar', { reason: '123' })

    await wait(100)

    expect(topicDeletedUpdatesClient1).toEqual([{ reason: '123' }])
    expect(topicDeletedUpdatesClient2).toEqual(topicDeletedUpdatesClient1)
    expect(server.getTopic('fooBar')).toEqual(undefined)
    expect(server.getTopicList()).toEqual([])

    await client1.disconnect()
    await client2.disconnect()
    server.close()

    await wait(100)
  })
})
