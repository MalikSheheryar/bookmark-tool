'use client'

import type React from 'react'

import { useState, useEffect, useRef } from 'react'

interface CategoryModalProps {
  show: boolean
  onClose: () => void
  onSave: (name: string, editingCategory: string | null) => boolean
  selectedEmoji: string | null
  onEmojiSelect: (emoji: string | null) => void
  editingCategory: string | null
}

// Complete emoji list with all your Unicode emojis converted
const EMOJI_LIST = [
  // Original emojis (keeping your existing ones)
  '📁',
  '📂',
  '🗂️',
  '📋',
  '📌',
  '🔖',
  '🏷️',
  '📝',
  '📄',
  '📃',
  '💼',
  '🎯',
  '🔍',
  '⭐',
  '❤️',
  '💡',
  '🚀',
  '🎨',
  '🎵',
  '🎮',
  '🏠',
  '🏢',
  '🏪',
  '🏫',
  '🏥',
  '🏦',
  '🏨',
  '🏭',
  '🏗️',
  '🏛️',
  '🌟',
  '🌈',
  '🌸',
  '🌺',
  '🌻',
  '🌷',
  '🌹',
  '🌿',
  '🍀',
  '🌱',
  '🔥',
  '💎',
  '🎪',
  '🎭',
  '🎲',
  '🎳',
  '🎸',
  '🎺',
  '⚡',
  '🌙',
  '☀️',
  '💫',
  '✨',
  '🔮',
  '💝',
  '🎁',
  '👽',
  '📸',
  '🎥',
  '😈',
  '👀',
  '🔫',
  '👻',

  // Country Flags

  // Face Emojis
  '😀',
  '😂',
  '🤣',
  '😊',
  '😍',
  '😘',
  '😋',
  '😎',
  '🤩',
  '🥳',
  '😜',
  '🤪',
  '😏',
  '😒',
  '😔',
  '😢',
  '😭',
  '😡',
  '🤬',
  '😱',
  '😴',
  '🤔',
  '🤨',
  '😐',
  '🤐',
  '🤯',
  '🤑',
  '🤤',
  '🤢',
  '🤮',
  '🤧',
  '🥶',
  '🥵',
  '🤗',
  '🤭',
  '🫣',
  '🤫',
  '🫡',
  '🤯',
  '😵',
  '😵‍💫',
  '🤡',
  '😇',
  '😈',
  '👿',
  '👻',
  '💩',
  '💀',
  '☠️',
  '🙃',
  '😚',
  '😙',
  '😶',
  '😑',
  '😕',
  '😖',
  '😞',
  '😣',
  '😥',
  '😦',
  '😧',
  '😨',
  '😩',
  '😫',
  '😬',
  '😮',
  '😯',
  '😰',
  '🥲',
  '🥸',

  // Hand Gestures
  '👋',
  '🤚',
  '✋',
  '🖐️',
  '🖖',
  '🤟',
  '👌',
  '👍',
  '👎',
  '👏',
  '🙌',
  '👐',
  '🤲',
  '🤝',
  '🙏',
  '✌️',
  '🫶',
  '💪',
  '👊',
  '✊',
  '🤞',
  '🤟',
  '🤘',
  '👈',
  '👉',
  '👆',
  '👇',
  '☝️',
  '🫵',
  '🖕',

  // People & Professions
  '🧑',
  '👩',
  '👨',
  '🧒',
  '👶',
  '👵',
  '👴',
  '🧑‍🦲',
  '🧑‍🦱',
  '🧑‍🦳',
  '🧑‍🦰',
  '🧑‍⚕️',
  '👩‍⚕️',
  '👨‍⚕️',
  '🧑‍🎄',
  '🎅',
  '🤶',

  // Animals
  '🐶',
  '🐱',
  '🐭',
  '🐹',
  '🐰',
  '🦊',
  '🐻',
  '🐼',
  '🐨',
  '🐯',
  '🦁',
  '🐮',
  '🐷',
  '🐸',
  '🐵',
  '🙈',
  '🙉',
  '🙊',
  '🦉',
  '🦄',
  '🐝',
  '🦋',
  '🐞',
  '🐢',
  '🐬',
  '🐳',
  '🐉',
  '🦇',
  '🕷️',
  '🕸️',
  '🦂',
  '🐍',
  '🪲',
  '🪳',
  '🪰',
  '🪱',
  '🪴',
  '🪵',
  '🪶',
  '🫐',
  '🫑',
  '🫒',
  '🫓',
  '🫔',
  '🧬',
  '🦠',
  '🐻‍❄️',
  '🐈‍⬛',

  // Nature
  '🌳',
  '🌲',
  '🌵',
  '🌻',
  '🌸',
  '🌹',
  '☀️',
  '🌙',
  '⭐',
  '🍏',
  '🍎',
  '🍊',
  '🍌',
  '🍉',
  '🍇',
  '🍓',
  '🥑',
  '🥦',
  '🌽',

  // Food & Drinks
  '🍔',
  '🍕',
  '🍣',
  '🍛',
  '🍙',
  '🍰',
  '🧀',
  '🍫',
  '🍹',
  '🍸',
  '🍷',
  '🍺',
  '🍻',
  '🥂',
  '🥃',
  '🍾',
  '🥤',
  '🧃',
  '☕',
  '🍵',
  '🫖',
  '🍼',
  '🧉',
  '🍟',
  '🌮',
  '🍜',

  // Buildings & Places
  '🏠',
  '🏩',
  '💊',
  '💉',
  '🩸',
  '🩹',
  '🩼',
  '🩺',
  '🩻',
  '🧬',
  '🧪',
  '🧫',
  '☢️',
  '🚑',
  '🧴',
  '🧼',
  '🧽',
  '😷',
  '🦠',
  '🧠',
  '❤️',
  '🫀',
  '🫁',
  '🦷',
  '🦴',
  '👁️',
  '🧑‍🦽',
  '🧑‍🦼',
  '🛌',
  '🧘',
  '🦯',
  '🦼',
  '🦽',

  // Fantasy & Mythical
  '🧛',
  '🧛‍♂️',
  '🧛‍♀️',
  '🧟',
  '🧟‍♂️',
  '🧟‍♀️',
  '🧞',
  '🧞‍♂️',
  '🧞‍♀️',
  '🧜',
  '🧜‍♂️',
  '🧜‍♀️',
  '🧝',
  '🧝‍♂️',
  '🧝‍♀️',
  '🧙',
  '🧙‍♂️',
  '🧙‍♀️',

  // Objects & Symbols
  '🪦',
  '⚰️',
  '⚱️',
  '🔮',
  '🪄',
  '🕯️',
  '🗿',
  '👁️',
  '👽',
  '👾',
  '🛸',
  '🚀',
  '🛰️',
  '🌌',
  '🌠',
  '☄️',
  '🪐',
  '🌑',
  '🌕',
  '🌍',
  '🌎',
  '🌏',
  '🌞',

  // Zodiac
  '♈',
  '♉',
  '♊',

  '♋',
  '♌',
  '♍',
  '♎',
  '♏',
  '♐',
  '♑',
  '♒',
  '♓',
  '⛎',

  // Sports & Games
  '⚽',
  '🏀',
  '🎮',
  '🎸',
  '🎺',
  '🎷',
  '🥁',
  '🎻',
  '🎧',
  '🎤',
  '🎶',
  '🎨',
  '🎯',
  '🎲',
  '🎪',
  '🎟️',
  '🎉',
  '🎊',
  '🕹️',

  // Weapons & Tools
  '💎',
  '👀',
  '🗡️',
  '🔫',
  '⚔️',
  '🔪',
  '🏹',
  '🛡️',
  '🧨',
  '🧸',
  '🎆',
  '🔨',
  '⚒️',
  '🛠️',
  '🪚',
  '🪝',
  '🧲',
  '🪜',
  '🧵',
  '🧶',
  '🧹',
  '🧺',
  '🪣',
  '🪠',
  '🪡',
  '🪢',
  '🪤',

  // Office & Documents
  '🖼️',
  '📑',
  '📋',
  '📎',
  '📍',
  '🗂️',
  '🗒️',
  '🖊️',
  '📊',
  '📈',
  '📉',
  '📁',
  '📂',
  '📄',
  '📌',
  '💼',
  '🔍',
  '💡',
  '🗓️',

  // Transportation
  '✈️',
  '🚗',
  '🚕',
  '🚌',
  '🚆',
  '⛵',
  '🚢',
  '🏔️',
  '🏕️',

  // Buildings
  '🏠',
  '🏘️',
  '🏫',
  '🏭',
  '🏛️',
  '🏗️',
  '🏢',
  '🏦',
  '🏨',
  '⛪',
  '🛕',
  '🛜',
  '🛝',
  '🛞',
  '🛟',
  '🛠️',

  // Hearts & Love
  '🧡',
  '💛',
  '💚',
  '💙',
  '💜',
  '🖤',
  '🤍',
  '🤎',
  '💔',
  '❣️',
  '💕',
  '💞',
  '💓',
  '💗',
  '💖',
  '💘',
  '💝',
  '💟',

  // Clothes

  '👕',
  '👔',
  '👖',

  // Shoes

  '👞',
  '👠',
  '👡',
  '👢',
  '🥿',
  '🩰',

  // Symbols & Signs
  '💯',
  '✅',
  '✔️',
  '❌',
  '❎',
  '➕',
  '➖',
  '➗',
  '™️',
  '©️',
  '®️',
  '✨',
  '🌟',
  '🔥',
  '💥',
  '🔔',
  '🔕',
  '⚠️',
  '♻️',
  '🔱',
  '☢️',
  '♨️',
  '🛐',
  '🔰',
  '🆕',
  '🆗',
  '🆙',
  '🆒',
  '🆓',
  '🆖',
  '🆚',
  '🅰️',
  '🅱️',
  '🆎',
  '🅾️',
  '🔟',
  '🔢',
  '🔤',
  '🔡',
  '🔠',
  '🔶',
  '🔷',
  '🇬🇧',
  '🇫🇷',
  '🇩🇪',
  '🇮🇹',
  '🇪🇸',
  '🇷🇺',
  '🇵🇱',
  '🇹🇷',
  '🇺🇦',
  '🇳🇱',
  '🇺🇸',
  '🇨🇦',
  '🇧🇷',
  '🇦🇷',
  '🇨🇱',
  '🇲🇽',
  '🇨🇴',
  '🇵🇪',
  '🇨🇺',
  '🇻🇪',
  '🇪🇬',
  '🇿🇦',
  '🇳🇬',
  '🇰🇪',
  '🇪🇹',
  '🇲🇦',
  '🇹🇿',
  '🇬🇭',
  '🇺🇬',
  '🇸🇳',
  '🇨🇳',
  '🇮🇳',
  '🇯🇵',
  '🇰🇷',
  '🇵🇰',
  '🇮🇩',
  '🇧🇩',
  '🇸🇦',
  '🇮🇷',
  '🇮🇱',
  '🇦🇺',
  '🇳🇿',
  '🇫🇯',
  '🇵🇬',
  '🇸🇧',
  '🇼🇸',
  '🇹🇴',
  '🇻🇺',
  '🇲🇭',
  '🇰🇮',
  '🇵🇸',
  '🇦🇪',
  '🇸🇩',
  '🇾🇪',
  '🇦🇩',
  '🇦🇫',
  '🇦🇬',
  '🇦🇮',
  '🇦🇱',
  '🇦🇲',
  '🇦🇴',
  '🇦🇶',
  '🇦🇸',
  '🇦🇹',
  '🇦🇼',
  '🇦🇽',
  '🇦🇿',
  '🇧🇦',
  '🇧🇧',
  '🇧🇪',
  '🇧🇫',
  '🇧🇬',
  '🇧🇭',
  '🇧🇮',
  '🇧🇯',
  '🇧🇱',
  '🇧🇲',
  '🇧🇳',
  '🇧🇴',
  '🇧🇶',
  '🇧🇸',
  '🇧🇹',
  '🇧🇻',
  '🇧🇼',
  '🇧🇾',
  '🇧🇿',
  '🇨🇨',
  '🇨🇩',
  '🇨🇫',
  '🇨🇬',
  '🇨🇭',
  '🇨🇮',
  '🇨🇰',
  '🇨🇲',
  '🇨🇷',
  '🇨🇻',
  '🇨🇼',
  '🇨🇽',
  '🇨🇾',
  '🇨🇿',
  '🇩🇯',
  '🇩🇰',
  '🇩🇲',
  '🇩🇴',
  '🇩🇿',
  '🇪🇨',
  '🇪🇪',
  '🇪🇭',
  '🇪🇷',
  '🇫🇮',
  '🇫🇰',
  '🇫🇲',
  '🇫🇴',
  '🇬🇦',
  '🇬🇩',
  '🇬🇪',
  '🇬🇫',
  '🇬🇬',
  '🇬🇮',
  '🇬🇱',
  '🇬🇲',
  '🇬🇳',
  '🇬🇵',
  '🇬🇶',
  '🇬🇷',
  '🇬🇸',
  '🇬🇹',
  '🇬🇺',
  '🇬🇼',
  '🇬🇾',
  '🇭🇰',
  '🇭🇲',
  '🇭🇳',
  '🇭🇷',
  '🇭🇹',
  '🇭🇺',
  '🇮🇪',
  '🇮🇲',
  '🇮🇴',
  '🇮🇶',
  '🇮🇸',
  '🇯🇪',
  '🇯🇲',
  '🇯🇴',
  '🇰🇬',
  '🇰🇭',
  '🇰🇲',
  '🇰🇳',
  '🇰🇵',
  '🇰🇼',
  '🇰🇾',
  '🇰🇿',
  '🇱🇦',
  '🇱🇧',
  '🇱🇨',
  '🇱🇮',
  '🇱🇰',
  '🇱🇷',
  '🇱🇸',
  '🇱🇹',
  '🇱🇺',
  '🇱🇻',
  '🇱🇾',
  '🇲🇨',
  '🇲🇩',
  '🇲🇪',
  '🇲🇫',
  '🇲🇬',
  '🇲🇰',
  '🇲🇱',
  '🇲🇲',
  '🇲🇳',
  '🇲🇴',
  '🇲🇵',
  '🇲🇶',
  '🇲🇷',
  '🇲🇸',
  '🇲🇹',
  '🇲🇺',
  '🇲🇻',
  '🇲🇼',
  '🇲🇾',
  '🇲🇿',
  '🇳🇦',
  '🇳🇨',
  '🇳🇪',
  '🇳🇫',
  '🇳🇮',
  '🇳🇴',
  '🇳🇵',
  '🇳🇷',
  '🇳🇺',
  '🇴🇲',
  '🇵🇦',
  '🇵🇫',
  '🇵🇭',
  '🇵🇲',
  '🇵🇳',
  '🇵🇷',
  '🇵🇹',
  '🇵🇼',
  '🇵🇾',
  '🇶🇦',
  '🇷🇪',
  '🇷🇴',
  '🇷🇸',
  '🇷🇼',
  '🇸🇨',
  '🇸🇪',
  '🇸🇬',
  '🇸🇭',
  '🇸🇮',
  '🇸🇯',
  '🇸🇰',
  '🇸🇱',
  '🇸🇲',
  '🇸🇴',
  '🇸🇷',
  '🇸🇸',
  '🇸🇹',
  '🇸🇻',
  '🇸🇽',
  '🇸🇾',
  '🇸🇿',
  '🇹🇨',
  '🇹🇩',
  '🇹🇫',
  '🇹🇬',
  '🇹🇭',
  '🇹🇯',
  '🇹🇰',
  '🇹🇱',
  '🇹🇲',
  '🇹🇳',
  '🇹🇻',
  '🇹🇼',
  '🇺🇲',
  '🇺🇾',
  '🇺🇿',
  '🇻🇦',
  '🇻🇨',
  '🇻🇬',
  '🇻🇮',
  '🇻🇳',
  '🇼🇫',
  '🇾🇹',
  '🇿🇲',
  '🇿🇼',

  // General Addition

  '🎬',
  '📺',
  '📚',
  '📰',
  '🛒',
  '👗',
  '👟',
  '💻',
  '📱',
  '🏨',
  '🏖️',
  '🏋️',
  '🧘',
  '💰',
  '🌱',
  '🐾',
  '🎁',
  '👩‍🍳',
  '✍️',
  '🎓',
  '👩‍💻',
  '🎤',
  '📡',
  '💬',
  '🧳',
  '🧩',
  '🔭',
  '⚛️',
  '🖥️',
  '👩‍🎨',
  '🎭',
  '🏆',
  '🎾',
  '🏏',
  '🏒',
  '🏎️',
  '🚴',
  '🏊',
  '🥊',
  '🃏',
  '🎲',
  '♟️',
  '💡',
  '🌟',
  '🙏',
  '🕍',
  '⛩️',
  '🏳️‍🌈',
  '🪙',
  '💽',
  '🎙️',
  '🚢',
  '🚂',
  '🚁',
  '🗺️',
  '🌐',
  '🔒',
  '🛎️',
  '🧿',
  '🏖️',
  '🏔️',
  '🌋',
  '🌲',
  '🐦',
  '🐟',
  '🏹',
  '🔥',
  '🧭',
  '🌌',
  '🌦️',
  '🐉',
  '🧛',
  '🤖',
  '💾',
  '🎹',
  '📼',
  '📰',
  '📡',
  '📺',
  '🎟️',
  '🎇',
  '🎶',
  '🕍',
  '🧱',
  '📖',
  '🪕',
  '🥁',
  '🎧',
  '📊',
  '🖥️',
  '🧮',
  '🗳️',
  '⚖️',
  '🏚️',
  '🛋️',
  '🚿',
  '🛏️',
  '✨',
  '🎬',
  '🍿',
  '🪂',
  '🧗',
  '🛹',
  '🚐',
  '⛷️',
  '🏄',
  '🚣',
  '🧟',
  '🕵️',
  '💌',
  '💍',
  '🍼',
  '🎒',
  '👩‍🏫',
  '🎓',
  '👩‍🔬',
  '🔬',
  '🌡️',
  '🌳',
  '🐻',
  '🦜',
  '🐕',
  '🐈',
  '🐠',
  '🐝',
  '🍩',
  '🧀',
  '🥗',
  '🥩',
  '🥟',
  '🥙',
  '🍣',
  '🍛',
  '🌯',
  '🥬',
  '🥔',
  '📧',
  '☎️',
  '📱',
  '🖥️',
  '🖱️',
  '⌨️',
  '🕰️',
  '⏰',
  '🧭',
  '🗺️',
  '🛣️',
  '🚦',
  '🚏',
  '✈️',
  '🛳️',
  '⛵',
  '🚤',
  '🛰️',
  '📡',
  '🔋',
  '💡',
  '🏗️',
  '🧱',
  '🪵',
  '💎',
  '🧿',
  '☯️',
  '🕉️',
  '✝️',
  '☪️',
  '✡️',
  '🕍',
  '🪔',
  '🎃',
  '🎄',
  '🕊️',
  '⚓',
  '🧭',
  '🤠',
  '🤖',
  '🕯️',
  '⚰️',
  '🧟',
  '🧜‍♀️',
  '🏥',
  '🏨',
  '🪸',
  '🪹',
  '⚕️',
  '⚖️',
  '👩‍⚕️',
  '👩‍⚕️',
  '👨‍⚕️',
  '🥿',
  '🧼',
  '🧻',
  '🧍',
  '🧎',
  '🛌',
  '🧘',
]

