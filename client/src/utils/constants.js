// client/src/utils/constants.js
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'ChatApp'

export const MESSAGE_STATUS = {
  SENDING: 'sending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed'
}

export const USER_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  AWAY: 'away',
  BUSY: 'busy'
}

export const FILE_TYPES = {
  IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  VIDEO: ['video/mp4', 'video/webm', 'video/ogg'],
  AUDIO: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mpeg'],
  DOCUMENT: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
}

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const MAX_MESSAGE_LENGTH = 5000
export const MESSAGES_PER_PAGE = 50
export const TYPING_TIMEOUT = 3000

export const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡']

export const KEYBOARD_SHORTCUTS = {
  SEND_MESSAGE: 'Enter',
  NEW_LINE: 'Shift+Enter',
  SEARCH: 'Ctrl+K',
  CLOSE: 'Escape'
}