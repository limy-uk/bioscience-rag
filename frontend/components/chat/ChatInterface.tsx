'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { MessageList } from './MessageList'
import { ChatInput } from './ChatInput'
import { ChatSidebar } from './ChatSidebar'
import { Message, ChatSession } from '@/lib/types'
import { Trash2, Download } from 'lucide-react'

export function ChatInterface() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const generateId = () => Math.random().toString(36).substr(2, 9)

  // Load sessions from localStorage on mount
  useEffect(() => {
    const savedSessions = localStorage.getItem('chat-sessions')
    if (savedSessions) {
      try {
        const parsedSessions = JSON.parse(savedSessions).map((session: any) => ({
          ...session,
          createdAt: new Date(session.createdAt),
          updatedAt: new Date(session.updatedAt),
          messages: session.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }))
        setSessions(parsedSessions)
        
        // Load the most recent session if exists
        if (parsedSessions.length > 0) {
          const mostRecent = parsedSessions.sort((a: ChatSession, b: ChatSession) => 
            b.updatedAt.getTime() - a.updatedAt.getTime()
          )[0]
          setCurrentSessionId(mostRecent.id)
          setMessages(mostRecent.messages)
        }
      } catch (error) {
        console.error('Failed to load sessions:', error)
      }
    }
  }, [])

  // Save sessions to localStorage whenever sessions change
  useEffect(() => {
    localStorage.setItem('chat-sessions', JSON.stringify(sessions))
  }, [sessions])

  const generateChatTitle = (firstMessage: string) => {
    const words = firstMessage.split(' ').slice(0, 6).join(' ')
    return words.length > 50 ? words.substring(0, 50) + '...' : words
  }

  const createNewSession = useCallback(() => {
    const newSessionId = `session_${Date.now()}_${generateId()}`
    const newSession: ChatSession = {
      id: newSessionId,
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    setSessions(prev => [newSession, ...prev])
    setCurrentSessionId(newSessionId)
    setMessages([])
    setSidebarOpen(false)
  }, [])

  const selectSession = useCallback((sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId)
    if (session) {
      setCurrentSessionId(sessionId)
      setMessages(session.messages)
      setSidebarOpen(false)
    }
  }, [sessions])

  const deleteSession = useCallback((sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId))
    if (currentSessionId === sessionId) {
      const remainingSessions = sessions.filter(s => s.id !== sessionId)
      if (remainingSessions.length > 0) {
        const nextSession = remainingSessions[0]
        setCurrentSessionId(nextSession.id)
        setMessages(nextSession.messages)
      } else {
        createNewSession()
      }
    }
  }, [sessions, currentSessionId, createNewSession])

  const updateCurrentSession = useCallback((newMessages: Message[]) => {
    if (!currentSessionId) return
    
    setSessions(prev => prev.map(session => {
      if (session.id === currentSessionId) {
        const title = newMessages.length > 0 && session.title === 'New Chat' 
          ? generateChatTitle(newMessages[0].content)
          : session.title
        
        return {
          ...session,
          title,
          messages: newMessages,
          updatedAt: new Date()
        }
      }
      return session
    }))
  }, [currentSessionId])

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return

    // Create new session if none exists
    if (!currentSessionId) {
      createNewSession()
      return // Let the useEffect handle the message sending
    }

    const userMessage: Message = {
      id: generateId(),
      content,
      role: 'user',
      timestamp: new Date(),
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    updateCurrentSession(newMessages)
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: content, 
          sessionId: currentSessionId 
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Failed to get response reader')
      }

      const decoder = new TextDecoder()
      let assistantMessage: Message = {
        id: generateId(),
        content: '',
        role: 'assistant',
        timestamp: new Date(),
        isStreaming: true,
      }

      setMessages(prev => [...prev, assistantMessage])

      let done = false
      while (!done) {
        const { value, done: readerDone } = await reader.read()
        done = readerDone

        if (value) {
          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') {
                done = true
                break
              }
              
              try {
                const parsed = JSON.parse(data)
                if (parsed.content) {
                  assistantMessage.content += parsed.content
                  setMessages(prev => 
                    prev.map(msg => 
                      msg.id === assistantMessage.id 
                        ? { ...msg, content: assistantMessage.content }
                        : msg
                    )
                  )
                }
                if (parsed.sources) {
                  assistantMessage.sources = parsed.sources
                  setMessages(prev => 
                    prev.map(msg => 
                      msg.id === assistantMessage.id 
                        ? { ...msg, sources: assistantMessage.sources }
                        : msg
                    )
                  )
                }
              } catch (e) {
                // Ignore parsing errors for partial chunks
              }
            }
          }
        }
      }

      // Mark streaming as complete and update session
      assistantMessage.isStreaming = false
      const finalMessages = [...newMessages, assistantMessage]
      
      setMessages(prev => 
        prev.map(msg => 
          msg.id === assistantMessage.id 
            ? { ...msg, isStreaming: false }
            : msg
        )
      )
      updateCurrentSession(finalMessages)

    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: generateId(),
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        role: 'assistant',
        timestamp: new Date(),
      }
      const finalMessages = [...newMessages, errorMessage]
      setMessages(finalMessages)
      updateCurrentSession(finalMessages)
    } finally {
      setIsLoading(false)
    }
  }, [messages, currentSessionId, updateCurrentSession, createNewSession])

  const clearChat = () => {
    setMessages([])
  }

  const exportChat = () => {
    const chatData = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp.toISOString(),
    }))
    
    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bioscience-chat-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex h-screen bg-space-gradient">
      {/* Sidebar */}
      <ChatSidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSessionSelect={selectSession}
        onNewChat={createNewSession}
        onDeleteSession={deleteSession}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="glass-effect border-b border-white/10 p-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-cosmic-gradient cosmic-glow flex items-center justify-center">
              <span className="text-lg">🧬</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">BioScience RAG</h1>
              <p className="text-sm text-gray-400">AI Research Assistant</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* GitHub Badge */}
            <a
              href="https://github.com/limy-uk/bioscience-rag"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              title="View on GitHub"
            >
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
              </svg>
              <span className="text-sm text-white">GitHub</span>
            </a>
            
            {messages.length > 0 && (
              <>
                <button
                  onClick={exportChat}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="Export chat"
                >
                  <Download size={18} className="text-gray-400" />
                </button>
                <button
                  onClick={clearChat}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="Clear chat"
                >
                  <Trash2 size={18} className="text-gray-400" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

        {/* Messages */}
        <MessageList 
          messages={messages} 
          onQuestionClick={sendMessage}
        />

        {/* Input */}
        <ChatInput 
          onSendMessage={sendMessage}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
