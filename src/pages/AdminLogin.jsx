import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ensureAdmin } from '../lib/admin'

export default function AdminLogin({ setAuth }) {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: signInError } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

    if (signInError) {
      setError('E-mail ou senha incorretos.')
      setLoading(false)
      return
    }

    const isAdmin = await ensureAdmin().catch(() => false)

    if (!isAdmin) {
      await supabase.auth.signOut()
      setAuth?.(false)
      setError('Este usuário não possui acesso administrativo.')
      setLoading(false)
      return
    }

    setAuth?.(true)
    setLoading(false)
    navigate('/admin', { replace: true })
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-logo">NS</div>

        <h1>Área Administrativa</h1>
        <p>Studio Nayumi Siqueira</p>

        <form onSubmit={handleLogin}>
          <label>
            E-mail
            <input
              type="email"
              placeholder="Digite seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label>
            Senha
            <input
              type="password"
              placeholder="Digite sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <button
          type="button"
          className="forgot-password"
          onClick={() => navigate('/admin/recuperar-senha')}
        >
          Esqueci minha senha
        </button>

        <button
          type="button"
          className="back-home"
          onClick={() => navigate('/')}
        >
          Voltar para o site
        </button>
      </div>
    </div>
  )
}
