// client/src/utils/helpers.js
export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

export function throttle(func, limit) {
  let inThrottle
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

export function groupBy(array, key) {
  return array.reduce((result, item) => {
    const group = typeof key === 'function' ? key(item) : item[key]
    if (!result[group]) {
      result[group] = []
    }
    result[group].push(item)
    return result
  }, {})
}

export function uniqueBy(array, key) {
  const seen = new Set()
  return array.filter(item => {
    const k = typeof key === 'function' ? key(item) : item[key]
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

export function getInitials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function getFileType(file) {
  const type = file.type || ''
  
  if (type.startsWith('image/')) return 'image'
  if (type.startsWith('video/')) return 'video'
  if (type.startsWith('audio/')) return 'audio'
  if (type.includes('pdf')) return 'pdf'
  if (type.includes('word') || type.includes('document')) return 'document'
  if (type.includes('sheet') || type.includes('excel')) return 'spreadsheet'
  
  return 'file'
}

export function getFileExtension(filename) {
  if (!filename) return ''
  const parts = filename.split('.')
  return parts.length > 1 ? parts.pop().toLowerCase() : ''
}

export function isImageFile(file) {
  return file?.type?.startsWith('image/')
}

export function isVideoFile(file) {
  return file?.type?.startsWith('video/')
}

export function isAudioFile(file) {
  return file?.type?.startsWith('audio/')
}

export function copyToClipboard(text) {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text)
  }
  
  const textArea = document.createElement('textarea')
  textArea.value = text
  textArea.style.position = 'fixed'
  textArea.style.left = '-9999px'
  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()
  
  try {
    document.execCommand('copy')
    return Promise.resolve()
  } catch (err) {
    return Promise.reject(err)
  } finally {
    document.body.removeChild(textArea)
  }
}

export function downloadFile(url, filename) {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function scrollToBottom(element, smooth = true) {
  if (element) {
    element.scrollTo({
      top: element.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto'
    })
  }
}

export function generateColor(str) {
  if (!str) return '#6366f1'
  
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  const colors = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308',
    '#84cc16', '#22c55e', '#10b981', '#14b8a6',
    '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
    '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'
  ]
  
  return colors[Math.abs(hash) % colors.length]
}

export function parseLinks(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  return text.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>')
}

export function extractUrls(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  return text.match(urlRegex) || []
}