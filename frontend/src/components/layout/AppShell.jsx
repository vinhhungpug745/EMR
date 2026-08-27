import { Bell, LogOut, Menu, Search, X } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'

import { useAuth } from '../../auth/useAuth'
import { getRoleConfig } from '../../config/roles'
import { formatCurrentVietnamDate } from '../../utils/dateTime'
import { Brand } from '../common/Brand'

export function AppShell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const roleConfig = getRoleConfig(user.role)

  const handleLogout = async () => {
    await logout()
    navigate('/login', {
      replace: true,
      state: { loggedOut: true },
    })
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${isMenuOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__header">
          <Brand />
          <button
            className="icon-button sidebar__close"
            type="button"
            aria-label="Đóng menu"
            onClick={() => setIsMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar__nav" aria-label="Điều hướng chính">
          <span className="sidebar__section-label">Không gian làm việc</span>
          {roleConfig.nav.map(({ id, label, path, icon: Icon }) => (
            <NavLink
              key={id}
              to={path}
              end={path === '/app'}
              className={({ isActive }) => `nav-item ${isActive ? 'nav-item--active' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              <Icon size={19} strokeWidth={1.8} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__profile">
          <span className="avatar" aria-hidden="true">
            {user.full_name.slice(0, 1).toUpperCase()}
          </span>
          <span className="sidebar__identity">
            <strong>{user.full_name}</strong>
            <small>{roleConfig.label}</small>
          </span>
          <button className="icon-button" type="button" aria-label="Đăng xuất" onClick={handleLogout}>
            <LogOut size={19} />
          </button>
        </div>
      </aside>

      {isMenuOpen && (
        <button
          className="sidebar-backdrop"
          type="button"
          aria-label="Đóng menu"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      <section className="workspace">
        <header className="topbar">
          <button
            className="icon-button topbar__menu"
            type="button"
            aria-label="Mở menu"
            onClick={() => setIsMenuOpen(true)}
          >
            <Menu size={21} />
          </button>
          <div className="topbar__search">
            <Search size={18} aria-hidden="true" />
            <input type="search" placeholder="Tìm bệnh nhân, hồ sơ, lượt khám..." aria-label="Tìm kiếm" />
          </div>
          <div className="topbar__actions">
            <button className="icon-button" type="button" aria-label="Thông báo">
              <Bell size={19} />
            </button>
            <span className="topbar__date">
              {formatCurrentVietnamDate()}
            </span>
          </div>
        </header>
        <main className="workspace__content">
          <Outlet />
        </main>

        <footer className="workspace__footer">
          <span className="workspace__footer-brand">EMR Care</span>
          <span>Hồ sơ bệnh án điện tử</span>
          <span>Copyright © 2026</span>
        </footer>
      </section>
    </div>
  )
}
