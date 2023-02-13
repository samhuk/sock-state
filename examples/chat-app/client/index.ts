import { createBrowserStoreClient } from '../../../src/client/browser'
import { addChatMessage, ChatAppActions, ChatAppState, ChatMessage, INITIAL_STATE } from '../common'

const createEl = <K extends keyof HTMLElementTagNameMap>(tagName: K, className?: string): HTMLElementTagNameMap[K] => {
  const el = document.createElement(tagName)
  if (className != null)
    el.classList.add(className)
  return el
}

const createMessageList = () => {
  const el = createEl('div', 'message-list-wrapper')
  const titleEl = createEl('h3', 'title')
  titleEl.textContent = 'Messages'
  const msgListEl = createEl('div', 'message-list')

  el.appendChild(titleEl)
  el.appendChild(msgListEl)

  const addChatMsg = (msg: ChatMessage) => {
    const msgEl = createEl('div', 'item')

    const fromEl = createEl('span', 'from')
    fromEl.textContent = msg.from

    const textEl = createEl('span', 'text')
    textEl.textContent = msg.text

    msgEl.appendChild(fromEl)
    msgEl.appendChild(textEl)

    msgListEl.appendChild(msgEl)
  }

  const addChatMsgs = (msgs: ChatMessage[]) => msgs.forEach(addChatMsg)

  return {
    el,
    addChatMsgs,
    addChatMsg,
  }
}

const createSendMessageForm = (options: {
  onSubmit: (text: string) => void
}) => {
  const el = createEl('div', 'send-msg-form')

  const msgTextInput = document.createElement('input')
  msgTextInput.type = 'text'

  const button = document.createElement('button')
  button.type = 'button'
  button.disabled = true

  msgTextInput.addEventListener('input', () => {
    button.disabled = msgTextInput.value.length === 0
  })

  button.addEventListener('click', () => {
    options.onSubmit(msgTextInput.value)
    msgTextInput.value = ''
  })
  button.textContent = 'Send'

  el.appendChild(msgTextInput)
  el.appendChild(button)

  return {
    el,
  }
}

const main = async () => {
  let state: ChatAppState = INITIAL_STATE

  const rootEl = document.getElementById('app')

  const messageList = createMessageList()

  const fromLabel = createEl('label', 'from-label')
  fromLabel.textContent = 'Username:'
  const fromInput = createEl('input')
  fromInput.type = 'text'

  rootEl.appendChild(fromLabel)
  rootEl.appendChild(fromInput)

  rootEl.appendChild(messageList.el)

  const storeClient = createBrowserStoreClient({
    host: 'localhost',
    port: 4001,
  })

  storeClient.connect()

  const chatAppTopic = storeClient.topic<ChatAppState, ChatAppActions>('chatApp')

  chatAppTopic.on('get-state', newState => {
    state = newState
    messageList.addChatMsgs(newState.chatMessages)
  })

  chatAppTopic.on('action', actions => {
    const chatMessages = Array.isArray(actions)
      ? actions.map(a => a.payload.chatMessage)
      : [actions.payload.chatMessage]
    messageList.addChatMsgs(chatMessages)
  })

  const sendMessageForm = createSendMessageForm({
    onSubmit: text => chatAppTopic.dispatch(addChatMessage(fromInput.value, text)),
  })

  rootEl.appendChild(sendMessageForm.el)
}

main()

export {}
