'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Globe, Lock, Crown, Sparkles, AlertCircle } from 'lucide-react'
import { useSubscription } from '@/hooks/use-subscription'
import Link from 'next/link'
import { TwemojiEmoji } from '@/components/TwemogiEmogi.tsx'

interface CategoryModalProps {
  show: boolean
  onClose: () => void
  onSave: (
    name: string,
    editingCategory: string | null,
    isPublic: boolean,
  ) => boolean
  selectedEmoji: string | null
  onEmojiSelect: (emoji: string | null) => void
  editingCategory: string | null
  currentIsPublic?: boolean
  currentPrivateCategoryCount: number // NEW: Current count of private categories
}

const FREE_EMOJI_LIST = [
  '😃',
  '😄',
  '😂',
  '🤣',
  '😊',
  '😎',
  '🤩',
  '😍',
  '🥰',
  '😜',
  '🤔',
  '😴',
  '😮',
  '😢',
  '😡',
  '🤯',
  '🥳',
  '❤️',
  '🖤',
  '💯',
  '👍',
  '🙌',
  '👏',
  '🤝',
  '✨',
  '🎬',
  '📺',
  '🎵',
  '🎧',
  '🎤',
  '🎮',
  '🎥',
  '📸',
  '📚',
  '✍️',
  '🎨',
  '📰',
  '📖',
  '🎭',
  '🎼',
  '💻',
  '📱',
  '🖥️',
  '🌐',
  '🔒',
  '🔑',
  '💡',
  '📊',
  '📎',
  '📌',
  '⚙️',
  '🔋',
  '📡',
  '🧠',
  '🤖',
  '🍕',
  '🍔',
  '🍿',
  '🍰',
  '☕',
  '🍺',
  '🍷',
  '🥗',
  '🍓',
  '🍫',
  '✈️',
  '🚗',
  '🚆',
  '🚲',
  '🏨',
  '🏖️',
  '🗺️',
  '🧭',
  '🌍',
  '🌳',
  '🔥',
  '🌊',
  '🌙',
  '☀️',
  '⭐',
  '🌧️',
  '🏕️',
  '🏔️',
  '🌲',
  '💼',
  '🏠',
  '🛒',
  '🎁',
  '🏆',
  '⚽',
  '🏋️',
  '🧘',
  '🎯',
  '🕒',
  '📅',
  '📍',
  '🛠️',
  '🧩',
  '🎉',
  '👀',
  '🐾',
  '🧳',
  '📦',
  '🏳️‍🌈',
  '🔫',
  '🍴',
  '💰',
  '👔',
  '👗',
  '🍳',
  '👻',
  '💩',
  '👽',
  '💦',
  '😈',
  '🇺🇸',
  '🇬🇧',
  '🏴󠁧󠁢󠁥󠁮󠁧󠁿', // England
  '🏴󠁧󠁢󠁳󠁣󠁴󠁿', // Scotland
  '🏴󠁧󠁢󠁷󠁬󠁳󠁿', // Wales
  '🇨🇦',
  '🇦🇺',
  '🇩🇪',
  '🇫🇷',
  '🇮🇹',
  '🇪🇸',
  '🇳🇱',
  '🇮🇪',
  '🇸🇪',
  '🇳🇴',
  '🇩🇰',
  '🇫🇮',
  '🇵🇱',
  '🇨🇭',
  '🇯🇵',
  '🇰🇷',
  '🇨🇳',
  '🇮🇳',
  '🇸🇬',
  '🇦🇪',
  '🇵🇰',
  '🇮🇱',
  '🇵🇸',
  '🇧🇷',
  '🇲🇽',
  '🇦🇷',
  '🇨🇴',
  '🇿🇦',
  '🇳🇬',
  '🇪🇬',
]

