'use client'

import { useState, useRef, useEffect } from 'react'
import { Smile } from 'lucide-react'
import { REACTION_EMOJIS } from '@/lib/reactions-service'

interface ReactionPickerProps {
  onSelect: (emoji: string) => void
  disabled?: boolean
  className?: string
}

export function ReactionPicker({
  onSelect,
  disabled = false,
  className = '',
}: ReactionPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [openUpwards, setOpenUpwards] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  /* Close on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!pickerRef.current?.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  /* ESC to close */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  /* Smart vertical positioning */
  useEffect(() => {
    if (!isOpen || !pickerRef.current) return

    const rect = pickerRef.current.getBoundingClientRect()
    setOpenUpwards(rect.bottom + 220 > window.innerHeight)
  }, [isOpen])

  const handleSelect = (emoji: string) => {
    onSelect(emoji)
    setIsOpen(false)
  }

  return (
    <div ref={pickerRef} className={`relative inline-flex ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((v) => !v)}
        className="
          inline-flex items-center gap-2
          rounded-lg border px-3 py-2
          bg-white text-sm font-medium text-gray-700
          hover:bg-gray-50
          disabled:opacity-50
        "
      >
        <Smile className="h-4 w-4" />
        React
      </button>

      {/* Picker */}
      {isOpen && (
        <div
          className={`
            absolute z-50
            ${openUpwards ? 'bottom-full mb-2' : 'top-full mt-2'}
            rounded-xl border bg-white shadow-xl
            overflow-hidden
          `}
        >
          {/* Header */}
          <div className="border-b px-3 py-2 text-xs font-semibold text-gray-500">
            Choose a reaction
          </div>

          {/* Emoji Grid (FIXED WIDTH, COLLAPSIBLE) */}
          <div
            className="
              grid grid-cols-6
              gap-1 p-2
              w-[240px] max-w-full
              max-h-[160px]
              overflow-y-auto overflow-x-hidden
            "
          >
            {REACTION_EMOJIS.map(({ emoji, label }) => (
              <button
                key={emoji}
                onClick={() => handleSelect(emoji)}
                title={label}
                className="
                  flex h-9 w-9 items-center justify-center
                  rounded-lg
                  hover:bg-gray-100
                  active:scale-90
                  transition
                "
              >
                <span className="text-xl leading-none">{emoji}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
