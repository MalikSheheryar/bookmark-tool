// File: components/reaction-display.tsx (UPDATED - Cleaner UI)
'use client'

import { useState } from 'react'
import type { Reaction } from '@/lib/reactions-service'

interface ReactionDisplayProps {
  reactions: Reaction[]
  onReactionClick?: (emoji: string) => void
  showUsernames?: boolean
  maxDisplay?: number
  className?: string
}

export function ReactionDisplay({
  reactions,
  onReactionClick,
  showUsernames = true,
  maxDisplay = 5,
  className = '',
}: ReactionDisplayProps) {
  const [hoveredEmoji, setHoveredEmoji] = useState<string | null>(null)

  if (!reactions || reactions.length === 0) {
    return null
  }

  // Sort by count (descending) and take top N
  const displayReactions = reactions
    .sort((a, b) => b.count - a.count)
    .slice(0, maxDisplay)

  const remainingCount = reactions.length - maxDisplay

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      {displayReactions.map((reaction) => {
        const isUserReaction = reaction.hasReacted

        return (
          <div key={reaction.emoji} className="relative">
            <button
              onClick={() => onReactionClick?.(reaction.emoji)}
              onMouseEnter={() => setHoveredEmoji(reaction.emoji)}
              onMouseLeave={() => setHoveredEmoji(null)}
              className="group flex items-center gap-2 px-3 py-2 rounded-full border-2 transition-all hover:scale-110 active:scale-95"
              style={{
                borderColor: isUserReaction ? '#5f462d' : '#e5e7eb',
                background: isUserReaction ? 'rgba(95, 70, 45, 0.15)' : 'white',
                boxShadow: isUserReaction
                  ? '0 2px 8px rgba(95, 70, 45, 0.15)'
                  : 'none',
              }}
            >
              <span
                className="text-lg transition-transform"
                style={{
                  transform: isUserReaction ? 'scale(1.15)' : 'scale(1)',
                }}
              >
                {reaction.emoji}
              </span>

              <span
                className="text-sm font-bold"
                style={{
                  color: isUserReaction ? '#5f462d' : '#6b7280',
                }}
              >
                {reaction.count}
              </span>
            </button>
          </div>
        )
      })}

      {/* Show "+N more" if there are more reactions */}
      {remainingCount > 0 && (
        <div
          className="px-3 py-2 rounded-full text-xs font-semibold"
          style={{ background: '#f3f4f6', color: '#6b7280' }}
        >
          +{remainingCount} more
        </div>
      )}
    </div>
  )
}
