import { AddChatMessageAction, ChatAppState, ChatMessage, addChatMessage } from '../common'

import { CONSOLE_LOG_CLIENT_REPORTER } from '../../../src/client/reporter'
import { TopicSubscription } from '../../../src/client/types'
import { createBrowserStoreClient } from '../../../src/client/browser'

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

  return {
    el,
    addChatMsgs: (msgs: ChatMessage[]) => msgs.forEach(addChatMsg),
    addChatMsg,
    removeAllChatMsgs: () => {
      while (msgListEl.childElementCount > 0)
        msgListEl.firstElementChild.remove()
    },
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
    setEnabled: (newEnabled: boolean) => {
      button.disabled = !newEnabled
      msgTextInput.disabled = !newEnabled
    },
  }
}

const bindTopicToState = (
  topicSubscription: TopicSubscription<ChatAppState, AddChatMessageAction>,
  messageList: any,
) => {
  topicSubscription.on('get-state', newState => {
    messageList.removeAllChatMsgs()
    messageList.addChatMsgs(newState.chatMessages)
  })

  topicSubscription.on('action', actions => {
    const chatMessages = Array.isArray(actions)
      ? actions.map(a => a.payload.chatMessage)
      : [actions.payload.chatMessage]
    messageList.addChatMsgs(chatMessages)
  })
}

const main = async () => {
  const rootEl = document.getElementById('app')

  const messageList = createMessageList()
  let topicSubscription: TopicSubscription<ChatAppState, AddChatMessageAction>

  const fromLabel = createEl('label', 'from-label')
  fromLabel.textContent = 'Username:'
  const fromInput = createEl('input')
  fromInput.type = 'text'
  const toggleTopicSubscribedButton = createEl('button', 'toggle-topic-subscribed-button')
  toggleTopicSubscribedButton.textContent = 'Unsubscribe'

  const storeClient = createBrowserStoreClient({
    host: 'localhost',
    port: 4001,
    reporter: CONSOLE_LOG_CLIENT_REPORTER,
  })

  await storeClient.connect()

  const sendMessageForm = createSendMessageForm({
    onSubmit: text => topicSubscription.dispatch(addChatMessage(fromInput.value, text)),
  })

  toggleTopicSubscribedButton.addEventListener('click', () => {
    if (topicSubscription == null) {
      topicSubscription = storeClient.topic('chatApp')
      bindTopicToState(topicSubscription, messageList)
      toggleTopicSubscribedButton.textContent = 'Unsubscribe'
      sendMessageForm.setEnabled(true)
    }
    else {
      topicSubscription.unsubscribe()
      toggleTopicSubscribedButton.textContent = 'Subscribe'
      sendMessageForm.setEnabled(false)
      topicSubscription = null
    }
  })

  topicSubscription = storeClient.topic('chatApp')
  bindTopicToState(topicSubscription, messageList)

  rootEl.appendChild(fromLabel)
  rootEl.appendChild(fromInput)
  rootEl.appendChild(toggleTopicSubscribedButton)
  rootEl.appendChild(messageList.el)
  rootEl.appendChild(sendMessageForm.el)
}

main()

export {}
