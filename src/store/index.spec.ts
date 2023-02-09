import { wait } from '../util/async'
import { createNodeStoreClient } from './client/node'
import { Reducer } from './reducer/types'
import { createStoreServer } from './server'

describe('store', () => {
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

    const client1FooBarTopicSubscription = client1.subscribe('fooBar', fooBarReducer)
    const client2FooBarTopicSubscription = client2.subscribe('fooBar', fooBarReducer)

    const stateUpdatesClient1: FooBarState[] = []
    const stateUpdatesClient2: FooBarState[] = []

    const client1FooBarTopicChangeHandler = client1FooBarTopicSubscription.addHandler(state => {
      stateUpdatesClient1.push(state)
    })

    const client2FooBarTopicChangeHandler = client2FooBarTopicSubscription.addHandler(state => {
      stateUpdatesClient2.push(state)
    })

    await wait(100)

    client1.dispatch({
      topic: 'fooBar',
      type: 'setFoo',
      payload: {
        foo: true,
      },
    })

    client2.dispatch({
      topic: 'fooBar',
      type: 'setBar',
      payload: {
        bar: true,
      },
    })

    await wait(500)

    await client1.disconnect()
    await client2.disconnect()
    await server.server.close()

    await wait(100)

    expect(stateUpdatesClient1).toEqual([
      { foo: true, bar: false },
      { foo: true, bar: true },
    ])

    expect(stateUpdatesClient2).toEqual(stateUpdatesClient1)
  })
})
