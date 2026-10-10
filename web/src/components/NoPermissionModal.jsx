import React, { useEffect } from 'react'
import '../styles/no-permission-modal.css'

/**
 * Modal armonioso que se muestra cuando un cajero intenta
 * realizar una acción que requiere permisos de administrador.
 */
export default function NoPermissionModal({ isOpen, onClose, action = 'realizar esta acción' }) {
  // Cerrar con Escape
  useEffect(() => {
    if (!isOpen) return
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="noperm-overlay" onClick={onClose}>
      <div className="noperm-modal" onClick={(e) => e.stopPropagation()}>
        {/* Ícono animado */}
        <div className="noperm-icon-wrap">
          <div className="noperm-ring" />
          <svg className="noperm-lock" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            <circle cx="12" cy="16" r="1.2" fill="currentColor" stroke="none" />
          </svg>
        </div>

        {/* Contenido */}
        <div className="noperm-content">
          <h3 className="noperm-title">Acceso Restringido</h3>
          <p className="noperm-desc">
            No tienes permisos para <strong>{action}</strong>.<br />
            Esta acción está reservada para administradores del sistema.
          </p>
          <div className="noperm-hint">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            Contacta a tu administrador si necesitas acceso.
          </div>
        </div>

        {/* Botón */}
        <button className="noperm-btn" onClick={onClose}>
          Entendido
        </button>
      </div>
    </div>
  )
}
