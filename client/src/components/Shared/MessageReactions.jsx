// client/src/components/Shared/MessageReactions.jsx
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export default function MessageReactions({ reactions, onReactionClick }) {
  if (!reactions?.length) return null

  // Group reactions by emoji
  const grouped = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = []
    }
    acc[reaction.emoji].push(reaction.user)
    return acc
  }, {})

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-wrap gap-1 mt-1"
    >
      {Object.entries(grouped).map(([emoji, users]) => (
        <button
          key={emoji}
          onClick={() => onReactionClick?.(emoji)}
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs",
            "bg-muted hover:bg-muted/80 transition-colors"
          )}
        >
          <span>{emoji}</span>
          <span className="text-muted-foreground">{users.length}</span>
        </button>
      ))}
    </motion.div>
  )
}