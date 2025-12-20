// client/src/hooks/useMessageSearch.js
import { useState, useCallback, useMemo } from 'react'
import { debounce } from '@/utils/helpers'
import api from '@/services/api'

export function useMessageSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const search = useCallback(async (searchQuery, conversationId = null) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({ q: searchQuery })
      if (conversationId) {
        params.append('conversationId', conversationId)
      }

      const response = await api.get(`/messages/search?${params}`)
      setResults(response.data.messages)
    } catch (err) {
      setError(err.message)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const debouncedSearch = useMemo(
    () => debounce(search, 300),
    [search]
  )

  const handleQueryChange = useCallback((newQuery) => {
    setQuery(newQuery)
    debouncedSearch(newQuery)
  }, [debouncedSearch])

  const clearSearch = useCallback(() => {
    setQuery('')
    setResults([])
    setError(null)
  }, [])

  return {
    query,
    results,
    isLoading,
    error,
    search: handleQueryChange,
    clearSearch
  }
}

export default useMessageSearch