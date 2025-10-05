'use client'

import React from 'react'
import ReactMarkdown from 'react-markdown'
import { Copy } from 'lucide-react'
import { Message } from '@/lib/types'
import { cn } from '@/lib/utils'

interface MessageBubbleProps {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <div className={cn(
      "flex w-full mb-4",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-[80%] rounded-lg px-4 py-3 relative group",
        isUser 
          ? "bg-cosmic-gradient text-white cosmic-glow" 
          : "glass-effect space-glow"
      )}>
        {/* Copy button */}
        <button
          onClick={copyToClipboard}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-white/20 rounded"
          title="Copy message"
        >
          <Copy size={14} />
        </button>

        {/* Message content */}
        <div className="pr-8">
          {isUser ? (
            <p className="text-white">{message.content}</p>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none text-white">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0 text-white">{children}</p>,
                  code: ({ children }) => (
                    <code className="bg-black/50 px-1 py-0.5 rounded text-green-300 text-sm">
                      {children}
                    </code>
                  ),
                  pre: ({ children }) => (
                    <pre className="bg-black/50 p-3 rounded-lg overflow-x-auto mb-2 text-white">
                      {children}
                    </pre>
                  ),
                  ul: ({ children }) => <ul className="list-disc list-inside mb-2 text-white">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside mb-2 text-white">{children}</ol>,
                  li: ({ children }) => <li className="mb-1 text-white">{children}</li>,
                  h1: ({ children }) => <h1 className="text-xl font-bold mb-2 text-white">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-lg font-bold mb-2 text-white">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-md font-bold mb-2 text-white">{children}</h3>,
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div className={cn(
          "text-xs mt-2 opacity-70",
          isUser ? "text-white" : "text-gray-300"
        )}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>

        {/* Sources */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-3 pt-3 border-t border-white/20">
            <div className="text-xs text-gray-400 mb-2 font-medium">Sources:</div>
            <div className="flex flex-wrap gap-2">
              {message.sources.map((source, index) => (
                <a
                  key={index}
                  href={source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 px-2 py-1 bg-white/10 hover:bg-white/20 rounded-md text-xs text-cosmic-300 hover:text-cosmic-200 transition-colors"
                >
                  <span>🔗</span>
                  <span className="truncate max-w-[200px]">
                    {source.replace(/^https?:\/\//, '').split('/')[0]}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Streaming indicator */}
        {message.isStreaming && (
          <div className="flex items-center mt-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-cosmic-400 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-cosmic-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-cosmic-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
