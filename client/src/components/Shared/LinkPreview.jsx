// client/src/components/Shared/LinkPreview.jsx (continued)
import { useState, useEffect } from 'react'
import { ExternalLink } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export default function LinkPreview({ url }) {
  const [preview, setPreview] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    setIsLoading(false)
    try {
      setPreview({
        title: new URL(url).hostname,
        url: url
      })
    } catch {
      setError(true)
    }
  }, [url])

  if (error || !preview) return null

  if (isLoading) {
    return (
      <div className="border rounded-lg p-3 mt-2">
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    )
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 border rounded-lg p-3 mt-2 hover:bg-muted/50 transition-colors"
    >
      <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="text-sm text-primary truncate">{preview.title}</span>
    </a>
  )
}