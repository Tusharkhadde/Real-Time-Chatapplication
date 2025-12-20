// client/src/components/Shared/Avatar.jsx
import { Avatar as AvatarRoot, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { getInitials, generateColor } from '@/utils/helpers'

export default function Avatar({ 
  src, 
  name, 
  size = 'default',
  showStatus = false,
  status = 'offline',
  className 
}) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    default: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  }

  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    away: 'bg-yellow-500',
    busy: 'bg-red-500'
  }

  return (
    <div className="relative">
      <AvatarRoot className={cn(sizeClasses[size], className)}>
        <AvatarImage src={src} alt={name} />
        <AvatarFallback 
          style={{ backgroundColor: generateColor(name) }}
          className="text-white font-medium"
        >
          {getInitials(name)}
        </AvatarFallback>
      </AvatarRoot>
      {showStatus && (
        <span 
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-2 border-background",
            size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3',
            statusColors[status]
          )}
        />
      )}
    </div>
  )
}