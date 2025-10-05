'use client'

import React, { useState, KeyboardEvent } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatInputProps {
  onSendMessage: (message: string) => void
  isLoading: boolean
  disabled?: boolean
}

export function ChatInput({ onSendMessage, isLoading, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('')

  const handleSend = () => {
    if (message.trim() && !isLoading && !disabled) {
      onSendMessage(message.trim())
      setMessage('')
    }
  }

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t border-white/10 bg-black/20 backdrop-blur-md p-4">
      <div className="flex items-end space-x-3 max-w-4xl mx-auto">
        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about biological sciences..."
            disabled={disabled || isLoading}
            className={cn(
              "w-full px-4 py-3 rounded-lg resize-none",
              "glass-effect text-white placeholder-gray-400",
              "focus:outline-none focus:ring-2 focus:ring-cosmic-500 focus:border-transparent",
              "min-h-[50px] max-h-32",
              disabled || isLoading ? "opacity-50 cursor-not-allowed" : ""
            )}
            rows={1}
          />
        </div>
        
        <button
          onClick={handleSend}
          disabled={!message.trim() || isLoading || disabled}
          className={cn(
            "flex items-center justify-center w-12 h-12 rounded-lg transition-all duration-200",
            "bg-cosmic-gradient cosmic-glow",
            "hover:scale-105 focus:outline-none focus:ring-2 focus:ring-cosmic-500",
            !message.trim() || isLoading || disabled
              ? "opacity-50 cursor-not-allowed hover:scale-100"
              : "hover:shadow-lg"
          )}
          title="Send message (Enter)"
        >
          {isLoading ? (
            <Loader2 size={20} className="animate-spin text-white" />
          ) : (
            <Send size={20} className="text-white" />
          )}
        </button>
      </div>
      
      {/* Helper text */}
      <div className="text-xs text-gray-400 text-center mt-2">
        Press Enter to send, Shift+Enter for new line
      </div>
    </div>
  )
}
