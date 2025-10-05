export interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  isStreaming?: boolean
  sources?: string[]
}

export interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}
