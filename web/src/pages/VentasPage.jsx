import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { api } from '../api'
import {
  IconSearch,
  IconSales,
  IconClose,
  IconDollar,
  IconTrendingUp,
  IconTrendingDown,
  IconRefresh,
  IconChevronRight,
  IconFilter,
  IconBan,
  IconBarChart,
  IconCalendar,
  IconCalendarDays,
  IconCalendarRange,
  IconPrinter,
  IconCheck,
  IconAlertTriangle,
  IconBanknote,
  IconWallet,
  IconCreditCard,
  IconSmartphone,
} from '../components/Icons'
import { formatDateTime } from '../utils/formatters'
import NoPermissionModal from '../components/NoPermissionModal'
import { useRole } from '../hooks/useRole'

// ─── Period presets ────────────────────────────────────────────
const PERIODS = [
  { key: 'today',  label: 'Hoy',      icon: IconCalendar },
  { key: 'week',   label: 'Semana',   icon: IconCalendarDays },
  { key: 'month',  label: 'Mes',      icon: IconCalendarRange },
  { key: 'all',    label: 'Todo',     icon: IconBarChart },
]

// Formatea una fecha local como "YYYY-MM-DDTHH:mm:ss" sin convertir a UTC
function toLocalISOString(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  )
}

function getDateRange(period) {
  const now = new Date()
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
  let start
  if (period === 'today') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
  } else if (period === 'week') {
    const day = now.getDay() // 0=Sun
    const diff = now.getDate() - day + (day === 0 ? -6 : 1) // Mon
    start = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0)
  } else if (period === 'month') {
    start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
  } else {
    return null // all time
  }
  return {
    inicio: toLocalISOString(start),
    fin: toLocalISOString(end),
  }
}

// ─── Helpers ───────────────────────────────────────────────────
function metodoPagoIcon(metodo) {
  const m = (metodo || '').toLowerCase()
  if (m === 'tarjeta') return <IconCreditCard size={13} />
  if (m === 'yape' || m === 'plin') return <IconSmartphone size={13} />
  return <IconBanknote size={13} />
}

function calcGanancia(ventas) {
  return ventas.reduce((acc, s) => {
    if (s.anulada) return acc
    const ganancia = (s.detalles || []).reduce((g, d) => {
      const costo = Number(d.producto?.precioCompra || 0) * Number(d.cantidad)
      const venta = Number(d.subtotal || 0)
      return g + (venta - costo)
    }, 0)
    return acc + ganancia
  }, 0)
}

// ─── Void reason options ────────────────────────────────────────
const VOID_REASONS = [
  'Error en el cobro',
  'Producto devuelto por el cliente',
  'Duplicado / doble cobro',
  'Solicitud del cliente',
  'Producto defectuoso',
  'Otro motivo',
]

