<h1 align="center">Sock State</h1>
<p align="center">
  <em>Redux-like state container over Web Sockets</em>
</p>

<p align="center">
  <a href="https://github.com/samhuk/sock-state/actions/workflows/ci.yaml/badge.svg" target="_blank">
    <img src="https://github.com/samhuk/sock-state/actions/workflows/ci.yaml/badge.svg" alt="ci status" />
  </a>
  <a href="https://img.shields.io/badge/License-MIT-green.svg" target="_blank">
    <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="license" />
  </a>
  <a href="https://badge.fury.io/js/sock-state.svg" target="_blank">
    <img src="https://badge.fury.io/js/sock-state.svg" alt="npm version" />
  </a>
</p>

## Overview

Sock State allows you to create [Redux](https://redux.js.org/)-like stores that can be updated and subscribed to over [Web Sockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API).

Sock State breaks down your state into **Topics**. Clients dispatch **Actions** to Topics to update it's state. Actions to Topics are broadcasted to all subscribers of the Topic, notifying them of state changes.

## Usage Overview

```js
import { createStoreServer } from 'sock-state'
import { createNodeStoreClient } from 'sock-state/lib/client/node'

// Declare reducer for server and client
export const chatAppReducer = (state, action) => {
  if (state == null)
    return { chatMsgs: [] }

  switch (action.type) {
    case 'addChatMessage':
      return { chatMsgs: state.chatMessages.concat(action.payload) }
    default:
      return state
  }
}

// Create server for websockets and state
const server = createStoreServer({
  host: 'localhost',
  port: 4000,
  topics: { chatApp: { reducer: chatAppReducer } },
})

// Create clients and connect to server
const client1 = createNodeStoreClient({ host: 'localhost', port: 4000 })
const client2 = createNodeStoreClient({ host: 'localhost', port: 4000 })
client1.connect()
client2.connect()

// Subscribe clients to topic actions
const client1ChatAppTopic = storeClient.subscribe('chatApp')
const client2ChatAppTopic = storeClient.subscribe('chatApp')

// Subscribe clients to topic state changes
client1ChatAppTopic.on('state-change', chatAppReducer, state => {
  console.log('client 1 new state:', state.chatMsgs)
})
client2ChatAppTopic.on('state-change', chatAppReducer, state => {
  console.log('client 2 new state:', state.chatMsgs)
})

// Dispatch actions to topics
client1ChatAppTopic.dispatch({ type: 'addChatMessage', payload: { from: 'client1', text: 'Hey Client 2!' } })
client2ChatAppTopic.dispatch({ type: 'addChatMessage', payload: { from: 'client1', text: 'Hey Client 1!' } })
```

### Examples

[./examples/chat-app](./examples/chat-app) - A basic chat app. To run this, clone this repository and run `npm i` then `npm run chat-app` (requires Node.js and npm).

## Development

See [./contributing/development.md](./contributing/development.md)

---

If you found this package delightful, feel free to [buy me a coffee](https://www.buymeacoffee.com/samhuk) ✨
