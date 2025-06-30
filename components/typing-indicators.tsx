"use client"

import type { TypingIndicator } from "@/lib/supabase"

interface TypingIndicatorsProps {
  typingUsers: TypingIndicator[]
  currentUsername: string
}

export function TypingIndicators({ typingUsers, currentUsername }: TypingIndicatorsProps) {
  const activeTypers = typingUsers.filter((user) => user.is_typing && user.username !== currentUsername)

  if (activeTypers.length === 0) return null

  const getTypingText = () => {
    if (activeTypers.length === 1) {
      return `${activeTypers[0].username} is typing...`
    } else if (activeTypers.length === 2) {
      return `${activeTypers[0].username} and ${activeTypers[1].username} are typing...`
    } else {
      return `${activeTypers.length} people are typing...`
    }
  }

  return (
    <div className="typing-indicator">
      {getTypingText()}
      <span className="blink" style={{ marginLeft: "4px" }}>
        ●●●
      </span>
    </div>
  )
}
