import { Link, NavLink, useLocation } from 'react-router-dom'
import { Instagram, Phone, LockKeyhole } from 'lucide-react'
import { BRAND_LOGO } from '../assets/brandLogo'

export default function Layout({ settings, children }) {
  const loc = useLocation()
  const admin = loc.pathname.startsWith('/admin')

  if (admin) return children

  return (
    <>
      <header className="top">
        <div className="brand">
          <div className="logo brand-logo-image">
            <img src={BRAND_LOGO} alt="Logo Studio Nayumi Siqueira" />
          </div>
          <div>
            <strong>{settings.name}</strong>
            <small>{settings.subtitle}</small>
          </div>
        </div>

        <nav>
          <NavLink to="/">Início</NavLink>
          <NavLink to="/servicos">Serviços</NavLink>
          <NavLink to="/profissionais">Profissionais</NavLink>
          <NavLink to="/agendar">Agendar</NavLink>
        </nav>

        <Link className="btn" to="/agendar">Agendar agora</Link>
      </header>

      <main>{children}</main>

      <footer>
        <div>
          <b>{settings.name}</b>
          <p>{settings.address || 'Endereço editável no painel administrativo'}</p>
        </div>
        <div className="footer-actions">
          {settings.instagram && <a href={settings.instagram} target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={18} /></a>}
          {settings.phone && <a href={`https://wa.me/${settings.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" aria-label="WhatsApp"><Phone size={18} /></a>}
          <Link to="/admin/login" className="admin-link"><LockKeyhole size={15} /> Admin</Link>
        </div>
      </footer>
    </>
  )
}
