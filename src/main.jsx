import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles.css'

function StartupError({ error }) {
  const reset = () => {
    try {
      localStorage.removeItem('nayumi-studio-v1')
      sessionStorage.clear()
    } catch {}
    window.location.reload()
  }

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#f7f1eb' }}>
      <section style={{ width: 'min(560px, 92vw)', background: '#fffdfb', padding: 30, borderRadius: 20, textAlign: 'center', boxShadow: '0 12px 40px rgba(0,0,0,.06)' }}>
        <h1 style={{ fontFamily: 'Georgia, serif', marginTop: 0 }}>Studio Nayumi Siqueira</h1>
        <p>Encontramos um erro ao iniciar o site.</p>
        <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', textAlign: 'left', background: '#f7f1eb', padding: 12, borderRadius: 10, fontSize: 12 }}>
          {String(error?.message || error || 'Erro desconhecido')}
        </pre>
        <button onClick={reset} style={{ padding: '12px 18px', border: 0, borderRadius: 12, cursor: 'pointer' }}>
          Limpar dados e recarregar
        </button>
      </section>
    </main>
  )
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) { return { error } }
  componentDidCatch(error, info) { console.error('Erro ao renderizar:', error, info) }
  render() { return this.state.error ? <StartupError error={this.state.error} /> : this.props.children }
}

function Bootstrap() {
  const [App, setApp] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    import('./App.jsx')
      .then(mod => { if (active) setApp(() => mod.default) })
      .catch(err => { console.error('Erro ao importar App:', err); if (active) setError(err) })
    return () => { active = false }
  }, [])

  if (error) return <StartupError error={error} />
  if (!App) {
    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f7f1eb' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'Georgia, serif', marginBottom: 8 }}>Studio Nayumi Siqueira</h1>
          <p>Carregando...</p>
        </div>
      </main>
    )
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  )
}

const rootElement = document.getElementById('root')
if (!rootElement) {
  document.body.innerHTML = '<div style="padding:40px;font-family:Arial">Erro: elemento #root não encontrado.</div>'
} else {
  ReactDOM.createRoot(rootElement).render(<Bootstrap />)
}
