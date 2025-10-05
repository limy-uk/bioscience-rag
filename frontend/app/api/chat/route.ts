import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { message, sessionId } = await request.json()

    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Get environment variables
    const webhookUrl = process.env.N8N_WEBHOOK_URL
    const authToken = process.env.N8N_AUTH_TOKEN

    if (!webhookUrl || !authToken) {
      throw new Error('Missing environment variables: N8N_WEBHOOK_URL or N8N_AUTH_TOKEN')
    }

    // Create a readable stream for Server-Sent Events
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
              'Authorization': authToken,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: message,
              sessionId: sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            }),
          })

          if (!response.ok) {
            throw new Error(`n8n API error: ${response.status} ${response.statusText}`)
          }

          // Handle streaming response from n8n
          const reader = response.body?.getReader()
          if (!reader) {
            throw new Error('Failed to get response reader from n8n')
          }

          const decoder = new TextDecoder()
          let fullContent = ''
          let buffer = ''

          try {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break

              const chunk = decoder.decode(value, { stream: true })
              buffer += chunk

              // Process complete lines
              const lines = buffer.split('\n')
              buffer = lines.pop() || '' // Keep the last incomplete line in buffer

              for (const line of lines) {
                if (line.trim()) {
                  try {
                    const jsonLine = JSON.parse(line)
                    
                    if (jsonLine.type === 'item' && jsonLine.content) {
                      fullContent += jsonLine.content
                      // Send each piece of content as SSE for real-time streaming
                      const sseData = `data: ${JSON.stringify({ content: jsonLine.content })}\n\n`
                      controller.enqueue(new TextEncoder().encode(sseData))
                    }
                  } catch (e) {
                    // Ignore JSON parsing errors for incomplete lines
                    console.log('Skipping invalid JSON line:', line)
                  }
                }
              }
            }

            // Process any remaining content in buffer
            if (buffer.trim()) {
              try {
                const jsonLine = JSON.parse(buffer)
                if (jsonLine.type === 'item' && jsonLine.content) {
                  fullContent += jsonLine.content
                  const sseData = `data: ${JSON.stringify({ content: jsonLine.content })}\n\n`
                  controller.enqueue(new TextEncoder().encode(sseData))
                }
              } catch (e) {
                console.log('Skipping invalid JSON in buffer:', buffer)
              }
            }

            // Extract source URLs from the full content
            const sourcePattern = /Source:\s*(https?:\/\/[^\s\n]+)/gi
            const sources: string[] = []
            let match
            
            while ((match = sourcePattern.exec(fullContent)) !== null) {
              sources.push(match[1])
            }
            
            // Send sources separately if they exist
            if (sources.length > 0) {
              const sourcesData = `data: ${JSON.stringify({ sources })}\n\n`
              controller.enqueue(new TextEncoder().encode(sourcesData))
            }

          } finally {
            reader.releaseLock()
          }

        } catch (error) {
          console.error('Error in chat API:', error)
          
          // Send error message to client
          const errorData = `data: ${JSON.stringify({ 
            content: 'I apologize, but I encountered an error while processing your request. Please try again.' 
          })}\n\n`
          controller.enqueue(new TextEncoder().encode(errorData))
        } finally {
          // Send completion signal
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })

  } catch (error) {
    console.error('Error in chat API route:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
