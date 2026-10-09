import React, { useState, useEffect } from 'react'
import { api } from '../api'
import { IconClose } from './Icons'

export default function InventoryHistoryModal({ product, onClose }) {
  if (!product) return null

  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true)
      try {
        const res = await api.get(`/inventario/historial/producto/${product.id}`)
        if (res.ok) {
          const data = await res.json()
          setMovements(Array.isArray(data) ? data : [])
        }
      } catch (err) {
        console.error('Error fetching inventory history:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [product.id])

  // Normalizar tipo a mayúsculas para comparar
  const getType = (tipo) => (tipo || '').toUpperCase()

  // Totales
  const totalEntradas = movements
    .filter((m) => getType(m.tipo) === 'ENTRADA')
    .reduce((sum, m) => sum + Number(m.cantidad), 0)
  const totalSalidas = movements
    .filter((m) => getType(m.tipo) === 'SALIDA')
    .reduce((sum, m) => sum + Number(m.cantidad), 0)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 680 }}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">📦 Historial de Movimientos</h3>
            <p className="modal-subtitle">
              {product.nombre} &nbsp;·&nbsp; Stock actual:&nbsp;
              <strong>{product.stock} {product.unidadMedida}</strong>
            </p>
          </div>
          <button className="btn-close" onClick={onClose}>
            <IconClose size={20} />
          </button>
        </div>

        {/* Resumen rápido */}
        {!loading && movements.length > 0 && (
          <div style={{ display: 'flex', gap: 12, padding: '0 1.5rem 1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 10, padding: '0.6rem 1rem', minWidth: 120 }}>
              <div style={{ fontSize: '0.68rem', color: '#065f46', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Total Entradas</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669' }}>
                +{totalEntradas} <small style={{ fontSize: '0.78rem', fontWeight: 500, color: '#065f46' }}>{product.unidadMedida}</small>
              </div>
            </div>
            <div style={{ flex: 1, background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 10, padding: '0.6rem 1rem', minWidth: 120 }}>
              <div style={{ fontSize: '0.68rem', color: '#9f1239', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Total Salidas</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#e11d48' }}>
                -{totalSalidas} <small style={{ fontSize: '0.78rem', fontWeight: 500, color: '#9f1239' }}>{product.unidadMedida}</small>
              </div>
            </div>
            <div style={{ flex: 1, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '0.6rem 1rem', minWidth: 120 }}>
              <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Movimientos</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b' }}>
                {movements.length} <small style={{ fontSize: '0.78rem', fontWeight: 500, color: '#64748b' }}>registros</small>
              </div>
            </div>
          </div>
        )}

        <div className="modal-body" style={{ paddingTop: 0 }}>
          {loading ? (
            <div className="text-center py-8 text-muted">
              <div style={{ fontSize: 36, marginBottom: 10 }}>⏳</div>
              Cargando movimientos...
            </div>
          ) : movements.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📋</span>
              <p>No hay movimientos registrados para este producto.</p>
              <small className="text-muted">Las entradas, salidas y ajustes de inventario aparecerán aquí.</small>
            </div>
          ) : (
            <div className="table-responsive" style={{ maxHeight: 340, overflowY: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Fecha y Hora</th>
                    <th>Tipo</th>
                    <th>Cantidad</th>
                    <th>Motivo</th>
                    <th>Responsable</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => {
                    const tipo = getType(m.tipo)
                    const isEntrada = tipo === 'ENTRADA'
                    const isSalida = tipo === 'SALIDA'
                    const badgeClass = isEntrada ? 'badge-success' : isSalida ? 'badge-danger' : 'badge-warning'
                    const sign = isEntrada ? '+' : isSalida ? '-' : '±'

                    return (
                      <tr key={m.id}>
                        <td className="text-xs text-muted whitespace-nowrap">
                          {new Date(m.fecha).toLocaleString('es-PE', {
                            day: '2-digit', month: '2-digit', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </td>
                        <td>
                          <span className={`badge ${badgeClass}`}>{m.tipo}</span>
                        </td>
                        <td className="font-semibold whitespace-nowrap">
                          <span className={isEntrada ? 'text-emerald' : isSalida ? 'text-rose' : 'text-amber'}>
                            {sign}{m.cantidad} {product.unidadMedida}
                          </span>
                        </td>
                        <td className="text-secondary text-sm">{m.motivo || 'Sin motivo'}</td>
                        <td className="text-xs font-semibold">{m.usuario?.nombre || 'Sistema'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="modal-footer flex justify-end">
          <button className="btn btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
