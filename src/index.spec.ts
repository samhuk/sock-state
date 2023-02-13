import { wait } from './common/async'
import { createNodeStoreClient } from './client/node'
import { Reducer } from './reducer/types'
import { createStoreServer } from './server'

describe('e2e', () => {
  test('basic', async () => {
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
})
