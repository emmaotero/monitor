'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Email o contraseña incorrectos.')
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at 20% 50%, rgba(30,58,110,0.4) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(245,200,66,0.08) 0%, transparent 50%)',
      }}/>
      <div className="absolute inset-0" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }}/>

      <div className="relative w-full max-w-md px-6 animate-fadeUp">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
               style={{ background: 'linear-gradient(135deg, #1E3A6E, #0F2040)', border: '1px solid rgba(245,200,66,0.3)' }}>
            <span className="text-2xl">📊</span>
          </div>
          <h1 className="text-3xl font-display text-white mb-1">Mi Cartera</h1>
          <p className="text-sm" style={{ color: '#64748B' }}>Plataforma de inversiones</p>
        </div>

        <div className="glass p-8">
          <h2 className="text-lg font-semibold text-white mb-6">Iniciar sesión</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: '#94A3B8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                placeholder="tu@email.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: '#94A3B8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                placeholder="••••••••"
              />
            </div>
            {error && (
              <p className="text-sm px-4 py-2 rounded-lg" style={{ color: '#F87171', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)' }}>
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm mt-2"
              style={{
                background: loading ? '#1E3A6E' : 'linear-gradient(135deg, #E8B423, #F5C842)',
                color: loading ? '#64748B' : '#060B18',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>
        <p className="text-center text-xs mt-6" style={{ color: '#334155' }}>
          ¿No tenés cuenta? Contactá a tu asesor.
        </p>
      </div>
    </div>
  )
}
