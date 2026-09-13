import { Accessibility, ArrowRight, MapPinned, ScanSearch, ShieldCheck, Sparkles } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
    if (error) console.error('Google login error:', error)
  }

  return (
    <main className="access-grid relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-20 h-[32rem] w-[32rem] rounded-full bg-sky-400/10 blur-3xl" />

      <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-12 px-6 py-10 lg:grid-cols-[1.1fr_.9fr] lg:px-12">
        <section className="access-enter hidden lg:block">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-950 shadow-2xl">
              <Accessibility size={25} />
            </span>
            <div>
              <p className="text-xl font-black tracking-tight">ACCESS</p>
              <p className="text-[10px] font-bold uppercase tracking-[.22em] text-slate-500">Accessibility intelligence</p>
            </div>
          </div>

          <div className="mt-20 max-w-2xl">
            <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[.2em] text-emerald-300">
              <Sparkles size={16} /> Navigate with confidence
            </p>
            <h1 className="mt-5 text-6xl font-black leading-[.98] tracking-[-.04em] xl:text-7xl">
              The map should know what makes a route usable.
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-400">
              ACCESS combines community reports, AI image analysis and route intelligence to make accessibility visible before you arrive.
            </p>
          </div>

          <div className="access-stagger mt-12 grid max-w-2xl grid-cols-3 gap-3">
            {[
              [MapPinned, 'Map', 'See reported barriers'],
              [ScanSearch, 'AI vision', 'Understand photos'],
              [ArrowRight, 'Smart routes', 'Find safer alternatives'],
            ].map(([Icon, title, text]) => {
              const FeatureIcon = Icon as typeof MapPinned
              return (
                <div key={String(title)} className="rounded-2xl border border-white/10 bg-white/[.045] p-4 backdrop-blur">
                  <FeatureIcon size={19} className="text-emerald-300" />
                  <p className="mt-5 text-sm font-black">{String(title)}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{String(text)}</p>
                </div>
              )
            })}
          </div>
        </section>

        <section className="access-enter mx-auto w-full max-w-md">
          <div className="mb-8 text-center lg:hidden">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-slate-950 shadow-2xl">
              <Accessibility size={30} />
            </div>
            <h1 className="mt-5 text-4xl font-black tracking-tight">ACCESS</h1>
            <p className="mt-2 text-sm text-slate-400">Accessibility, mapped.</p>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[.07] p-7 shadow-2xl backdrop-blur-2xl sm:p-9">
            <div className="mb-8">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
                <ShieldCheck size={21} />
              </div>
              <h2 className="text-2xl font-black tracking-tight">Welcome to ACCESS</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">Explore accessibility conditions, report barriers, and discover routes designed around real-world access.</p>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="group flex w-full items-center justify-between rounded-2xl bg-white px-5 py-4 font-black text-slate-950 shadow-xl hover:-translate-y-0.5 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-emerald-300"
            >
              <span className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-sm font-black">G</span> Continue with Google</span>
              <ArrowRight size={18} className="transition group-hover:translate-x-1" />
            </button>

            <p className="mt-6 text-center text-[11px] leading-5 text-slate-500">By continuing, you agree to use ACCESS responsibly.</p>
          </div>

          <p className="mt-6 text-center text-xs text-slate-600">Community-powered accessibility intelligence</p>
        </section>
      </div>
    </main>
  )
}