// ─── Main Component ─────────────────────────────────────────────
export default function VentasPage() {
  const { isAdmin } = useRole()
  const [noPermModal, setNoPermModal] = useState({ open: false, action: '' })

  function requireAdmin(action, fn) {
    if (!isAdmin) { setNoPermModal({ open: true, action }); return }
    fn()
  }
  const [sales, setSales]             = useState([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [period, setPeriod]           = useState('all')
  const [selectedSale, setSelectedSale] = useState(null)
  const [voidTarget, setVoidTarget]   = useState(null)   // sale to void
  const [voidReason, setVoidReason]   = useState(VOID_REASONS[0])
  const [customReason, setCustomReason] = useState('')
  const [voidLoading, setVoidLoading] = useState(false)
  const [toast, setToast]             = useState(null)

  // ── Load ─────────────────────────────────────────────────────
  const loadSales = useCallback(async () => {
    setLoading(true)
    try {
      const range = getDateRange(period)
      let res
      if (range) {
        res = await api.get(`/ventas/rango?inicio=${encodeURIComponent(range.inicio)}&fin=${encodeURIComponent(range.fin)}`)
      } else {
        res = await api.get('/ventas')
      }
      if (res.ok) {
        const data = await res.json()
        setSales(Array.isArray(data) ? data : [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => { loadSales() }, [loadSales])

  // ── Toast helper ──────────────────────────────────────────────
  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3200)
  }

  // ── Metrics ───────────────────────────────────────────────────
  const activeSales    = useMemo(() => sales.filter(s => !s.anulada), [sales])
  const anuladas       = useMemo(() => sales.filter(s => s.anulada), [sales])
  const totalRecaudado = useMemo(() => activeSales.reduce((a, s) => a + Number(s.total || 0), 0), [activeSales])
  const gananciaTotal  = useMemo(() => calcGanancia(sales), [sales])
  const ticketPromedio = useMemo(() => activeSales.length > 0 ? totalRecaudado / activeSales.length : 0, [activeSales, totalRecaudado])

  // ── Filter ────────────────────────────────────────────────────
  const filteredSales = useMemo(() => {
    const q = search.toLowerCase()
    return sales.filter(s =>
      !q ||
      String(s.id).includes(q) ||
      (s.metodoPago?.toLowerCase().includes(q)) ||
      (s.usuario?.nombre?.toLowerCase().includes(q)) ||
      (s.cliente?.nombre?.toLowerCase().includes(q))
    )
  }, [sales, search])

  // ── Void sale ─────────────────────────────────────────────────
  async function handleVoid() {
    if (!voidTarget) return
    setVoidLoading(true)
    const motivo = voidReason === 'Otro motivo' ? (customReason.trim() || 'Sin motivo') : voidReason
    try {
      const res = await api.patch(`/ventas/${voidTarget.id}/anular`, { motivo })
      if (res.ok) {
        setSales(prev => prev.map(s => s.id === voidTarget.id ? { ...s, anulada: true, motivoAnulacion: motivo } : s))
        showToast(`Venta #${String(voidTarget.id).substring(0, 8)} anulada correctamente`, 'success')
        setVoidTarget(null)
        setVoidReason(VOID_REASONS[0])
        setCustomReason('')
      } else {
        const err = await res.json()
        showToast(err.error || 'Error al anular la venta', 'error')
      }
    } catch (e) {
      showToast('Error de conexión al anular la venta', 'error')
    } finally {
      setVoidLoading(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="page-content">

      {/* ── Toast ── */}
      {toast && (
        <div className={`ventas-toast ventas-toast--${toast.type}`}>
          {toast.type === 'success' ? <IconCheck size={16} /> : <IconAlertTriangle size={16} />}
          <span>{toast.msg}</span>
        </div>
      )}

      <NoPermissionModal
        isOpen={noPermModal.open}
        onClose={() => setNoPermModal({ open: false, action: '' })}
        action={noPermModal.action}
      />

      {/* ── Period Filter Tabs ── */}
      <div className="ventas-period-tabs">
        {PERIODS.map(p => {
          const Icon = p.icon
          return (
            <button
              key={p.key}
              className={`ventas-period-tab${period === p.key ? ' active' : ''}`}
              onClick={() => setPeriod(p.key)}
            >
              <Icon size={15} />
              {p.label}
            </button>
          )
        })}
      </div>

      {/* ── KPI Cards ── */}
      <div className="kpi-grid">
        <div className="kpi-card kpi-blue">
          <div className="kpi-info">
            <span className="kpi-title">Ventas {period === 'all' ? 'Totales' : period === 'today' ? 'de Hoy' : period === 'week' ? 'Esta Semana' : 'Este Mes'}</span>
            <span className="kpi-value">{activeSales.length}</span>
            <span className="kpi-sub">{anuladas.length > 0 ? `${anuladas.length} anulada${anuladas.length > 1 ? 's' : ''}` : 'Sin anulaciones'}</span>
          </div>
          <div className="kpi-icon-wrapper"><IconSales size={26} /></div>
        </div>

        <div className="kpi-card kpi-emerald">
          <div className="kpi-info">
            <span className="kpi-title">Recaudación</span>
            <span className="kpi-value">S/ {totalRecaudado.toFixed(2)}</span>
            <span className="kpi-sub">Total facturado</span>
          </div>
          <div className="kpi-icon-wrapper"><IconDollar size={26} /></div>
        </div>

        <div className="kpi-card kpi-violet">
          <div className="kpi-info">
            <span className="kpi-title">Ganancia Neta</span>
            <span className="kpi-value" style={{ color: gananciaTotal >= 0 ? 'var(--color-emerald-400)' : 'var(--color-red-400)' }}>
              S/ {gananciaTotal.toFixed(2)}
            </span>
            <span className="kpi-sub">Venta - costo</span>
          </div>
          <div className="kpi-icon-wrapper">
            {gananciaTotal >= 0 ? <IconTrendingUp size={26} /> : <IconTrendingDown size={26} />}
          </div>
        </div>

        <div className="kpi-card kpi-neutral">
          <div className="kpi-info">
            <span className="kpi-title">Ticket Promedio</span>
            <span className="kpi-value">S/ {ticketPromedio.toFixed(2)}</span>
            <span className="kpi-sub">Por operación</span>
          </div>
          <div className="kpi-icon-wrapper"><IconBarChart size={26} /></div>
        </div>
      </div>

      {/* ── Header Actions ── */}
      <div className="page-header-actions mt-4">
        <div className="search-box">
          <IconSearch size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por Nº, cajero, método..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch('')}>×</button>
          )}
        </div>
        <button className="btn btn-secondary" onClick={loadSales} disabled={loading}>
          <IconRefresh size={16} />
          Actualizar
        </button>
      </div>

      {/* ── Table Card ── */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            Historial de Ventas
            <span className="ventas-count-badge">{filteredSales.length}</span>
          </h2>
          <p className="card-subtitle">Registro completo · Desglose de tickets y anulaciones</p>
        </div>

        <div className="card-body">
          {loading ? (
            <div className="ventas-loading">
              <div className="ventas-spinner" />
              <span>Cargando registros...</span>
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="empty-state py-8 text-center">
              <IconSales size={40} className="text-muted mb-2" />
              <p className="text-secondary">No se encontraron ventas para este período.</p>
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="table-responsive desktop-only-view">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Estado</th>
                      <th>Nº Ticket</th>
                      <th>Fecha y Hora</th>
                      <th>Cajero</th>
                      <th>Método</th>
                      <th>Total</th>
                      <th className="text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSales.map(s => (
                      <tr key={s.id} className={s.anulada ? 'row-anulada' : ''}>
                        <td>
                          {s.anulada
                            ? <span className="badge badge-danger">Anulada</span>
                            : <span className="badge badge-success">Válida</span>
                          }
                        </td>
                        <td className="font-mono font-bold text-primary">
                          #{String(s.id).substring(0, 8)}
                        </td>
                        <td className="text-xs text-muted whitespace-nowrap">
                          {formatDateTime(s.fecha || s.fechaVenta)}
                        </td>
                        <td className="font-medium text-secondary">
                          {s.usuario?.nombre || 'Cajero General'}
                        </td>
                        <td>
                          <span className="badge badge-info ventas-metodo-badge">
                            {metodoPagoIcon(s.metodoPago)}
                            {s.metodoPago || 'Efectivo'}
                          </span>
                        </td>
                        <td className={`font-bold ${s.anulada ? 'text-muted line-through' : 'text-primary-dark'}`}>
                          S/ {Number(s.total).toFixed(2)}
                        </td>
                        <td className="text-right">
                          <div className="ventas-action-group">
                            <button
                              className="btn-table btn-sm btn-primary"
                              onClick={() => setSelectedSale(s)}
                            >
                              Ver Ticket
                            </button>
                            {!s.anulada && (
                              <button
                                className="btn-table btn-sm btn-danger"
                                onClick={() => requireAdmin('anular ventas', () => setVoidTarget(s))}
                                title="Anular venta"
                              >
                                <IconBan size={13} />
                                Anular
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="mobile-only-view">
                {filteredSales.map(s => (
                  <div key={s.id} className={`mobile-tx-card${s.anulada ? ' mobile-tx-card--anulada' : ''}`}>
                    <div className="mobile-tx-row-top">
                      <div className="mobile-tx-meta">
                        <span className="mobile-tx-id">#{String(s.id).substring(0, 8)}</span>
                        {s.anulada
                          ? <span className="badge badge-danger">Anulada</span>
                          : <span className="badge badge-info ventas-metodo-badge">{metodoPagoIcon(s.metodoPago)}{s.metodoPago || 'Efectivo'}</span>
                        }
                      </div>
                      <div className={`mobile-tx-amount${s.anulada ? ' line-through text-muted' : ''}`}>
                        S/ {Number(s.total).toFixed(2)}
                      </div>
                    </div>
                    <div className="text-xs text-muted">
                      Atendido por: <span className="font-medium text-secondary">{s.usuario?.nombre || 'Cajero'}</span>
                    </div>
                    {s.anulada && s.motivoAnulacion && (
                      <div className="text-xs text-muted" style={{ marginTop: 2 }}>
                        Motivo: <span className="font-medium" style={{ color: 'var(--color-red-400)' }}>{s.motivoAnulacion}</span>
                      </div>
                    )}
                    <div className="mobile-tx-row-bottom">
                      <span className="mobile-tx-date">{formatDateTime(s.fecha || s.fechaVenta)}</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {!s.anulada && (
                          <button
                            className="mobile-tx-btn mobile-tx-btn--danger"
                            onClick={() => requireAdmin('anular ventas', () => setVoidTarget(s))}
                          >
                            <IconBan size={12} />
                          </button>
                        )}
                        <button
                          className="mobile-tx-btn"
                          onClick={() => setSelectedSale(s)}
                        >
                          <span>Ver</span>
                          <IconChevronRight size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Modal: Detalle de Venta ── */}
      {selectedSale && (
        <div className="modal-overlay" onClick={() => setSelectedSale(null)}>
          <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">
                  Ticket #{String(selectedSale.id).padStart(6, '0')}
                  {selectedSale.anulada && <span className="badge badge-danger ml-2">ANULADA</span>}
                </h3>
                <p className="modal-subtitle">{formatDateTime(selectedSale.fecha || selectedSale.fechaVenta)}</p>
              </div>
              <button className="btn-close" onClick={() => setSelectedSale(null)}>
                <IconClose size={20} />
              </button>
            </div>

            <div className="modal-body">
              {selectedSale.anulada && selectedSale.motivoAnulacion && (
                <div className="ventas-void-banner">
                  <IconBan size={14} />
                  <span>Motivo: {selectedSale.motivoAnulacion}</span>
                </div>
              )}
              <div className="receipt-ticket">
                <div className="receipt-header">
                  <h3>SALE FAST POS</h3>
                  <p>Minimarket &amp; Abarrotes</p>
                  <p className="font-mono text-xs">RUC: 20601234567</p>
                  <p className="text-xs">Ticket: #{String(selectedSale.id).padStart(6, '0')}</p>
                  <p className="text-xs font-semibold">{formatDateTime(selectedSale.fecha || selectedSale.fechaVenta)}</p>
                </div>

                <div className="receipt-divider" />

                <div className="receipt-items">
                  {selectedSale.detalles && selectedSale.detalles.length > 0 ? (
                    selectedSale.detalles.map((d, i) => (
                      <div key={i} className="receipt-row">
                        <span className="receipt-item-name">
                          {d.cantidad}x {d.producto?.nombre || 'Artículo'}
                        </span>
                        <span className="receipt-item-price">
                          S/ {Number(d.subtotal || d.precioUnitario * d.cantidad).toFixed(2)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted text-center py-2">Detalle no disponible</p>
                  )}
                </div>

                <div className="receipt-divider" />

                <div className="receipt-totals">
                  <div className="receipt-row font-bold text-base">
                    <span>TOTAL:</span>
                    <span>S/ {Number(selectedSale.total).toFixed(2)}</span>
                  </div>
                  <div className="receipt-row text-xs text-muted">
                    <span>Método de pago:</span>
                    <span>{selectedSale.metodoPago || 'Efectivo'}</span>
                  </div>
                  {selectedSale.igv && (
                    <div className="receipt-row text-xs text-muted">
                      <span>IGV incluido:</span>
                      <span>S/ {Number(selectedSale.igv).toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="receipt-footer">
                  <p>Atendido por: {selectedSale.usuario?.nombre || 'Cajero'}</p>
                  <p>¡Gracias por su preferencia!</p>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ justifyContent: 'space-between', display: 'flex' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedSale(null)}>
                Cerrar
              </button>
              <div style={{ display: 'flex', gap: 8 }}>
                {!selectedSale.anulada && (
                  <button
                    className="btn btn-danger"
                    onClick={() => requireAdmin('anular ventas', () => { setSelectedSale(null); setVoidTarget(selectedSale) })}
                  >
                    <IconBan size={15} />
                    Anular Venta
                  </button>
                )}
                <button className="btn btn-primary" onClick={() => window.print()}>
                  <IconPrinter size={15} />
                  Imprimir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Anular Venta ── */}
      {voidTarget && (
        <div className="modal-overlay" onClick={() => !voidLoading && setVoidTarget(null)}>
          <div className="modal-container modal-container--sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title ventas-void-title">
                  <IconBan size={18} style={{ color: 'var(--color-red-400)' }} />
                  Anular Venta
                </h3>
                <p className="modal-subtitle">
                  Ticket #{String(voidTarget.id).substring(0, 8)} — S/ {Number(voidTarget.total).toFixed(2)}
                </p>
              </div>
              <button className="btn-close" onClick={() => !voidLoading && setVoidTarget(null)}>
                <IconClose size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="ventas-void-warning">
                <IconAlertTriangle size={16} />
                <span>Esta acción revertirá el stock y marcará la venta como anulada. No se puede deshacer.</span>
              </div>

              <div className="ventas-void-field">
                <label className="ventas-void-label">Motivo de anulación</label>
                <div className="ventas-reason-list">
                  {VOID_REASONS.map(r => (
                    <button
                      key={r}
                      className={`ventas-reason-option${voidReason === r ? ' active' : ''}`}
                      onClick={() => setVoidReason(r)}
                    >
                      {voidReason === r && <IconCheck size={13} />}
                      {r}
                    </button>
                  ))}
                </div>
                {voidReason === 'Otro motivo' && (
                  <textarea
                    className="ventas-void-textarea"
                    placeholder="Describe el motivo de anulación..."
                    value={customReason}
                    onChange={e => setCustomReason(e.target.value)}
                    rows={3}
                  />
                )}
              </div>
            </div>

            <div className="modal-footer" style={{ justifyContent: 'space-between', display: 'flex' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setVoidTarget(null)}
                disabled={voidLoading}
              >
                Cancelar
              </button>
              <button
                className="btn btn-danger"
                onClick={handleVoid}
                disabled={voidLoading || (voidReason === 'Otro motivo' && !customReason.trim())}
              >
                {voidLoading ? (
                  <>
                    <div className="ventas-spinner-sm" />
                    Anulando...
                  </>
                ) : (
                  <>
                    <IconBan size={15} />
                    Confirmar Anulación
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
