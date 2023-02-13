import { Reducer } from '../../src/reducer/types'

export type ChatMessage = {
  from: string
  text: string
}

export type ChatAppState = {
  chatMessages: ChatMessage[]
}

export type AddChatMessageAction = {
  type: 'addChatMessage'
  payload: {
    chatMessage: ChatMessage
  }
}

export type ChatAppActions = AddChatMessageAction

export const INITIAL_STATE: ChatAppState = {
  chatMessages: [],
}

export const chatAppReducer: Reducer<ChatAppState, ChatAppActions> = (state, action) => {
  if (state == null)
    return INITIAL_STATE

  switch (action.type) {
    case 'addChatMessage':
      return {
        ...state,
        chatMessages: state.chatMessages.concat(action.payload.chatMessage),
      }
    default:
      return state
  }
}

export const addChatMessage = (from: string, text: string): ChatAppActions => ({
  type: 'addChatMessage',
  payload: {
    chatMessage: {
      from,
      text,
    },
  },
})
