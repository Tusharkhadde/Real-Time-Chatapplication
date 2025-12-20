// client/src/hooks/useSocket.js
import { useEffect, useCallback, useRef } from 'react'
import { useSocket as useSocketContext } from '@/context/SocketContext'

export function useSocketEvent(event, handler) {
  const { socket, isConnected } = useSocketContext()
  const handlerRef = useRef(handler)

  useEffect(() => {
    handlerRef.current = handler
  }, [handler])

  useEffect(() => {
    if (!socket || !isConnected) return

    const eventHandler = (...args) => handlerRef.current(...args)
    socket.on(event, eventHandler)

    return () => {
      socket.off(event, eventHandler)
    }
  }, [socket, isConnected, event])
}

export function useSocketEmit() {
  const { socket, isConnected } = useSocketContext()

  const emit = useCallback((event, data, callback) => {
    if (socket && isConnected) {
      socket.emit(event, data, callback)
    }
  }, [socket, isConnected])

  return emit
}

export default useSocketEvent