import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  CalendarDays,
  Scissors,
  Users,
  WalletCards,
  Palette,
  Images,
  Settings,
  Plug,
  LogOut,
} from 'lucide-react'

export default function AdminShell({ children, onLogout }) {
  const nav = useNavigate()
  const items = [
    ['/admin', LayoutDashboard, 'Dashboard'],
    ['/admin/agenda', CalendarDays, 'Agenda'],
    ['/admin/servicos', Scissors, 'Serviços'],
    ['/admin/profissionais', Users, 'Profissionais'],
    ['/admin/financeiro', WalletCards, 'Financeiro'],
    ['/admin/site', Palette, 'Editar site'],
    ['/admin/galeria', Images, 'Galeria'],
    ['/admin/integracoes', Plug, 'Integrações'],
    ['/admin/configuracoes', Settings, 'Configurações'],
  ]

  async function handleLogout() {
    await onLogout?.()
    nav('/', { replace: true })
  }

  return (
    <div className="admin">
      <aside>
        <div className="admin-brand">
          <span>NS</span>
          <div>
            <b>Studio Nayumi</b>
            <small>Painel administrativo</small>
          </div>
        </div>

        {items.map(([to, Icon, title]) => (
          <NavLink key={to} end={to === '/admin'} to={to}>
            <Icon size={18} />
            {title}
          </NavLink>
        ))}

        <button className="aside-btn" onClick={handleLogout}>
          <LogOut size={18} />
          Sair
        </button>
      </aside>

      <section className="admin-main">{children}</section>
    </div>
  )
}