const PREMIUM_EMOJI_LIST = [
  // Country Flags
  '🇦🇫',
  '🇦🇽',
  '🇦🇱',
  '🇩🇿',
  '🇦🇸',
  '🇦🇩',
  '🇦🇴',
  '🇦🇮',
  '🇦🇶',
  '🇦🇬',
  '🇦🇷',
  '🇦🇲',
  '🇦🇼',
  '🇦🇺',
  '🇦🇹',
  '🇦🇿',
  '🇧🇸',
  '🇧🇭',
  '🇧🇩',
  '🇧🇧',
  '🇧🇾',
  '🇧🇪',
  '🇧🇿',
  '🇧🇯',
  '🇧🇲',
  '🇧🇹',
  '🇧🇴',
  '🇧🇦',
  '🇧🇼',
  '🇧🇻',
  '🇧🇷',
  '🇮🇴',
  '🇧🇳',
  '🇧🇬',
  '🇧🇫',
  '🇧🇮',
  '🇰🇭',
  '🇨🇲',
  '🇨🇦',
  '🇨🇻',
  '🇧🇶',
  '🇰🇾',
  '🇨🇫',
  '🇹🇩',
  '🇨🇱',
  '🇨🇳',
  '🇨🇽',
  '🇨🇨',
  '🇨🇴',
  '🇰🇲',
  '🇨🇬',
  '🇨🇩',
  '🇨🇰',
  '🇨🇷',
  '🇨🇮',
  '🇭🇷',
  '🇨🇺',
  '🇨🇼',
  '🇨🇾',
  '🇨🇿',
  '🇩🇰',
  '🇩🇯',
  '🇩🇲',
  '🇩🇴',
  '🇪🇨',
  '🇪🇬',
  '🇸🇻',
  '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  '🏴󠁧󠁢󠁳󠁣󠁴󠁿', // Scotland
  '🏴󠁧󠁢󠁷󠁬󠁳󠁿', // Wales
  '🇬🇶',
  '🇪🇷',
  '🇪🇪',
  '🇪🇺',

  '🇸🇿',
  '🇪🇹',
  '🇫🇰',
  '🇫🇴',
  '🇫🇯',
  '🇫🇮',
  '🇫🇷',
  '🇬🇫',
  '🇵🇫',
  '🇹🇫',
  '🇬🇦',
  '🇬🇲',
  '🇬🇪',
  '🇩🇪',
  '🇬🇭',
  '🇬🇮',
  '🇬🇷',
  '🇬🇱',
  '🇬🇩',
  '🇬🇵',
  '🇬🇺',
  '🇬🇹',
  '🇬🇬',
  '🇬🇳',
  '🇬🇼',
  '🇬🇾',
  '🇭🇹',
  '🇭🇲',
  '🇭🇳',
  '🇭🇰',
  '🇭🇺',
  '🇮🇸',
  '🇮🇳',

  '🇮🇩',
  '🇮🇷',
  '🇮🇶',
  '🇮🇪',
  '🇮🇲',
  '🇮🇱',
  '🇮🇹',
  '🇯🇲',
  '🇯🇵',
  '🇯🇪',
  '🇯🇴',
  '🇰🇿',
  '🇰🇪',
  '🇰🇮',
  '🇰🇵',
  '🇰🇷',
  '🇽🇰',
  '🇰🇼',
  '🇰🇬',
  '🇱🇦',
  '🇱🇻',
  '🇱🇧',
  '🇱🇸',
  '🇱🇷',
  '🇱🇾',
  '🇱🇮',
  '🇱🇹',
  '🇱🇺',
  '🇲🇴',
  '🇲🇬',
  '🇲🇼',
  '🇲🇾',
  '🇲🇻',
  '🇲🇱',
  '🇲🇹',
  '🇲🇭',
  '🇲🇶',
  '🇲🇷',
  '🇲🇺',
  '🇾🇹',
  '🇲🇽',
  '🇫🇲',
  '🇲🇩',
  '🇲🇨',
  '🇲🇳',
  '🇲🇪',
  '🇲🇸',
  '🇲🇦',
  '🇲🇿',
  '🇲🇲',
  '🇳🇦',
  '🇳🇷',
  '🇳🇵',
  '🇳🇱',
  '🇳🇨',
  '🇳🇿',
  '🇳🇮',
  '🇳🇪',
  '🇳🇬',
  '🇳🇺',
  '🇳🇫',
  '🇲🇰',
  '🇲🇵',
  '🇳🇴',
  '🇴🇲',
  '🇵🇰',
  '🇵🇼',
  '🇵🇸',
  '🇵🇦',
  '🇵🇬',
  '🇵🇾',
  '🇵🇪',
  '🇵🇭',
  '🇵🇳',
  '🇵🇱',
  '🇵🇹',
  '🇵🇷',
  '🇶🇦',
  '🇷🇪',
  '🇷🇴',
  '🇷🇺',
  '🇷🇼',
  '🇧🇱',
  '🇸🇭',
  '🇰🇳',
  '🇱🇨',
  '🇲🇫',
  '🇵🇲',
  '🇻🇨',
  '🇼🇸',
  '🇸🇲',
  '🇸🇹',
  '🇸🇦',
  '🇸🇳',
  '🇷🇸',
  '🇸🇨',
  '🇸🇱',
  '🇸🇬',
  '🇸🇽',
  '🇸🇰',
  '🇸🇮',
  '🇸🇧',
  '🇸🇴',
  '🇿🇦',
  '🇬🇸',
  '🇸🇸',
  '🇪🇸',
  '🇱🇰',
  '🇸🇩',
  '🇸🇷',
  '🇸🇯',
  '🇸🇪',
  '🇨🇭',
  '🇸🇾',
  '🇹🇼',
  '🇹🇯',
  '🇹🇿',
  '🇹🇭',
  '🇹🇱',
  '🇹🇬',
  '🇹🇰',
  '🇹🇴',
  '🇹🇹',
  '🇹🇳',
  '🇹🇷',
  '🇹🇲',
  '🇹🇨',
  '🇹🇻',
  '🇺🇬',
  '🇺🇦',
  '🇦🇪',
  '🇬🇧',
  '🇺🇸',
  '🇺🇲',
  '🇺🇾',
  '🇺🇿',
  '🇻🇺',
  '🇻🇦',
  '🇻🇪',
  '🇻🇳',
  '🇻🇬',
  '🇻🇮',
  '🇼🇫',
  '🇪🇭',
  '🇾🇪',
  '🇿🇲',
  '🇿🇼',
  '🏳️‍🌈',
  '🏳️‍⚧️',
  '🏴',
  '🏴‍☠️',

  // Smileys & Emotions
  '😁',
  '😂',
  '😃',
  '😄',
  // Faces
  '🫠',
  '🥹',
  '🫢',
  '🫣',
  '🤭',
  '🤨',
  '🤯',
  '😅',
  '😆',
  '😇',
  '😈',
  '😉',
  '😊',
  '😋',
  '😌',
  '😍',
  '😎',
  '😏',
  '😐',
  '😑',
  '😒',
  '😓',
  '😔',
  '🥱',
  '🤠',
  '🥳',
  '🤐',
  '🤕',
  '🤒',
  '🤮',
  '🤑',
  '🤓',
  '🥸',
  '🤧',
  '🥶',
  '🥵',
  '🤔',
  '😕',
  '😖',
  '😗',
  '😘',
  '😙',
  '😚',
  '😛',
  '😜',
  '😝',
  '😞',
  '😟',
  '😠',
  '😡',
  '😢',
  '😣',
  '😤',
  '😥',
  '😦',
  '😧',
  '😨',
  '😩',
  '😪',
  '😫',
  '😬',
  '😭',
  '😮',
  '😯',
  '😰',
  '😱',
  '😲',
  '😳',
  '😴',
  '😵',
  '😶',
  '😷',
  '😸',
  '😹',
  '😺',
  '😻',
  '😼',
  '😽',
  '😾',
  '😿',
  '🙀',
  '🙁',
  '🙂',
  '🙃',
  '🙄',

  // Hearts
  '❤️',
  '🧡',
  '💛',
  '💚',
  '💙',
  '💜',
  '🤍',
  '🖤',
  '💞',
  '💔',

  '🟦',
  '🟪',
  '⬜',
  '⬛',
  '🟨',

  // Cleaning & Household
  '🧹',
  '🧺',
  '🧼',
  '🧽',
  '🪣',
  '🧴',
  '🪟',
  '🪞',

  '⚒️',
  '✊',
  '☮️',
  '🕊️',
  '🌍',
  '🌏',
  '🪿',

  // People & Body Parts
  '🙅',
  '🙆',
  '🙇',
  '🙈',
  '🙉',
  '🙊',
  '🙋',
  '🙌',
  '🙍',
  '🙎',
  '🙏',
  '👀',
  '👂',
  '👃',
  '👄',
  '👅',
  '🦴',
  '🧠',
  '🫀',
  '🦷',
  '🦵',
  '🦾',
  '🦿',
  '🦶',
  '💪',
  '👆',
  '👇',
  '👈',
  '👉',
  '👊',
  '👋',
  '👌',
  '👍',
  '👎',
  '👏',
  '👐',
  '🖖',
  '✋',
  '✊',
  // Hands & Gestures
  '🫶',
  '🫱',
  '🤝',

  '🤙',
  '🖕',
  '🤌',
  '🤞',
  '🤘',
  '✍',
  '✌',
  '👑',
  '👒',
  '👓',
  '👔',
  '👕',
  '👖',
  '👗',
  '👘',
  '👙',
  '👚',
  '👛',
  '👜',
  '👝',
  '👞',
  '👟',
  '👠',
  '👡',
  '👢',
  '🧢',
  '🧣',
  '🧤',
  '🕶',
  '🧦',
  '🩲',
  '🩱',
  '👦',
  '👧',
  '👨',
  '👩',
  '👪',
  '👫',
  '👰',
  '👳',
  '🧕',
  '👴',
  '👵',
  '👶',
  '👷',
  '👸',
  '👹',
  '👺',
  '👻',
  '👽',
  '👾',
  '👿',
  '💀',
  '🤡',
  '🤖',
  '☠',
  '🧞',
  '🧟',
  '🧜',
  '🧛',
  '🧚',
  '🦹',
  '🦸',
  '🥷',
  '💁',
  '💂',
  '👮',
  '🕵',
  '🧑‍🌾',
  '🧑‍🍳',
  '🧑‍⚕️',
  '👩‍⚕️',
  '💃',
  '💄',
  '💅',
  '💆',
  '💇',
  '💈',
  '👣',
  '💉',
  '💊',
  '🩺',
  '💋',
  '💌',
  '💍',
  '💎',
  // Office
  '📝',
  '📥',
  '📤',
  '🗃️',
  '🗂️',
  '🏷️',
  '🧱',
  '🫧',
  '🧬',
  '🧮',
  '🔬',
  '✨',
  '☀️',
  '🌊',

  // Food & Drink
  '🧃',
  '🧂',
  '🫖',

  // Tools
  '🧰',
  '🛠️',
  '🪜',
  '🪠',
  '🪥',
  '🪒',
  '🔌',
  '🧯',
  '🪫',
  '🔋',

  // Nature
  '🪴',
  '🪨',
  // Symbols & Objects
  '✂',
  '✃',
  '✄',
  '✅',
  '✆',
  '✇',
  '✉',
  '🚀',
  '✈️',
  '🛸',
  '🛶',
  '🚁',
  '🚂',
  '🚃',
  '🚄',
  '🚅',
  '🚆',
  '🚇',
  '🚈',
  '🚉',
  '🚊',
  '🚋',
  '🚌',
  '🚍',
  '🚎',
  '🚏',
  '🚐',
  '🚑',
  '🚒',
  '🚓',
  '🚔',
  '🚕',
  '🚖',
  '🚗',
  '🚘',
  '🚙',
  '🚚',
  '🚛',
  '🚜',
  '🚝',
  '🚞',
  '🚟',
  '🚠',
  '🚡',
  '🚢',
  '🚣',
  '🚤',
  '🚥',
  '🚦',
  '🚧',
  '🚨',
  '🚩',
  '🚪',
  '🚫',
  '🚬',
  '🚭',
  '🚮',
  '🚯',
  '🚰',
  '🚱',
  '🚲',
  '🛼',
  '🛹',
  '🚳',
  '🚴',
  '🏍️',
  '🚵',
  '🚶',
  '🚷',
  '🚸',
  '🚹',
  '🚺',
  '🚻',
  '🚼',
  '🚽',
  '🚾',
  '🚿',
  '🛀',
  '🌎',
  '🌐',
  '🌑',
  '🌒',
  '🌓',
  '🌔',
  '🌕',
  '🌖',
  '🌗',
  '🌘',
  '🌙',
  '🌚',
  '🌛',
  '🌜',
  '🌝',
  '🌞',
  '🌟',
  '🌠',
  '🌡',
  '🌤',
  '🌥',
  '🌦',
  '🌧',
  '🌨',
  '🌩',
  '🌪',
  '🌫',
  '🌬',
  '🌭',
  '🌮',
  '🌯',
  '🌰',
  '🌱',
  '🌲',
  '🌳',
  '🌴',
  '🌵',
  '🌶',
  '🌷',
  '🌸',
  '🌹',
  '🌻',
  '🌼',
  '🌽',
  '🌾',
  '🌿',
  '🍀',
  '🍁',
  '🍂',
  '🍃',
  '🍄',
  '🍅',
  '🍆',
  '🍇',
  '🍈',
  '🍉',
  '🍊',
  '🍋',
  '🍌',
  '🍍',
  '🍎',
  '🍏',
  '🍐',
  '🍑',
  '🍒',
  '🍓',
  '🍔',
  '🍕',
  '🍖',
  '🍗',
  '🍘',
  '🍙',
  '🍚',
  '🍛',
  '🍜',
  '🍝',
  '🍞',
  '🍟',
  '🍠',
  '🍡',
  '🍢',
  '🍣',
  '🍤',
  '🍥',
  '🍦',
  '🍧',
  '🍨',
  '🍩',
  '🍪',
  '🍫',
  '🍬',
  '🍭',
  '🍮',
  '🍯',
  '🍰',
  '🍱',
  '🍲',
  '🍳',
  '🍴',
  '🍵',
  '🍶',
  '🍷',
  '🍸',
  '🍹',
  '🍺',
  '🍻',
  '🍼',
  '🍽',
  '🍾',
  '🍿',
  '⌚',
  '⌛',
  '⏰',
  '☔',
  '☕',
  '☝',
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
  '♻',
  '♿',
  '🧑‍🦽',
  '⚓',
  '⚠',
  '⚡',
  '⚽',
  '⚾',
  '⛄',
  '⛅',
  '⛔',
  '⛲',
  '⛵',
  '⛺',
  '⛽',
  '⭐',
  '🌂',
  '🌈',
  '🗻',
  '🗼',
  '🗽',
  '🗾',
  '🗿',
  '🔥',
  '🔦',
  '🔧',
  '🔨',
  '🔩',
  '🔫',
  '🔮',
  '🔯',
  '🔞',
  '🔗',
  '🔑',
  '🔒',
  '🔓',
  '🔔',
  '🔖',
  '🔍',
  '📷',
  '📹',
  '📺',
  '📻',
  '📼',
  '📦',
  '📧',
  '📕',
  '📒',
  '📓',
  '📌',
  '📍',
  '📎',
  '📏',
  '📈',
  '📅',
  '📁',
  '💾',
  '💿',
  '💻',
  '💼',
  '💯',
  '💰',
  '💳',
  '💣',
  '💤',
  '💥',
  '💦',
  '💧',
  '💨',
  '💩',
  '💫',
  '💬',
  '💡',
  '💞',
  '💔',
  '💏',
  '🎀',
  '🎁',
  '🎂',
  '🎃',
  '🎄',
  '🎅',
  '🎆',
  '🎈',
  '🎉',
  '🎊',
  '🎌',
  '🎎',
  '🎏',
  '🎐',
  '🎒',
  '🎓',
  '🎠',
  '🎡',
  '🎢',
  '🎣',
  '🎤',
  '🎥',
  '🎦',
  '🎧',
  '🎨',
  '🎩',
  '🎪',
  '🎫',
  '🎬',
  '🎭',
  '🎮',
  '🎯',
  '🎰',
  '🎱',
  '🎲',
  '🎳',
  '🎴',
  '🎵',
  '🎶',
  '🎷',
  '🎸',
  '🎹',
  '🎺',
  '🎻',
  '🎼',
  '🎽',
  '🎾',
  '🎿',
  '🏀',
  '🏁',
  '🏂',
  '🏃',
  '🏄',
  '🏆',
  '🏈',
  '🏊',
  '🧘',
  '🥊',
  '🤼',
  '🏋',
  '⛳',
  '🏏',
  '🏉',
  '🕺',
  '🏇',
  '🏠',
  '🏡',
  '🏢',
  '🏥',
  '🏦',
  '🏧',
  '🏨',
  '🏩',
  '🏪',
  '🏫',
  '🏬',
  '🏭',
  '🏯',
  '🏰',
  '🐌',
  '🐍',
  '🐎',
  '🐑',
  '🐒',
  '🐔',
  '🐗',
  '🐘',
  '🐙',
  '🐚',
  '🐛',
  '🐜',
  '🐝',
  '🐞',
  '🐟',
  '🐠',
  '🐡',
  '🐢',
  '🐣',
  '🐤',
  '🐥',
  '🐦',
  '🐧',
  '🐨',
  '🐩',
  '🐫',
  '🐬',
  '🐭',
  '🐮',
  '🐯',
  '🐰',
  '🐱',
  '🐲',
  '🐳',
  '🐴',
  '🐵',
  '🐶',
  '🐷',
  '🐸',
  '🐹',
  '🐺',
  '🐻',
  '🐼',
  '🐽',
  '🐾',
  '🦀',
  '🕷',
  '🕸',
  '🪰',
  '🦆',
  '🦢',
  '🦊',
  '🦁',
  '⛪',
  '🕌',
  '🛕',
  '🕍',
  '🏖',
  '🏔️',
  '🃏',
  '🂡',
  '🧸',
  '🔭',
  '🌺',
  '🗡',
  '🔪',
  '🧾',
  '🥢',
  '♟',
  '🛒',
  '⚰',
  '🪦',
  '🧻',
  '🪑',
  '🛋️',
  '🛏',
  '🗄️',
  '🩸',
  '⚔',
  '🗑',
  '☎',
  '🧳',
]

