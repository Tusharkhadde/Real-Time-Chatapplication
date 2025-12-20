// client/src/components/Chat/AnimatedSendButton.jsx
import { motion } from 'framer-motion'
import { Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function AnimatedSendButton({ onClick, disabled, isLoading }) {
  return (
    <motion.div
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
    >
      <Button
        size="icon"
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "shrink-0 transition-all duration-200",
          !disabled && "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
        )}
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <motion.div
            initial={false}
            animate={{ rotate: disabled ? 0 : 0 }}
            transition={{ type: 'spring', stiffness: 500 }}
          >
            <Send className="h-5 w-5" />
          </motion.div>
        )}
      </Button>
    </motion.div>
  )
}