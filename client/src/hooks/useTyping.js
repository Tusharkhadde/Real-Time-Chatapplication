// client/src/hooks/useTyping.js
import { useState, useCallback, useRef, useEffect } from 'react'
import { useChat } from '@/context/ChatContext'

export function useTyping(delay = 1000) {
  const [isTyping, setIsTyping] = useState(false)
  const { sendTyping } = useChat()
  const timeoutRef = useRef(null)

  const startTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true)
      sendTyping(true)
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout to stop typing
    timeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      sendTyping(false)
    }, delay)
  }, [isTyping, sendTyping, delay])

  const stopTyping = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (isTyping) {
      setIsTyping(false)
      sendTyping(false)
    }
  }, [isTyping, sendTyping])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return { isTyping, startTyping, stopTyping }
}

export default useTyping