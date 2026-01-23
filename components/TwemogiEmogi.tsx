import { useState, useEffect } from 'react'

// Custom emoji mappings for problematic emojis
const CUSTOM_EMOJI_MAP: Record<string, string> = {
  '🏴󠁧󠁢󠁥󠁮󠁧󠁿': 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f3f4-e0067-e0062-e0065-e006e-e0067-e007f.svg', // England flag
  '🏴󠁧󠁢󠁳󠁣󠁴󠁿': 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f3f4-e0067-e0062-e0073-e0063-e0074-e007f.svg', // Scotland flag
  '🏴󠁧󠁢󠁷󠁬󠁳󠁿': 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f3f4-e0067-e0062-e0077-e006c-e0073-e007f.svg', // Wales flag
}

// Utility function to convert emoji to Twemoji image URL
const getEmojiImageUrl = (emoji: string): string => {
  // Check if it's a custom emoji first
  if (CUSTOM_EMOJI_MAP[emoji]) {
    return CUSTOM_EMOJI_MAP[emoji]
  }

  // For standard emojis, generate codepoint
  const codePoint = [...emoji]
    .map((char) => {
      const code = char.codePointAt(0)
      return code ? code.toString(16) : ''
    })
    .join('-')

  return `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/${codePoint}.svg`
}

// Enhanced TwemojiEmoji component
export const TwemojiEmoji: React.FC<{
  emoji: string
  className?: string
  size?: number
}> = ({ emoji, className = '', size = 24 }) => {
  const [imgSrc, setImgSrc] = useState<string>('')
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    setImgSrc(getEmojiImageUrl(emoji))
    setImgError(false)
  }, [emoji])

  const handleError = () => {
    setImgError(true)
  }

  if (imgError) {
    // Fallback to native emoji if image fails to load
    return (
      <span className={className} style={{ fontSize: `${size}px` }}>
        {emoji}
      </span>
    )
  }

  return (
    <img
      src={imgSrc}
      alt={emoji}
      className={className}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        display: 'inline-block',
        verticalAlign: 'middle',
      }}
      onError={handleError}
    />
  )
}


