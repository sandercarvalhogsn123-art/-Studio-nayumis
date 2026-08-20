import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Erro ao carregar o Studio Nayumi:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#f7f1eb' }}>
          <section style={{ maxWidth: 520, background: '#fffdfb', padding: 28, borderRadius: 20, textAlign: 'center' }}>
            <h1 style={{ fontFamily: 'Georgia, serif' }}>Studio Nayumi Siqueira</h1>
            <p>O site encontrou um erro ao carregar. Atualize a página para tentar novamente.</p>
            <button onClick={() => { localStorage.removeItem('nayumi-data'); location.reload() }} style={{ padding: '12px 18px', border: 0, borderRadius: 12, cursor: 'pointer' }}>
              Corrigir e recarregar
            </button>
          </section>
        </main>
      )
    }

    return this.props.children
  }
}

const rootElement = document.getElementById('root')

ReactDOM.createRoot(rootElement).render(
  <ErrorBoundary>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ErrorBoundary>
)
