import { supabase } from '../lib/supabase'

export default function Login() {
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    })

    if (error) {
      console.error('Google login error:', error)
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-slate-950">
            <span className="text-2xl font-black">A</span>
          </div>

          <h1 className="text-4xl font-bold tracking-tight">
            ACCESS
          </h1>

          <p className="mt-3 text-slate-400">
            Accessibility, mapped.
          </p>
        </div>

        <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <h2 className="text-xl font-semibold">
            Welcome to ACCESS
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            Help make public spaces more accessible by reporting
            barriers around you.
          </p>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl bg-white px-5 py-3.5 font-semibold text-slate-900 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            <span className="text-lg font-bold">G</span>
            Continue with Google
          </button>

          <p className="mt-5 text-center text-xs text-slate-500">
            By continuing, you agree to use ACCESS responsibly.
          </p>
        </div>
      </div>
    </main>
  )
}