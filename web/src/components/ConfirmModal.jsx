import React, { useEffect } from 'react'
import {
  IconClose,
  IconTrash,
  IconAlertTriangle,
  IconCheckCircle,
  IconEdit,
  IconPlus,
  IconLogout,
} from './Icons'

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = '¿Estás seguro?',
  message = '',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'primary', // 'danger' | 'warning' | 'success' | 'primary'
  icon = null,
  detailItem = null, // { title, badge, subtitle }
  loading = false,
}) {
  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, loading, onClose])

  if (!isOpen) return null

  // Default icons by type if not supplied
  const renderIcon = () => {
    if (icon) return icon
    switch (type) {
      case 'danger':
        return <IconTrash size={28} />
      case 'warning':
        return <IconEdit size={28} />
      case 'success':
        return <IconCheckCircle size={28} />
      case 'logout':
        return <IconLogout size={28} />
      default:
        return <IconPlus size={28} />
    }
  }

  return (
    <div className="confirm-modal-overlay" onClick={!loading ? onClose : undefined}>
      <div
        className={`confirm-modal-box confirm-type-${type}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {!loading && (
          <button className="confirm-modal-close" onClick={onClose} title="Cerrar">
            <IconClose size={18} />
          </button>
        )}

        {/* Animated Icon with Pulsing Halo */}
        <div className="confirm-icon-wrapper">
          <div className="confirm-icon-pulse" />
          <div className="confirm-icon-badge">{renderIcon()}</div>
        </div>

        {/* Content */}
        <div className="confirm-modal-content">
          <h3 className="confirm-modal-title">{title}</h3>
          {message && <p className="confirm-modal-message">{message}</p>}

          {/* Optional item detail preview pill */}
          {detailItem && (
            <div className="confirm-detail-card">
              <div className="confirm-detail-header">
                <span className="confirm-detail-title">{detailItem.title}</span>
                {detailItem.badge && (
                  <span className="confirm-detail-badge">{detailItem.badge}</span>
                )}
              </div>
              {detailItem.subtitle && (
                <div className="confirm-detail-subtitle">{detailItem.subtitle}</div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="confirm-modal-actions">
          <button
            type="button"
            className="btn btn-secondary confirm-btn-cancel"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`btn confirm-btn-action confirm-btn-${type}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <span className="confirm-btn-loading">
                <span className="confirm-spinner" />
                <span>Procesando...</span>
              </span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
