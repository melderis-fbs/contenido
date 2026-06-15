'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Contraseña incorrecta')
        return
      }

      router.push('/')
      router.refresh()
    } catch {
      setError('Error de conexión. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <div
            className="inline-block w-10 h-10 rounded-xl mb-4"
            style={{ background: 'linear-gradient(135deg, #c6b297 0%, #9a877d 100%)' }}
          />
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Founders · Contenido</h1>
          <p className="mt-1 text-sm" style={{ color: '#9a877d' }}>
            Planificador de contenido
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border p-8 shadow-sm"
          style={{ borderColor: '#e7e3d7' }}
        >
          <label className="block text-sm font-medium text-ink mb-2" htmlFor="password">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-lg border px-3 py-2.5 text-sm text-ink bg-cream focus:outline-none focus:ring-2 focus:ring-accent transition-shadow"
            style={{ borderColor: error ? '#E8A23D' : '#e7e3d7' }}
            autoFocus
            required
          />

          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-5 w-full rounded-lg py-2.5 text-sm font-medium text-white transition-opacity disabled:opacity-60"
            style={{ background: '#282727' }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
