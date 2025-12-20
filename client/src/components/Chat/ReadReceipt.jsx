// client/src/components/Chat/ReadReceipt.jsx
import { Check, CheckCheck, Clock, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ReadReceipt({ status }) {
  const iconClass = "h-3.5 w-3.5"

  switch (status) {
    case 'sending':
      return <Clock className={cn(iconClass, "text-primary-foreground/50")} />
    case 'sent':
      return <Check className={cn(iconClass, "text-primary-foreground/70")} />
    case 'delivered':
      return <CheckCheck className={cn(iconClass, "text-primary-foreground/70")} />
    case 'read':
      return <CheckCheck className={cn(iconClass, "text-blue-400")} />
    case 'failed':
      return <AlertCircle className={cn(iconClass, "text-red-400")} />
    default:
      return <Check className={cn(iconClass, "text-primary-foreground/70")} />
  }
}