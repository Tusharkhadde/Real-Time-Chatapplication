// client/src/hooks/useChat.js
import { useCallback, useMemo } from 'react'
import { useChat as useChatContext } from '@/context/ChatContext'
import { useSocket } from '@/context/SocketContext'

export function useChat() {
  const chat = useChatContext()
  const { isUserOnline, getUserStatus } = useSocket()

  const getOtherParticipant = useCallback((conversation) => {
    if (!conversation || conversation.isGroup) return null
    return conversation.participants?.find(p => p._id !== chat.currentUser?._id)
  }, [chat.currentUser])

  const getConversationName = useCallback((conversation) => {
    if (!conversation) return ''
    if (conversation.isGroup) return conversation.name || 'Group Chat'
    const other = getOtherParticipant(conversation)
    return other?.name || 'Unknown'
  }, [getOtherParticipant])

  const getConversationAvatar = useCallback((conversation) => {
    if (!conversation) return null
    if (conversation.isGroup) return conversation.avatar
    const other = getOtherParticipant(conversation)
    return other?.avatar
  }, [getOtherParticipant])

  const isConversationOnline = useCallback((conversation) => {
    if (!conversation || conversation.isGroup) return false
    const other = getOtherParticipant(conversation)
    return other ? isUserOnline(other._id) : false
  }, [getOtherParticipant, isUserOnline])

  const sortedConversations = useMemo(() => {
    return [...chat.conversations].sort((a, b) => {
      const aTime = a.lastMessage?.createdAt || a.createdAt
      const bTime = b.lastMessage?.createdAt || b.createdAt
      return new Date(bTime) - new Date(aTime)
    })
  }, [chat.conversations])

  const totalUnreadCount = useMemo(() => {
    let count = 0
    chat.unreadCounts.forEach(value => count += value)
    return count
  }, [chat.unreadCounts])

  return {
    ...chat,
    getOtherParticipant,
    getConversationName,
    getConversationAvatar,
    isConversationOnline,
    sortedConversations,
    totalUnreadCount
  }
}

export default useChat