export function CategoryModal({
  show,
  onClose,
  onSave,
  selectedEmoji,
  onEmojiSelect,
  editingCategory,
  currentIsPublic = false,
  currentPrivateCategoryCount, // NEW: Receive count
}: CategoryModalProps) {
  const [categoryName, setCategoryName] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [showPrivateLimitWarning, setShowPrivateLimitWarning] = useState(false) // NEW

  const modalRef = useRef<HTMLDivElement>(null)
  const { getAvailableEmojis, isPremium, canCreatePrivateCategory } =
    useSubscription()

  const availableEmojis =
    getAvailableEmojis() === 'premium' ? PREMIUM_EMOJI_LIST : FREE_EMOJI_LIST

  useEffect(() => {
    if (show) {
      setCategoryName(editingCategory || '')
      // ✅ When editing, use currentIsPublic; when creating new, default to true (public)
      setIsPublic(editingCategory ? currentIsPublic : true)
      setShowPrivateLimitWarning(false)
    }
  }, [show, editingCategory, currentIsPublic])

  // NEW: Check if user can select private when toggling
  const handlePrivateSelection = () => {
    // If editing an existing category, allow changing to private
    if (editingCategory) {
      setIsPublic(false)
      setShowPrivateLimitWarning(false)
      return
    }

    // If creating new category, check limit
    if (!isPremium && !canCreatePrivateCategory(currentPrivateCategoryCount)) {
      setShowPrivateLimitWarning(true)
      return
    }

    setIsPublic(false)
    setShowPrivateLimitWarning(false)
  }

  const handleSave = () => {
    if (onSave(categoryName.trim(), editingCategory, isPublic)) {
      setCategoryName('')
      setIsPublic(false)
      setShowPrivateLimitWarning(false)
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
          background: #ffffff;
          color: #334155;
          transition: all 0.3s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
        }

        .enhanced-input:focus {
          outline: none;
          border-color: #975226;
          background: #ffffff;
          box-shadow:
            0 0 0 4px rgba(151, 82, 38, 0.1),
            0 4px 12px rgba(0, 0, 0, 0.05);
          transform: translateY(-1px);
        }

        .enhanced-input::placeholder {
          color: #94a3b8;
          opacity: 1;
          font-weight: 400;
        }

        .visibility-toggle {
          background: rgba(151, 82, 38, 0.05);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 20px;
          border: 1px solid rgba(151, 82, 38, 0.2);
        }

        .toggle-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .toggle-title {
          font-size: 14px;
          font-weight: 600;
          color: #333;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .toggle-switch {
          position: relative;
          width: 52px;
          height: 28px;
          background: #cbd5e1;
          border-radius: 14px;
          cursor: pointer;
          transition: background 0.3s ease;
        }

        .toggle-switch.active {
          background: #975226;
        }

        .toggle-slider {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 24px;
          height: 24px;
          background: white;
          border-radius: 50%;
          transition: transform 0.3s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .toggle-switch.active .toggle-slider {
          transform: translateX(24px);
        }

        .visibility-options {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 12px;
        }

        .visibility-option {
          padding: 12px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 10px;
          background: white;
        }

        .visibility-option:hover {
          border-color: #975226;
          background: rgba(151, 82, 38, 0.05);
        }

        .visibility-option.selected {
          border-color: #975226;
          background: rgba(151, 82, 38, 0.1);
        }

        .option-icon {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          background: rgba(151, 82, 38, 0.1);
          color: #975226;
        }

        .visibility-option.selected .option-icon {
          background: #975226;
          color: white;
        }

        .option-content {
          flex: 1;
        }

        .option-title {
          font-size: 13px;
          font-weight: 600;
          color: #333;
          margin-bottom: 2px;
        }

        .option-desc {
          font-size: 11px;
          color: #666;
        }

        .toggle-description {
          font-size: 13px;
          color: #666;
          line-height: 1.5;
          display: flex;
          align-items: start;
          gap: 8px;
          padding: 12px;
          background: rgba(151, 82, 38, 0.08);
          border-radius: 8px;
        }

        .toggle-icon {
          margin-top: 2px;
          flex-shrink: 0;
        }

        .emoji-picker-section {
          background: rgba(151, 82, 38, 0.05);
          border-radius: 12px;
          padding: 20px;
          border: 1px solid rgba(151, 82, 38, 0.2);
        }

        .emoji-picker-header {
          margin-bottom: 16px;
        }

        .emoji-picker-title {
          font-size: 16px;
          font-weight: 600;
          color: #333;
          margin: 0 0 8px 0;
          display: flex;
          align-items: center;
        }

        .emoji-picker-title i {
          color: #975226;
          margin-right: 8px;
        }

        .premium-notice {
          font-size: 12px;
          color: #975226;
          margin-top: 8px;
          padding: 10px 12px;
          background: rgba(151, 82, 38, 0.1);
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
          border: 1px solid rgba(151, 82, 38, 0.2);
        }

        .premium-link {
          color: #975226;
          font-weight: 600;
          text-decoration: underline;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .premium-link:hover {
          color: #7a421e;
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
          background: #7a421e;
        }

        .emoji-btn {
          width: 44px;
          height: 44px;
          border: 2px solid transparent;
          background: white;
          border-radius: 10px;
          cursor: pointer;
          font-size: 24px;
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
          border-color: #975226;
          transform: scale(1.08);
          box-shadow: 0 4px 16px rgba(151, 82, 38, 0.4);
        }

        .emoji-btn.selected:hover {
          transform: scale(1.08);
        }

        .modal-footer {
          padding: 20px 24px 24px 24px;
          border-top: 1px solid rgba(151, 82, 38, 0.2);
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
          background: #7a421e;
          border-color: #7a421e;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(151, 82, 38, 0.4);
        }

        .btn-primary:active {
          transform: translateY(0);
        }

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

          .visibility-options {
            grid-template-columns: 1fr;
          }

          .emoji-grid {
            grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
            gap: 6px;
          }

          .emoji-btn {
            width: 40px;
            height: 40px;
            font-size: 20px;
          }
        }
      `}</style>
      <style jsx>{`
        /* KEEP ALL YOUR EXISTING STYLES - Just showing the new ones */

        .private-limit-warning {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border: 2px solid #f59e0b;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 16px;
          display: flex;
          align-items: start;
          gap: 12px;
          animation: slideIn 0.3s ease;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .warning-icon {
          color: #f59e0b;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .warning-content {
          flex: 1;
        }

        .warning-title {
          font-size: 14px;
          font-weight: 700;
          color: #92400e;
          margin-bottom: 6px;
        }

        .warning-message {
          font-size: 13px;
          color: #78350f;
          line-height: 1.5;
          margin-bottom: 10px;
        }

        .warning-upgrade-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: #f59e0b;
          color: white;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .warning-upgrade-link:hover {
          background: #d97706;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
        }

        .visibility-option.disabled {
          opacity: 0.5;
          cursor: not-allowed;
          pointer-events: none;
        }

        /* Keep all your other existing styles from the original file */
        /* ... (modal-overlay, modal-content, etc.) ... */
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
            {/* Category Name Input */}
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

            {/* NEW: Private Category Limit Warning */}
            {showPrivateLimitWarning && !isPremium && (
              <div className="private-limit-warning">
                <AlertCircle className="warning-icon w-5 h-5" />
                <div className="warning-content">
                  <div className="warning-title">
                    Private Category Limit Reached
                  </div>
                  <div className="warning-message">
                    Free users can create only 1 private category. Upgrade to
                    Premium for unlimited private categories!
                  </div>
                  <Link href="/subscription" className="warning-upgrade-link">
                    <Crown className="w-4 h-4" />
                    Upgrade to Premium
                  </Link>
                </div>
              </div>
            )}

            {/* Visibility Toggle Section */}
            <div className="visibility-toggle">
              <div className="toggle-header">
                <span className="toggle-title">
                  {isPublic ? (
                    <Globe className="w-4 h-4" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                  Category Visibility
                </span>
                <div
                  className={`toggle-switch ${isPublic ? 'active' : ''}`}
                  onClick={() => {
                    if (isPublic) {
                      handlePrivateSelection()
                    } else {
                      setIsPublic(true)
                      setShowPrivateLimitWarning(false)
                    }
                  }}
                >
                  <div className="toggle-slider" />
                </div>
              </div>

              <div className="visibility-options">
                {/* Private Option */}
                <div
                  className={`visibility-option ${!isPublic ? 'selected' : ''}`}
                  onClick={handlePrivateSelection}
                >
                  <div className="option-icon">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div className="option-content">
                    <div className="option-title">Private</div>
                    <div className="option-desc">
                      {!isPremium && !editingCategory
                        ? `Only visible to you (${currentPrivateCategoryCount}/1 used)`
                        : 'Only visible to you'}
                    </div>
                  </div>
                </div>

                {/* Public Option */}
                <div
                  className={`visibility-option ${isPublic ? 'selected' : ''}`}
                  onClick={() => {
                    setIsPublic(true)
                    setShowPrivateLimitWarning(false)
                  }}
                >
                  <div className="option-icon">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div className="option-content">
                    <div className="option-title">Public</div>
                    <div className="option-desc">Visible on profile</div>
                  </div>
                </div>
              </div>

              <div className="toggle-description">
                <span className="toggle-icon">
                  {isPublic ? (
                    <Globe className="w-4 h-4 text-green-600" />
                  ) : (
                    <Lock className="w-4 h-4 text-gray-600" />
                  )}
                </span>
                <span>
                  {isPublic
                    ? 'This category and its links will be visible on your public profile.'
                    : 'This category and its links will only be visible to you.'}
                </span>
              </div>
            </div>

            {/* Emoji Picker Section - KEEP YOUR EXISTING CODE */}
            <div className="emoji-picker-section">
              <div className="emoji-picker-header">
                <h5 className="emoji-picker-title">
                  <i className="fa-solid fa-smile"></i>
                  Choose an Icon
                </h5>
                {!isPremium && (
                  <div className="premium-notice">
                    <Crown className="w-4 h-4" />
                    <span>
                      Unlock 750+ more emojis with{' '}
                      <Link href="/subscription" className="premium-link">
                        Premium
                      </Link>
                    </span>
                  </div>
                )}
              </div>

              <div>
                <div className="emoji-section-title">
                  {isPremium ? 'All Icons' : 'Free Icons'}
                </div>
                <div className="emoji-grid">
                  {availableEmojis.map((emoji, index) => (
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
                      <TwemojiEmoji emoji={emoji} size={24} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>
              <i className="fa-solid fa-times"></i>
              Cancel
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