// Utility function to convert emoji to Twemoji image URL
const getEmojiImageUrl = (emoji: string) => {
  const codePoint = [...emoji]
    .map((char) => {
      const code = char.codePointAt(0)
      return code ? code.toString(16) : ''
    })
    .join('-')

  return `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/${codePoint}.svg`
}

// Custom Twemoji component
const TwemojiEmoji: React.FC<{
  emoji: string
  className?: string
  size?: number
}> = ({ emoji, className = '', size = 20 }) => {
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
    // Fallback to native emoji if Twemoji fails to load
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

export function CategoryModal({
  show,
  onClose,
  onSave,
  selectedEmoji,
  onEmojiSelect,
  editingCategory,
}: CategoryModalProps) {
  const [categoryName, setCategoryName] = useState('')
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (show) {
      setCategoryName(editingCategory || '')
      // The selectedEmoji is already set by startEditingCategory in the hook
    }
  }, [show, editingCategory])

  useEffect(() => {
    // Initialize Twemoji when component mounts and modal is shown
    if (show && modalRef.current) {
      // This will help with any remaining native emojis that weren't replaced
      const script = document.createElement('script')
      script.src =
        'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/twemoji.min.js'
      script.onload = () => {
        if ((window as any).twemoji && modalRef.current) {
          ;(window as any).twemoji.parse(modalRef.current, {
            folder: 'svg',
            ext: '.svg',
          })
        }
      }
      document.head.appendChild(script)

      return () => {
        document.head.removeChild(script)
      }
    }
  }, [show])

  const handleSave = () => {
    if (onSave(categoryName.trim(), editingCategory)) {
      setCategoryName('')
      onEmojiSelect(null)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    }
  }

  if (!show) return null

  return (
    <>
      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
        }

        .modal-overlay.show {
          opacity: 1;
          visibility: visible;
        }

        .modal-content {
          background: #f1f1e3;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
          width: 90%;
          max-width: 520px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          transform: scale(0.9);
          transition: transform 0.3s ease;
          border: 1px solid #975226;
        }

        .modal-overlay.show .modal-content {
          transform: scale(1);
        }

        .modal-header {
          padding: 24px 24px 16px 24px;
          border-bottom: 2px solid #975226;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #975226;
          color: #f1f1e3;
          border-radius: 16px 16px 0 0;
        }

        .modal-title {
          font-size: 20px;
          font-weight: 700;
          margin: 0;
          display: flex;
          align-items: center;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        .modal-title i {
          margin-right: 12px;
          font-size: 18px;
          color: #f1f1e3;
        }

        .modal-close {
          background: rgba(241, 241, 227, 0.2);
          border: none;
          border-radius: 8px;
          color: #f1f1e3;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          backdrop-filter: blur(10px);
        }

        .modal-close:hover {
          background: rgba(241, 241, 227, 0.3);
          transform: scale(1.05);
        }

        .modal-body {
          padding: 24px;
          overflow-y: auto;
          flex: 1;
          background: #f1f1e3;
        }

        .enhanced-input-group {
          position: relative;
          margin-bottom: 24px;
        }

        .input-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #975226;
          font-size: 18px;
          z-index: 2;
        }

        .enhanced-input {
          width: 100%;
          padding: 16px 16px 16px 52px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 500;
          background: #f1f1e3;
          color: #334155;
          transition: all 0.3s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
        }

        .enhanced-input:focus {
          outline: none;
          border-color: #975226;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(151, 82, 38, 0.1),
            0 4px 12px rgba(0, 0, 0, 0.05);
          transform: translateY(-1px);
        }

        .enhanced-input::placeholder {
          color: #975226;
          opacity: 0.7;
          font-weight: 400;
        }

        .emoji-picker-section {
          background: rgba(151, 82, 38, 0.05);
          border-radius: 12px;
          padding: 20px;
          border: 1px solid #975226;
        }

        .emoji-picker-header {
          margin-bottom: 16px;
        }

        .emoji-picker-title {
          font-size: 16px;
          font-weight: 600;
          color: #333;
          margin: 0;
          display: flex;
          align-items: center;
        }

        .emoji-picker-title i {
          color: #975226;
          margin-right: 8px;
        }

        .emoji-section-title {
          font-size: 14px;
          font-weight: 600;
          color: #975226;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .emoji-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(44px, 1fr));
          gap: 8px;
          max-height: 240px;
          overflow-y: auto;
          padding: 2px;
        }

        /* Custom scrollbar for emoji grid */
        .emoji-grid::-webkit-scrollbar {
          width: 8px;
        }

        .emoji-grid::-webkit-scrollbar-track {
          background: rgba(151, 82, 38, 0.1);
          border-radius: 4px;
        }

        .emoji-grid::-webkit-scrollbar-thumb {
          background: #975226;
          border-radius: 4px;
          transition: background 0.2s ease;
        }

        .emoji-grid::-webkit-scrollbar-thumb:hover {
          background: #f1f1e3;
        }

        .emoji-btn {
          width: 44px;
          height: 44px;
          border: 2px solid transparent;
          background: #f1f1e3;
          border-radius: 10px;
          cursor: pointer;
          font-size: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(151, 82, 38, 0.1);
        }

        .emoji-btn:hover {
          background: rgba(151, 82, 38, 0.1);
          border-color: #975226;
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(151, 82, 38, 0.2);
        }

        .emoji-btn.selected {
          background: #975226;
          border-color: #f1f1e3;
          transform: scale(1.1);
          box-shadow: 0 4px 16px rgba(151, 82, 38, 0.4);
        }

        .emoji-btn.selected:hover {
          transform: scale(1.1);
        }

        .modal-footer {
          padding: 20px 24px 24px 24px;
          border-top: 1px solid #975226;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          background: rgba(151, 82, 38, 0.03);
          border-radius: 0 0 16px 16px;
        }

        .btn {
          padding: 12px 24px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 120px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .btn i {
          margin-right: 8px;
        }

        .btn-secondary {
          background: rgba(151, 82, 38, 0.1);
          color: #333;
          border: 2px solid #975226;
        }

        .btn-secondary:hover {
          background: rgba(151, 82, 38, 0.2);
          border-color: #975226;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(151, 82, 38, 0.2);
        }

        .btn-primary {
          background: #975226;
          color: #f1f1e3;
          border: 2px solid #975226;
          box-shadow: 0 4px 12px rgba(151, 82, 38, 0.3);
        }

        .btn-primary:hover {
          background: #f1f1e3;
          color: #975226;
          border-color: #975226;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(151, 82, 38, 0.4);
        }

        /* Twemoji specific styles */
        .twemoji-emoji {
          display: inline-block !important;
          vertical-align: middle !important;
        }

        .emoji-btn .twemoji-emoji {
          width: 20px !important;
          height: 20px !important;
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .modal-content {
            background: #f1f1e3;
            border-color: #975226;
            color: #333;
          }

          .modal-body {
            background: #f1f1e3;
          }

          .emoji-picker-section {
            background: rgba(151, 82, 38, 0.15);
            border-color: #975226;
          }

          .enhanced-input {
            background: #f1f1e3;
            border-color: #975226;
            color: #333;
          }

          .enhanced-input:focus {
            background: #f1f1e3;
            border-color: #975226;
          }

          .emoji-btn {
            background: #f1f1e3;
            color: #333;
          }

          .emoji-btn:hover {
            background: rgba(151, 82, 38, 0.1);
          }

          .modal-footer {
            background: rgba(151, 82, 38, 0.1);
            border-color: #975226;
          }
        }

        /* Responsive design */
        @media (max-width: 640px) {
          .modal-content {
            width: 95%;
            margin: 20px;
          }

          .modal-header,
          .modal-body,
          .modal-footer {
            padding: 16px;
          }

          .emoji-grid {
            grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
            gap: 6px;
          }

          .emoji-btn {
            width: 40px;
            height: 40px;
            font-size: 18px;
          }

          .emoji-btn .twemoji-emoji {
            width: 18px !important;
            height: 18px !important;
          }
        }
      `}</style>

      <div
        ref={modalRef}
        className={`modal-overlay ${show ? 'show' : ''}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <div className="modal-content">
          <div className="modal-header">
            <h3 className="modal-title">
              <i
                className={`fa-solid ${
                  editingCategory ? 'fa-edit' : 'fa-folder-plus'
                }`}
              ></i>
              {editingCategory ? 'Edit Category' : 'Create New Category'}
            </h3>
            <button className="modal-close" onClick={onClose}>
              <i className="fa-solid fa-times"></i>
            </button>
          </div>

          <div className="modal-body">
            <div className="enhanced-input-group">
              <i className="input-icon fa-solid fa-folder"></i>
              <input
                type="text"
                className="enhanced-input"
                placeholder="Category Name (e.g., Work, Shopping, Entertainment)"
                aria-label="Category Name"
                maxLength={30}
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
              />
            </div>

            {/* Emoji Picker Section */}
            <div className="emoji-picker-section">
              <div className="emoji-picker-header">
                <h5 className="emoji-picker-title">
                  <i className="fa-solid fa-smile"></i>
                  Choose an Icon (Optional)
                </h5>
              </div>

              <div>
                <div className="emoji-section-title">Available Icons</div>
                <div className="emoji-grid">
                  {EMOJI_LIST.map((emoji, index) => (
                    <button
                      key={index}
                      type="button"
                      className={`emoji-btn ${
                        selectedEmoji === emoji ? 'selected' : ''
                      }`}
                      onClick={() =>
                        onEmojiSelect(selectedEmoji === emoji ? null : emoji)
                      }
                    >
                      <TwemojiEmoji
                        emoji={emoji}
                        className="twemoji-emoji"
                        size={20}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>
              <i className="fa-solid fa-times"></i>Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSave}>
              <i
                className={`fa-solid ${
                  editingCategory ? 'fa-save' : 'fa-plus'
                }`}
              ></i>
              {editingCategory ? 'Save Changes' : 'Create Category'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
