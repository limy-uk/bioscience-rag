'use client'

import React, { useEffect, useRef } from 'react'
import { MessageBubble } from './MessageBubble'
import { Message } from '@/lib/types'

interface MessageListProps {
  messages: Message[]
  onQuestionClick?: (question: string) => void
}

export function MessageList({ messages, onQuestionClick }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-around p-8">
        <div className="text-center max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-8">Welcome to BioScience RAG</h2>
          
          {/* Bento Grid of Sample Questions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 justify-items-center">
            <button
              onClick={() => onQuestionClick?.("What were the key findings regarding antimicrobial resistance (AMR) patterns in the microbiome of the International Space Station (ISS) using a machine learning approach on metagenomic data?")}
              className="group p-6 glass-effect rounded-lg hover:bg-white/20 transition-all duration-200 text-left space-glow hover:scale-105"
            >
              <div className="mb-3">
                <span className="text-2xl">🦠</span>
              </div>
              <h3 className="text-white font-semibold mb-2 text-sm">Antimicrobial Resistance on ISS</h3>
              <p className="text-gray-400 text-xs leading-relaxed">
                Explore AMR patterns in the International Space Station microbiome using machine learning on metagenomic data
              </p>
            </button>

            <button
              onClick={() => onQuestionClick?.("Why is the movement of plant roots important for the plant, and how does the TNO1 protein mentioned in the study affect how roots grow?")}
              className="group p-6 glass-effect rounded-lg hover:bg-white/20 transition-all duration-200 text-left space-glow hover:scale-105"
            >
              <div className="mb-3">
                <span className="text-2xl">🌱</span>
              </div>
              <h3 className="text-white font-semibold mb-2 text-sm">Plant Root Movement & TNO1</h3>
              <p className="text-gray-400 text-xs leading-relaxed">
                Understand root movement importance and TNO1 protein's role in root growth regulation
              </p>
            </button>

            <button
              onClick={() => onQuestionClick?.("What were the specific scientific goals regarding physiological systems, and what types of measurements were combined in the mouse experiments aboard the Bion-M 1 biosatellite to study long-term adaptation to microgravity?")}
              className="group p-6 glass-effect rounded-lg hover:bg-white/20 transition-all duration-200 text-left space-glow hover:scale-105 md:col-span-2 lg:col-span-1"
            >
              <div className="mb-3">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="text-white font-semibold mb-2 text-sm">Bion-M 1 Microgravity Studies</h3>
              <p className="text-gray-400 text-xs leading-relaxed">
                Learn about physiological measurements in mouse experiments studying microgravity adaptation
              </p>
            </button>
          </div>

          <div className="mt-8">
            <p className="text-gray-400 text-sm">
              Click on any question above or ask your own biological science question below
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <div className="max-w-4xl mx-auto">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}
