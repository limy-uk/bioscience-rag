'use client'

import React from 'react'
import { ChatSession } from '@/lib/types'
import { MessageSquare, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatSidebarProps {
  sessions: ChatSession[]
  currentSessionId: string | null
  onSessionSelect: (sessionId: string) => void
  onNewChat: () => void
  onDeleteSession: (sessionId: string) => void
  isOpen: boolean
  onToggle: () => void
}

export function ChatSidebar({
  sessions,
  currentSessionId,
  onSessionSelect,
  onNewChat,
  onDeleteSession,
  isOpen,
  onToggle
}: ChatSidebarProps) {
  const formatDate = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    return date.toLocaleDateString()
  }

  const truncateTitle = (title: string, maxLength: number = 30) => {
    return title.length > maxLength ? title.substring(0, maxLength) + '...' : title
  }

  return (
    <>
      {/* Sidebar Toggle Button */}
      <button
        onClick={onToggle}
        className="fixed top-4 left-4 z-50 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors md:hidden"
        title="Toggle chat history"
      >
        <MessageSquare size={20} className="text-white" />
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 h-full w-64 bg-black/30 backdrop-blur-md border-r border-white/10 z-50 transform transition-transform duration-300",
        isOpen ? "translate-x-0" : "-translate-x-full",
        "md:relative md:translate-x-0 md:z-auto"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-white/10">
            <button
              onClick={onNewChat}
              className="w-full flex items-center space-x-2 px-3 py-2 bg-cosmic-gradient cosmic-glow rounded-lg hover:scale-105 transition-all duration-200"
            >
              <Plus size={16} className="text-white" />
              <span className="text-white font-medium">New Chat</span>
            </button>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto p-2">
            {sessions.length === 0 ? (
              <div className="text-gray-400 text-sm text-center py-8">
                No chat history yet
              </div>
            ) : (
              <div className="space-y-1">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className={cn(
                      "group relative flex items-center space-x-2 p-2 rounded-lg cursor-pointer transition-colors",
                      currentSessionId === session.id
                        ? "bg-cosmic-gradient cosmic-glow"
                        : "hover:bg-white/10"
                    )}
                    onClick={() => onSessionSelect(session.id)}
                  >
                    <MessageSquare size={14} className={cn(
                      "flex-shrink-0",
                      currentSessionId === session.id ? "text-white" : "text-gray-400"
                    )} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">
                        {truncateTitle(session.title)}
                      </div>
                      <div className={cn(
                        "text-xs",
                        currentSessionId === session.id ? "text-white/80" : "text-gray-400"
                      )}>
                        {formatDate(session.updatedAt)}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteSession(session.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
                      title="Delete chat"
                    >
                      <Trash2 size={12} className="text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10">
            <div className="text-xs text-gray-400 text-center">
              Made with ❤️ during<br />
              <span className="text-cosmic-300 font-medium">NASA Space Apps Challenge 2025</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
