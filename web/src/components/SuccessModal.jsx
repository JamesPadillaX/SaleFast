import React, { useEffect } from 'react'
import { IconClose } from './Icons'

/**
 * Modal con animación fluida de checkmark SVG para confirmar:
 * - Producto / Usuario / Categoría agregado
 * - Producto / Usuario / Categoría editado
 * - Producto / Usuario / Categoría eliminado
 */
export default function SuccessModal({
  isOpen,
  onClose,
  title = '¡Operación Exitosa!',
  message = '',
  actionType = 'add', // 'add' | 'edit' | 'delete'
  detailItem = null,  // { title, badge, subtitle }
  duration = 2400,    // Auto-cierre opcional (0 para desactivar)
}) {
  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)

    let timer
    if (duration > 0) {
      timer = setTimeout(() => {
        onClose()
      }, duration)
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (timer) clearTimeout(timer)
    }
  }, [isOpen, duration, onClose])

  if (!isOpen) return null

  // Colores temáticos según la acción
  const typeConfig = {
    add: {
      color: '#10B981',
      bgColor: 'rgba(16, 185, 129, 0.1)',
      badgeClass: 'badge-success',
      defaultTitle: '¡Agregado con Éxito!',
    },
    edit: {
      color: '#0EA5E9',
      bgColor: 'rgba(14, 165, 233, 0.1)',
      badgeClass: 'badge-info',
      defaultTitle: '¡Actualizado con Éxito!',
    },
    delete: {
      color: '#EF4444',
      bgColor: 'rgba(239, 68, 68, 0.1)',
      badgeClass: 'badge-danger',
      defaultTitle: '¡Eliminado con Éxito!',
    },
  }

  const currentConfig = typeConfig[actionType] || typeConfig.add
  const displayTitle = title || currentConfig.defaultTitle

  return (
    <div className="success-check-overlay" onClick={onClose}>
      <div
        className={`success-check-box action-type-${actionType}`}
        onClick={(e) => e.stopPropagation()}
        style={{
          '--check-color': currentConfig.color,
          '--check-bg-color': currentConfig.bgColor,
        }}
        role="dialog"
        aria-modal="true"
      >
        <button className="success-check-close" onClick={onClose} title="Cerrar">
          <IconClose size={16} />
        </button>

        {/* Checkmark SVG con animación de trazado */}
        <div className="success-check-icon-wrapper">
          <div className="success-check-pulse" />
          <svg className="success-check-svg" viewBox="0 0 52 52">
            <circle
              className="success-check-circle"
              cx="26"
              cy="26"
              r="25"
              fill="none"
            />
            <path
              className="success-check-path"
              fill="none"
              d="M14.1 27.2l7.1 7.2 16.7-16.8"
            />
          </svg>
        </div>

        {/* Textos informativos */}
        <div className="success-check-content">
          <h3 className="success-check-title">{displayTitle}</h3>
          {message && <p className="success-check-message">{message}</p>}

          {/* Tarjeta de previsualización del elemento */}
          {detailItem && (
            <div className="success-check-card">
              <div className="success-check-card-header">
                <span className="success-check-card-title">{detailItem.title}</span>
                {detailItem.badge && (
                  <span className="success-check-card-badge">{detailItem.badge}</span>
                )}
              </div>
              {detailItem.subtitle && (
                <div className="success-check-card-subtitle">{detailItem.subtitle}</div>
              )}
            </div>
          )}
        </div>

        {/* Botón de acción rápida */}
        <div className="success-check-actions">
          <button
            type="button"
            className="btn btn-primary success-check-btn-confirm"
            onClick={onClose}
            style={{ backgroundColor: currentConfig.color, borderColor: currentConfig.color }}
          >
            Aceptar
          </button>
        </div>

        {/* Barra de progreso de auto-cierre */}
        {duration > 0 && (
          <div
            className="success-check-progress-bar"
            style={{ animationDuration: `${duration}ms` }}
          />
        )}
      </div>
    </div>
  )
}
