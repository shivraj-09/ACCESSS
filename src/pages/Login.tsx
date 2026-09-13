import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Eye, MapPinned, Pause, Play, ScanSearch, ShieldCheck, Volume2, VolumeX } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

export default function Login() {
  const { enterDemo } = useAuth()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [videoReady, setVideoReady] = useState(false)
  const [videoError, setVideoError] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const start = async () => {
      try {
        await video.play()
        setIsPlaying(true)
      } catch {
        setIsPlaying(false)
      }
    }

    if (video.readyState >= 2) start()
  }, [])

  async function handleGoogleLogin() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
    if (error) console.error('Google login error:', error)
  }

  async function toggleVideo() {
    const video = videoRef.current
    if (!video) return

    if (video.paused) {
      try {
        await video.play()
        setIsPlaying(true)
      } catch {
        setIsPlaying(false)
      }
    } else {
      video.pause()
      setIsPlaying(false)
    }
  }

  function toggleMute() {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setIsMuted(video.muted)
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f1e8] text-[#18211d]">
      <div className="grid min-h-screen lg:grid-cols-[1.08fr_.92fr]">
        <section className="relative min-h-[680px] overflow-hidden bg-[#061321] text-white lg:min-h-screen">
          <video
            ref={videoRef}
            className="absolute inset-0 z-0 h-full w-full object-cover"
            src="/access-intro.mp4"
            poster="/raah-logo.jpg"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            controls={false}
            onCanPlay={() => setVideoReady(true)}
            onPlaying={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onError={() => setVideoError(true)}
            aria-label="RAAH introduction video"
          />

          <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#050d14] via-[#07131c]/35 to-[#07131c]/5" />
          <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#050d14]/75 via-[#050d14]/15 to-transparent" />
          <div className="absolute inset-0 z-10 bg-black/5" />

          <div className="relative z-20 flex min-h-[680px] flex-col p-6 md:p-10 lg:min-h-screen lg:p-12 xl:p-14">
            <div className="flex items-center gap-3">
              <img src="/raah-logo.jpg" alt="RAAH" className="h-16 w-16 rounded-2xl object-cover shadow-2xl ring-1 ring-white/20" />
              <div>
                <div className="text-2xl font-black tracking-[.18em]">RAAH</div>
                <div className="text-[9px] font-bold uppercase tracking-[.24em] text-white/70">A more accessible tomorrow</div>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleVideo}
              className="absolute right-6 top-6 flex items-center gap-3 rounded-full border border-white/25 bg-black/25 px-4 py-2.5 text-xs font-bold backdrop-blur-md transition hover:bg-black/40 md:right-10 md:top-10"
              aria-label={isPlaying ? 'Pause RAAH introduction video' : 'Play RAAH introduction video'}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/50">
                {isPlaying ? <Pause size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
              </span>
              {isPlaying ? 'RAAH in motion' : 'Watch how RAAH works'}
            </button>

            <div className="mt-auto max-w-2xl pb-2 pt-24 lg:pb-5">
              <p className="text-xs font-black uppercase tracking-[.25em] text-[#c8d89d]">Before the journey</p>
              <h1 className="mt-5 max-w-xl text-5xl font-black leading-[.94] tracking-[-.055em] md:text-7xl">Know what the path is really like.</h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-white/80 md:text-lg">A community-powered accessibility map that turns observations into useful context — and helps people choose with confidence.</p>

              <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
                {[
                  [MapPinned, 'See', 'reported conditions'],
                  [ScanSearch, 'Understand', 'photo evidence'],
                  [ArrowUpRight, 'Choose', 'a safer route'],
                ].map(([Icon, title, text]) => {
                  const I = Icon as typeof MapPinned
                  return (
                    <div key={String(title)} className="border border-white/15 bg-black/20 p-4 backdrop-blur-sm">
                      <I size={18} className="text-[#d9e8b2]" />
                      <p className="mt-4 text-sm font-black">{String(title)}</p>
                      <p className="mt-1 text-xs leading-5 text-white/65">{String(text)}</p>
                    </div>
                  )
                })}
              </div>

              <div className="mt-7 flex items-center justify-between gap-4 text-xs text-white/65">
                <div className="flex items-center gap-3">
                  <span className="h-px w-10 bg-white/30" />
                  <span>Accessibility, in context.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline">{videoError ? 'Video unavailable' : videoReady ? 'Intro video' : 'Loading video'}</span>
                  <button type="button" onClick={toggleMute} className="rounded-full border border-white/20 bg-black/20 p-2 backdrop-blur-sm hover:bg-black/35" aria-label={isMuted ? 'Unmute intro video' : 'Mute intro video'}>
                    {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-[#f5f1e8] px-5 py-8 md:px-10 md:py-12 lg:px-14">
          <div className="pointer-events-none absolute -left-24 -top-20 h-80 w-80 rounded-full border border-[#d9d2c5] opacity-60" />
          <div className="pointer-events-none absolute -right-28 bottom-[-110px] h-80 w-80 rounded-full border border-[#d9d2c5] opacity-60" />
          <div className="relative mx-auto flex min-h-full max-w-xl flex-col justify-center">
            <div className="mb-8 flex justify-center">
              <img src="/raah-logo.jpg" alt="RAAH — A more accessible tomorrow" className="h-36 w-36 rounded-[2rem] object-cover shadow-xl ring-1 ring-black/5 md:h-44 md:w-44" />
            </div>

            <div className="border-y border-[#ddd6ca] py-7">
              <p className="text-xs font-black uppercase tracking-[.24em] text-[#b15e3e]">Get started</p>
              <h2 className="mt-2 text-4xl font-black tracking-[-.045em] text-[#173e34]">Welcome to RAAH.</h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-[#737a73]">Explore the map first, then sign in when you want to contribute.</p>

              <button type="button" onClick={handleGoogleLogin} className="mt-7 flex w-full items-center justify-between rounded-xl bg-[#1f5b4b] px-5 py-4 font-bold text-white shadow-lg shadow-[#1f5b4b]/10 transition hover:-translate-y-0.5 hover:bg-[#17483b]">
                <span className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-sm font-black text-[#1f5b4b]">G</span> Continue with Google</span>
                <ArrowUpRight size={18} />
              </button>

              <div className="my-6 flex items-center gap-3 text-[10px] font-black uppercase tracking-[.18em] text-[#9a9c94]"><span className="h-px flex-1 bg-[#ded8cc]" />Or explore instantly<span className="h-px flex-1 bg-[#ded8cc]" /></div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button type="button" onClick={() => enterDemo('judge-1')} className="group rounded-xl border border-[#d2cabc] bg-[#fffdf8] p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#1f5b4b] hover:shadow-md">
                  <div className="flex items-center justify-between"><UsersRoundIcon /><ArrowUpRight size={16} className="text-[#aaa99f] group-hover:text-[#1f5b4b]" /></div>
                  <p className="mt-4 font-black text-[#254b3f]">Alex Morgan</p><p className="mt-1 text-xs text-[#7a8179]">Accessibility Explorer</p>
                </button>
                <button type="button" onClick={() => enterDemo('judge-2')} className="group rounded-xl border border-[#d2cabc] bg-[#fffdf8] p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#1f5b4b] hover:shadow-md">
                  <div className="flex items-center justify-between"><Eye size={18} className="text-[#1f5b4b]" /><ArrowUpRight size={16} className="text-[#aaa99f] group-hover:text-[#1f5b4b]" /></div>
                  <p className="mt-4 font-black text-[#254b3f]">Sam Rivera</p><p className="mt-1 text-xs text-[#7a8179]">Community Reporter</p>
                </button>
              </div>

              <div className="mt-5 flex items-start gap-3 rounded-xl border border-[#d7ded2] bg-[#edf2e9] px-4 py-3 text-[11px] leading-5 text-[#52655c]">
                <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#1f5b4b]" />
                <span>These are demo identities for judges and reviewers. No personal account needed.</span>
              </div>
            </div>

            <div className="mt-7 flex items-center justify-between gap-5 text-[11px] text-[#8b8f88]"><span>Community-powered accessibility intelligence</span><span className="text-right">Built for a more accessible tomorrow.</span></div>
          </div>
        </section>
      </div>
    </main>
  )
}

function UsersRoundIcon() {
  return <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#f2dfcf] text-[#b15e3e]"><Eye size={13} /></span>
}
