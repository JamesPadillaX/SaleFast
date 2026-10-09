import React, { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import ConfirmModal from './ConfirmModal'
import {
  IconDashboard,
  IconPOS,
  IconProducts,
  IconCategories,
  IconInventory,
  IconSales,
  IconSuppliers,
  IconUsers,
  IconLogout,
  IconStore,
  IconMenu,
  IconClose,
} from './Icons'

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: IconDashboard },
  { path: '/pos', label: 'Punto de Venta', icon: IconPOS, highlight: true },
  { path: '/productos', label: 'Productos', icon: IconProducts },
  { path: '/categorias', label: 'Categorías', icon: IconCategories },
  { path: '/inventario', label: 'Inventario', icon: IconInventory },
  { path: '/ventas', label: 'Historial Ventas', icon: IconSales },
  { path: '/proveedores', label: 'Proveedores', icon: IconSuppliers },
  { path: '/usuarios', label: 'Usuarios', icon: IconUsers, adminOnly: true },
]

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [time, setTime] = useState(new Date().toLocaleTimeString('es-PE', { hour12: false }))
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Actualizar reloj
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('es-PE', { hour12: false }))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Cerrar menú móvil al navegar
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  function handleLogout() {
    setShowLogoutModal(true)
  }

  function confirmLogout() {
    setShowLogoutModal(false)
    logout()
    navigate('/login', { replace: true })
  }

  const role = user?.rol?.replace('ROLE_', '') || 'CAJERO'
  const initials = user?.nombre
    ? user.nombre.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U'

  // Get current page title
  const currentNav = NAV_ITEMS.find((item) => location.pathname.startsWith(item.path))
  const pageTitle = currentNav?.label || 'Sale Fast POS'

  return (
    <div className="layout-container">
      {/* Backdrop para cerrar el sidebar en móviles */}
      {isMobileMenuOpen && (
        <div
          className="sidebar-backdrop active"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar (Desktop + Mobile Drawer) */}
      <aside className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="brand-header">
          <div className="brand-logo">
            <IconStore size={22} />
          </div>
          <div className="brand-info">
            <span className="brand-title">SaleFast POS</span>
            <span className="brand-subtitle">Punto de Venta Pro</span>
          </div>
          {/* Botón de cerrar sidebar en móvil */}
          <button
            className="sidebar-close-btn"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Cerrar menú"
          >
            <IconClose size={20} />
          </button>
        </div>

        <nav className="nav-menu">
          <div className="nav-group-title">MENÚ PRINCIPAL</div>
          {NAV_ITEMS.map((item) => {
            if (item.adminOnly && role !== 'ADMIN') return null
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'active' : ''} ${item.highlight ? 'nav-pos' : ''}`
                }
              >
                <span className="nav-icon"><Icon size={19} /></span>
                <span className="nav-label">{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile-badge">
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <span className="user-name" title={user?.nombre}>{user?.nombre || 'Usuario'}</span>
              <span className={`user-role ${role === 'ADMIN' ? 'role-admin' : 'role-cashier'}`}>
                {role}
              </span>
            </div>
          </div>
          <button className="btn-logout" onClick={handleLogout} title="Cerrar sesión">
            <IconLogout size={18} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-wrapper">
        <header className="topbar">
          <div className="topbar-left">
            {/* Botón de menú sólo para tablet (en celular se usa el menú inferior) */}
            <button
              className="tablet-menu-toggle"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Abrir menú"
            >
              <IconMenu size={20} />
            </button>
            <div className="topbar-brand-mark">
              <IconStore size={18} />
            </div>
            <div className="topbar-title-wrap">
              <h1 className="current-page-title">{pageTitle}</h1>
            </div>
          </div>
          <div className="topbar-right">
            <div className="digital-clock" title="Hora actual">
              <span className="clock-pulse" />
              <span className="digital-clock-time">{time}</span>
            </div>
            <button
              type="button"
              className="topbar-user-pill"
              onClick={handleLogout}
              title={`Usuario: ${user?.nombre || 'Usuario'} (${role}) • Clic para cerrar sesión`}
            >
              <span className="topbar-avatar">{initials}</span>
              <span className="topbar-user-name">{user?.nombre?.split(' ')[0] || 'Admin'}</span>
            </button>
          </div>
        </header>

        <main className="content-area">
          <Outlet />
        </main>
      </div>

      {/* Barra de Navegación Inferior para Teléfonos (Mobile Bottom Bar) */}
      <nav className="mobile-bottom-nav">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
        >
          <IconDashboard size={20} />
          <span>Inicio</span>
        </NavLink>
        <NavLink
          to="/productos"
          className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
        >
          <IconProducts size={20} />
          <span>Productos</span>
        </NavLink>
        <NavLink
          to="/pos"
          className={({ isActive }) => `mobile-nav-item pos-fab ${isActive ? 'active' : ''}`}
        >
          <div className="pos-fab-circle">
            <IconPOS size={22} />
          </div>
          <span>POS</span>
        </NavLink>
        <NavLink
          to="/inventario"
          className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
        >
          <IconInventory size={20} />
          <span>Stock</span>
        </NavLink>
        <button
          type="button"
          className={`mobile-nav-item ${isMobileMenuOpen ? 'active' : ''}`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <IconMenu size={20} />
          <span>Menú</span>
        </button>
      </nav>

      {/* Modal Animado para Confirmar Cierre de Sesión */}
      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
        type="danger"
        icon={<IconLogout size={28} />}
        title="¿Cerrar sesión?"
        message="¿Estás seguro de que deseas salir del sistema? Para volver a operar tendrás que iniciar sesión nuevamente."
        confirmText="Sí, cerrar sesión"
        cancelText="Permanecer aquí"
      />
    </div>
  )
}
