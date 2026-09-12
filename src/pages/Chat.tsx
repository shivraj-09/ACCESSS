import { useEffect, useRef, useState } from 'react'
import { Bot, Send, User, Sparkles, MapPin } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

const suggestions = [
  'What makes an entrance wheelchair accessible?',
  'What should I look for when reporting a barrier?',
  'How can I find accessible places nearby?',
]

export default function Chat() {
  const { session } = useAuth()

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        "Hi! I'm ACCESS Assistant. I can help you understand accessibility barriers, interpret ACCESS reports, and think through accessibility questions.",
    },
  ])

  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: 'smooth',
    })
  }, [messages, sending])

  async function sendMessage(messageOverride?: string) {
    const message = (messageOverride ?? input).trim()

    if (!message || sending || !session?.access_token) {
      return
    }

    setInput('')

    const updatedMessages = [
      ...messages,
      {
        role: 'user' as const,
        content: message,
      },
    ]

    setMessages(updatedMessages)
    setSending(true)

    try {
      let latitude: number | null = null
      let longitude: number | null = null

      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>(
            (resolve, reject) => {
              navigator.geolocation.getCurrentPosition(
                resolve,
                reject,
                {
                  enableHighAccuracy: false,
                  timeout: 4000,
                },
              )
            },
          )

          latitude = position.coords.latitude
          longitude = position.coords.longitude
        } catch {
          // Location is optional for chat.
        }
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-v2`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message,
            conversation_id: conversationId,
            latitude,
            longitude,
          }),
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error || 'The assistant could not respond.',
        )
      }

      if (data.conversation_id) {
        setConversationId(data.conversation_id)
      }

      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: data.reply,
        },
      ])
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content:
            error instanceof Error
              ? error.message
              : 'Something went wrong. Please try again.',
        },
      ])
    } finally {
      setSending(false)
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    sendMessage()
  }

  return (
    <main className="mx-auto flex h-[calc(100vh-70px)] max-w-5xl flex-col px-4 py-5 pb-24 md:px-6 md:pb-6">
      {/* Header */}
      <div className="shrink-0 pb-5">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-slate-950 p-3 text-white">
            <Bot size={22} />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              ACCESS AI
            </p>

            <h1 className="text-2xl font-black tracking-tight text-slate-950">
              Accessibility Assistant
            </h1>
          </div>
        </div>

        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Ask questions about accessibility, barriers, or reports
          on the ACCESS map.
        </p>
      </div>

      {/* Chat area */}
      <div className="min-h-0 flex-1 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div
          className="h-full overflow-y-auto p-4 md:p-6"
          aria-live="polite"
        >
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`mb-5 flex gap-3 ${
                message.role === 'user'
                  ? 'justify-end'
                  : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="mt-1 shrink-0 rounded-xl bg-slate-950 p-2 text-white">
                  <Bot size={16} />
                </div>
              )}

              <div
                className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${
                  message.role === 'user'
                    ? 'bg-slate-950 text-white'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {message.content}
              </div>

              {message.role === 'user' && (
                <div className="mt-1 shrink-0 rounded-xl bg-slate-100 p-2 text-slate-700">
                  <User size={16} />
                </div>
              )}
            </div>
          ))}

          {sending && (
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-slate-950 p-2 text-white">
                <Sparkles size={16} />
              </div>

              <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-500">
                ACCESS Assistant is thinking...
              </div>
            </div>
          )}

          {/* Suggestions */}
          {messages.length === 1 && !sending && (
            <div className="mt-8">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                Try asking
              </p>

              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => sendMessage(suggestion)}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-left text-sm text-slate-600 transition hover:border-slate-400 hover:text-slate-950"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="mt-4 flex shrink-0 gap-2"
      >
        <div className="relative flex-1">
          <MapPin
            size={17}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask ACCESS Assistant..."
            disabled={sending}
            className="w-full rounded-2xl border border-slate-300 bg-white py-4 pl-11 pr-4 text-sm outline-none transition focus:border-slate-950 disabled:bg-slate-100"
            aria-label="Message ACCESS Assistant"
          />
        </div>

        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="flex min-w-14 items-center justify-center rounded-2xl bg-slate-950 px-5 text-white disabled:opacity-40"
          aria-label="Send message"
        >
          <Send size={19} />
        </button>
      </form>
    </main>
  )
}