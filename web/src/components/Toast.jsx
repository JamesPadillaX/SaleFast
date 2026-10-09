import React, { useEffect } from 'react'
import { IconCheck, IconAlertTriangle, IconClose } from './Icons'

export default function Toast({
  isOpen,
  message,
  type = 'success', // 'success' | 'danger' | 'warning' | 'info'
  onClose,
  duration = 3200,
}) {
  useEffect(() => {
    if (!isOpen) return
    const timer = setTimeout(() => {
      onClose()
    }, duration)
    return () => clearTimeout(timer)
  }, [isOpen, duration, onClose])

  if (!isOpen) return null

  return (
    <div className={`toast-notification toast-${type}`}>
      <div className="toast-icon">
        {type === 'success' && <IconCheck size={18} />}
        {type === 'danger' && <IconAlertTriangle size={18} />}
        {type === 'warning' && <IconAlertTriangle size={18} />}
      </div>
      <div className="toast-message">{message}</div>
      <button className="toast-close" onClick={onClose} title="Cerrar">
        <IconClose size={14} />
      </button>
      <div className="toast-progress-bar" style={{ animationDuration: `${duration}ms` }} />
    </div>
  )
}
