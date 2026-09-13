import { useEffect, useRef, useState } from 'react'
import { Bot, Send, User, Sparkles, MapPin, ShieldCheck, MessageCircle } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'

type Message = { role: 'user' | 'assistant'; content: string }
const suggestions = ['What makes an entrance wheelchair accessible?', 'What should I look for when reporting a barrier?', 'How can I find accessible places nearby?']

function formatAssistantMessage(content: string) {
  return content.replace(/\*\*(.*?)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1').replace(/^\s*#{1,6}\s*/gm, '').replace(/^\s*[-*]\s+/gm, '• ').trim()
}

function demoAnswer(message: string) {
  const normalized = message.toLowerCase()
  if (normalized.includes('wheelchair accessible') || normalized.includes('entrance')) {
    return 'A wheelchair-accessible entrance should ideally have a step-free route, a firm and reasonably wide path, a ramp with a manageable slope, enough clear door width, and space to approach and turn. Also check for obstacles such as parked vehicles, loose objects, or narrow passages.'
  }
  if (normalized.includes('reporting a barrier') || normalized.includes('report a barrier')) {
    return 'For a useful report, capture the barrier clearly in the photo, choose the closest barrier type, add a short description of what you observed, and make sure the location is accurate. RAAH AI provides an advisory assessment that you review before publishing.'
  }
  if (normalized.includes('nearby') || normalized.includes('accessible places')) {
    return 'Use Explore to see confirmed community reports around you. Look at the photo, barrier type, description, and location before relying on a report. RAAH can also use nearby confirmed reports as context when location access is available.'
  }
  return 'In this judge demo, the assistant can answer common accessibility questions. Try one of the suggested questions above, or sign in with Google to use the live map-aware assistant.'
}

export default function Chat() {
  const { session, demoUser } = useAuth()
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', content: "Hi! I'm RAAH Assistant. I can help you understand accessibility barriers, interpret RAAH reports, and think through accessibility questions." }])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, sending])

  async function sendMessage(messageOverride?: string) {
    const message = (messageOverride ?? input).trim()
    if (!message || sending) return

    setInput('')
    setMessages((current) => [...current, { role: 'user', content: message }])
    setSending(true)

    // Judge demo mode has no Supabase session, so answer locally instead of silently doing nothing.
    if (!session?.access_token && demoUser) {
      await new Promise((resolve) => setTimeout(resolve, 450))
      setMessages((current) => [...current, { role: 'assistant', content: demoAnswer(message) }])
      setSending(false)
      return
    }

    if (!session?.access_token) {
      setMessages((current) => [...current, { role: 'assistant', content: 'Please sign in with Google to use the live assistant.' }])
      setSending(false)
      return
    }

    try {
      let latitude: number | null = null
      let longitude: number | null = null
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: false, timeout: 4000 }))
          latitude = position.coords.latitude
          longitude = position.coords.longitude
        } catch {}
      }
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-v2`, { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ message, conversation_id: conversationId, latitude, longitude }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'The assistant could not respond.')
      if (data.conversation_id) setConversationId(data.conversation_id)
      setMessages((current) => [...current, { role: 'assistant', content: data.reply }])
    } catch (error) {
      setMessages((current) => [...current, { role: 'assistant', content: error instanceof Error ? error.message : 'Something went wrong. Please try again.' }])
    } finally {
      setSending(false)
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    void sendMessage()
  }

  return <main className="mx-auto flex h-[calc(100vh-70px)] max-w-6xl flex-col px-4 py-5 pb-24 md:px-6 md:pb-6 access-enter">
    <header className="relative shrink-0 overflow-hidden rounded-[2rem] bg-slate-950 p-5 text-white shadow-2xl md:p-6 access-grid"><div className="absolute -right-16 -top-20 h-52 w-52 rounded-full border-[36px] border-emerald-400/10 access-float" /><div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400 text-slate-950 shadow-lg access-pulse"><Bot size={23} /></div><div><div className="flex items-center gap-2"><p className="text-xs font-black uppercase tracking-[.18em] text-emerald-300">RAAH AI</p><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /></div><h1 className="text-2xl font-black tracking-tight md:text-3xl">Accessibility Assistant</h1></div></div><div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-300 sm:flex"><ShieldCheck size={15} className="text-emerald-300" /> Map-aware assistance</div></div><p className="relative mt-3 max-w-2xl text-sm leading-6 text-slate-300">Ask about barriers, accessibility, or reports. When location is available, RAAH can use nearby confirmed reports as context.</p></header>
    <div className="relative mt-4 min-h-0 flex-1 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl"><div className="pointer-events-none absolute inset-0 access-grid opacity-40" /><div className="relative h-full overflow-y-auto p-4 md:p-7" aria-live="polite">{messages.map((message, index) => <div key={`${message.role}-${index}`} className={`mb-5 flex gap-3 access-enter ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>{message.role === 'assistant' && <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white shadow-sm"><Bot size={16} /></div>}<div className={`max-w-[min(78%,680px)] whitespace-pre-wrap rounded-[1.25rem] px-4 py-3.5 text-sm leading-6 shadow-sm ${message.role === 'user' ? 'rounded-br-md bg-slate-950 text-white' : 'rounded-bl-md border border-slate-200 bg-white text-slate-700'}`}>{message.role === 'assistant' ? formatAssistantMessage(message.content) : message.content}</div>{message.role === 'user' && <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800"><User size={16} /></div>}</div>)}{sending && <div className="mb-5 flex items-center gap-3 access-enter"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white"><Sparkles size={16} /></div><div className="rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">RAAH is thinking <span className="animate-pulse">•••</span></div></div>}{messages.length === 1 && !sending && <div className="mt-10 max-w-3xl"><div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400"><MessageCircle size={14} /> Suggested questions</div><div className="grid gap-2 md:grid-cols-3">{suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => void sendMessage(suggestion)} className="group rounded-2xl border border-slate-200 bg-white p-4 text-left text-sm font-semibold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 hover:text-slate-950"><span>{suggestion}</span><span className="mt-2 block text-emerald-600 opacity-0 transition group-hover:opacity-100">Ask →</span></button>)}</div></div>}<div ref={bottomRef} /></div></div>
    <form onSubmit={handleSubmit} className="mt-4 flex shrink-0 gap-2 rounded-3xl border border-slate-200 bg-white p-2 shadow-xl"><div className="relative flex-1"><MapPin size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask RAAH Assistant anything…" disabled={sending} className="w-full rounded-2xl bg-transparent py-3.5 pl-11 pr-4 text-sm font-medium outline-none placeholder:text-slate-400 disabled:opacity-50" aria-label="Message RAAH Assistant" /></div><button type="submit" disabled={!input.trim() || sending} className="flex min-w-14 items-center justify-center rounded-2xl bg-emerald-500 px-5 text-slate-950 shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5 hover:bg-emerald-400 disabled:opacity-40" aria-label="Send message"><Send size={19} /></button></form>
  </main>
}
