import React, { useState, useEffect } from 'react'
import { api } from '../api'
import InventoryHistoryModal from '../components/InventoryHistoryModal'
import {
  IconSearch,
  IconPlus,
  IconInventory,
  IconHistory,
  IconClose,
  IconAlertTriangle,
  IconBan,
  IconRefresh,
  IconChevronRight,
} from '../components/Icons'
import NoPermissionModal from '../components/NoPermissionModal'
import { useRole } from '../hooks/useRole'

export default function InventarioPage() {
  const { isAdmin } = useRole()
  const [noPermModal, setNoPermModal] = useState({ open: false, action: '' })

  function requireAdmin(action, fn) {
    if (!isAdmin) { setNoPermModal({ open: true, action }); return }
    fn()
  }
  const [products, setProducts] = useState([])
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('stock') // 'stock' | 'movimientos'
  const [search, setSearch] = useState('')
  const [filterTipo, setFilterTipo] = useState('TODOS')

  // Stock Adjustment Modal
  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [adjustData, setAdjustData] = useState({
    productoId: '',
    tipo: 'Entrada',
    cantidad: '1',
    motivo: '',
  })

  // History Modal por producto
  const [historyProduct, setHistoryProduct] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData(showLoading = true) {
    if (showLoading) setLoading(true)
    try {
      const [resProds, resMovs] = await Promise.all([
        api.get('/productos?size=300'),
        api.get('/inventario/historial'),
      ])
      if (resProds.ok) {
        const prodData = await resProds.json()
        setProducts(prodData.content || prodData || [])
      }
      if (resMovs.ok) {
        const movData = await resMovs.json()
        setMovements(Array.isArray(movData) ? movData : [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  function openAdjustmentForProduct(prod) {
    requireAdmin('registrar movimientos de inventario', () => {
      setAdjustData({
        productoId: prod.id,
        tipo: 'Entrada',
        cantidad: '10',
        motivo: 'Reposición de mercadería',
      })
      setShowAdjustModal(true)
    })
  }

  async function handleSaveAdjustment(e) {
    e.preventDefault()
    if (!adjustData.productoId) return alert('Selecciona un producto')
    if (Number(adjustData.cantidad) <= 0) return alert('La cantidad debe ser mayor a cero')

    const tipoCapitalized =
      adjustData.tipo.charAt(0).toUpperCase() + adjustData.tipo.slice(1).toLowerCase()

    try {
      const payload = {
        productoId: adjustData.productoId,
        tipo: tipoCapitalized,
        cantidad: parseFloat(adjustData.cantidad),
        motivo: adjustData.motivo.trim() || 'Ajuste manual de inventario',
      }

      const res = await api.post('/inventario/movimiento', payload)
      if (res.ok) {
        const mov = await res.json()
        setShowAdjustModal(false)

        // Actualización inmediata en local (0ms lag)
        setProducts((prev) =>
          prev.map((p) => {
            if (p.id === adjustData.productoId) {
              const curr = Number(p.stock) || 0
              const cant = parseFloat(adjustData.cantidad) || 0
              let nextStock = curr
              if (tipoCapitalized === 'Entrada') nextStock = curr + cant
              else if (tipoCapitalized === 'Salida') nextStock = Math.max(0, curr - cant)
              else if (tipoCapitalized === 'Ajuste') nextStock = cant
              return { ...p, stock: nextStock }
            }
            return p
          })
        )

        if (mov && mov.id) {
          setMovements((prev) => [mov, ...prev])
        }

        // Sincronizar en segundo plano
        loadData(false)
      } else {
        try {
          const err = await res.json()
          alert(err.message || `Error al registrar el movimiento (${res.status})`)
        } catch {
          alert(`Error al registrar el movimiento (${res.status}: ${res.statusText || 'Error del servidor'})`)
        }
      }
    } catch (err) {
      console.error('Inventario error:', err)
      alert('Error de conexión al registrar movimiento')
    }
  }

  // Stock counts
  const lowStock = products.filter((p) => Number(p.stock) <= Number(p.stockMinimo) && Number(p.stock) > 0)
  const outOfStock = products.filter((p) => Number(p.stock) <= 0)

  const filteredProducts = products.filter((p) => {
    const q = search.toLowerCase()
    return (
      !q ||
      p.nombre.toLowerCase().includes(q) ||
      (p.codigoBarras && p.codigoBarras.toLowerCase().includes(q))
    )
  })

  const filteredMovements = movements.filter((m) => {
    const matchesTipo = filterTipo === 'TODOS' || m.tipo?.toUpperCase() === filterTipo.toUpperCase()
    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      (m.producto?.nombre && m.producto.nombre.toLowerCase().includes(q)) ||
      (m.motivo && m.motivo.toLowerCase().includes(q)) ||
      (m.usuario?.nombre && m.usuario.nombre.toLowerCase().includes(q))
    return matchesTipo && matchesSearch
  })

  return (
    <div className="page-content">
      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card kpi-blue">
          <div className="kpi-info">
            <span className="kpi-title">Total Artículos</span>
            <span className="kpi-value">{products.length}</span>
            <span className="kpi-sub">Referencias activas</span>
          </div>
          <div className="kpi-icon-wrapper">
            <IconInventory size={26} />
          </div>
        </div>

        <div className="kpi-card kpi-amber">
          <div className="kpi-info">
            <span className="kpi-title">Stock Bajo</span>
            <span className="kpi-value">{lowStock.length}</span>
            <span className="kpi-sub">Por debajo del mínimo</span>
          </div>
          <div className="kpi-icon-wrapper">
            <IconAlertTriangle size={24} />
          </div>
        </div>

        <div className="kpi-card kpi-rose">
          <div className="kpi-info">
            <span className="kpi-title">Agotados</span>
            <span className="kpi-value">{outOfStock.length}</span>
            <span className="kpi-sub">Sin existencias disponibles</span>
          </div>
          <div className="kpi-icon-wrapper">
            <IconBan size={24} />
          </div>
        </div>

        <div className="kpi-card kpi-emerald">
          <div className="kpi-info">
            <span className="kpi-title">Movimientos Registrados</span>
            <span className="kpi-value">{movements.length}</span>
            <span className="kpi-sub">Entradas / Salidas / Ajustes</span>
          </div>
          <div className="kpi-icon-wrapper">
            <IconRefresh size={24} />
          </div>
        </div>
      </div>

      {/* Tabs and Action Bar */}
      <div className="page-header-actions mt-4">
        <div className="flex gap-2">
          <button
            className={`btn ${activeTab === 'stock' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('stock')}
          >
            Existencias Actuales
          </button>
          <button
            className={`btn ${activeTab === 'movimientos' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('movimientos')}
          >
            Auditoría de Movimientos ({movements.length})
          </button>
        </div>

        <div className="flex gap-2">
          <div className="search-box">
            <IconSearch size={18} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Buscar producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="search-clear" onClick={() => setSearch('')}>
                ×
              </button>
            )}
          </div>

          <button
            className="btn btn-primary"
            onClick={() => requireAdmin('registrar movimientos de inventario', () => {
              setAdjustData({
                productoId: products[0]?.id || '',
                tipo: 'ENTRADA',
                cantidad: '1',
                motivo: 'Recepción de mercadería',
              })
              setShowAdjustModal(true)
            })}
          >
            <IconPlus size={18} /> Registrar Movimiento
          </button>

          <NoPermissionModal
            isOpen={noPermModal.open}
            onClose={() => setNoPermModal({ open: false, action: '' })}
            action={noPermModal.action}
          />
        </div>
      </div>

      {/* Tab 1: Current Stock */}
      {activeTab === 'stock' && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Existencias por Producto</h2>
            <p className="card-subtitle">Control de inventario en tiempo real con alertas de reposición</p>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="py-8 text-center text-muted">Cargando inventario...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">📦</span>
                <p>No se encontraron productos.</p>
              </div>
            ) : (
              <>
                <div className="table-responsive desktop-only-view">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Producto</th>
                        <th>Categoría</th>
                        <th>Stock Actual</th>
                        <th>Mínimo</th>
                        <th>Estado</th>
                        <th className="text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((p) => {
                        const isZero = Number(p.stock) <= 0
                        const isLow = Number(p.stock) <= Number(p.stockMinimo)
                        return (
                          <tr key={p.id}>
                            <td className="font-mono text-xs">{p.codigoBarras}</td>
                            <td className="font-semibold text-primary-dark">{p.nombre}</td>
                            <td>
                              <span className="badge badge-neutral">
                                {p.categoria?.nombre || 'General'}
                              </span>
                            </td>
                            <td className="font-bold text-base">
                              <span
                                className={
                                  isZero
                                    ? 'text-rose'
                                    : isLow
                                    ? 'text-amber'
                                    : 'text-emerald'
                                }
                              >
                                {p.stock} {p.unidadMedida}
                              </span>
                            </td>
                            <td>{p.stockMinimo} {p.unidadMedida}</td>
                            <td>
                              <span
                                className={`badge ${
                                  isZero
                                    ? 'badge-danger'
                                    : isLow
                                    ? 'badge-warning'
                                    : 'badge-success'
                                }`}
                              >
                                {isZero ? 'Agotado' : isLow ? 'Stock Bajo' : 'Adecuado'}
                              </span>
                            </td>
                            <td className="text-right">
                              <div className="flex justify-end gap-1">
                                <button
                                  className="btn-table btn-sm btn-secondary"
                                  onClick={() => setHistoryProduct(p)}
                                  title="Ver historial de movimientos"
                                >
                                  <IconHistory size={13} /> Historial
                                </button>
                                <button
                                  className="btn-table btn-sm btn-primary"
                                  onClick={() => openAdjustmentForProduct(p)}
                                  title="Ajustar o reponer stock"
                                >
                                  Reponer
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Vista Móvil: Tarjetas táctiles de existencias */}
                <div className="mobile-only-view">
                  {filteredProducts.map((p) => {
                    const isZero = Number(p.stock) <= 0
                    const isLow = Number(p.stock) <= Number(p.stockMinimo)
                    const badgeClass = isZero ? 'badge-danger' : isLow ? 'badge-warning' : 'badge-success'
                    return (
                      <div key={p.id} className="mobile-stock-audit-card">
                        <div className="mobile-stock-header">
                          <div>
                            <div className="font-semibold text-primary-dark">{p.nombre}</div>
                            <div className="text-xs text-muted font-mono">{p.codigoBarras} • {p.categoria?.nombre || 'General'}</div>
                          </div>
                          <span className={`badge ${badgeClass}`}>
                            {isZero ? 'Agotado' : isLow ? 'Stock Bajo' : 'Adecuado'}
                          </span>
                        </div>
                        <div className="mobile-stock-details">
                          <div>
                            <span className="text-xs text-muted block">Stock Actual</span>
                            <span className={`font-bold text-base ${isZero ? 'text-rose' : isLow ? 'text-amber' : 'text-emerald'}`}>
                              {p.stock} {p.unidadMedida}
                            </span>
                          </div>
                          <div>
                            <span className="text-xs text-muted block">Mínimo</span>
                            <span className="font-semibold text-sm text-secondary">
                              {p.stockMinimo} {p.unidadMedida}
                            </span>
                          </div>
                        </div>
                        <div className="mobile-stock-actions">
                          <button
                            className="btn btn-secondary btn-sm flex-1"
                            onClick={() => setHistoryProduct(p)}
                          >
                            <IconHistory size={14} /> Historial
                          </button>
                          <button
                            className="btn btn-primary btn-sm flex-1"
                            onClick={() => openAdjustmentForProduct(p)}
                          >
                            <IconPlus size={14} /> Reponer
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Movement History */}
      {activeTab === 'movimientos' && (
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <div>
              <h2 className="card-title">Registro Histórico de Movimientos</h2>
              <p className="card-subtitle">Entradas, salidas y ajustes manuales realizados en el almacén</p>
            </div>
            <div className="flex gap-2">
              {['TODOS', 'ENTRADA', 'SALIDA', 'AJUSTE'].map((t) => (
                <button
                  key={t}
                  className={`btn-sm btn ${filterTipo === t ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setFilterTipo(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="card-body">
            {loading ? (
              <div className="py-8 text-center text-muted">Cargando historial...</div>
            ) : filteredMovements.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">📝</span>
                <p>No se encontraron movimientos con los filtros seleccionados.</p>
              </div>
            ) : (
              <>
                <div className="table-responsive desktop-only-view">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Fecha / Hora</th>
                        <th>Tipo</th>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Motivo / Razón</th>
                        <th>Responsable</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMovements.map((m) => {
                        const tipoUpper = (m.tipo || '').toUpperCase()
                        const isEntrada = tipoUpper === 'ENTRADA'
                        const isSalida = tipoUpper === 'SALIDA'
                        const badgeClass = isEntrada
                          ? 'badge-success'
                          : isSalida
                          ? 'badge-danger'
                          : 'badge-warning'

                        return (
                          <tr key={m.id}>
                            <td className="text-xs text-muted whitespace-nowrap">
                              {new Date(m.fecha).toLocaleString('es-PE', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                            <td>
                              <span className={`badge ${badgeClass}`}>{m.tipo}</span>
                            </td>
                            <td className="font-semibold text-primary-dark">
                              {m.producto?.nombre || 'Producto'}
                            </td>
                            <td className="font-semibold whitespace-nowrap">
                              <span className={isEntrada ? 'text-emerald' : isSalida ? 'text-rose' : ''}>
                                {isEntrada ? '+' : isSalida ? '-' : '±'} {m.cantidad} {m.producto?.unidadMedida || ''}
                              </span>
                            </td>
                            <td className="text-secondary text-sm">{m.motivo || 'Sin motivo'}</td>
                            <td className="text-xs font-medium">{m.usuario?.nombre || 'Administrador'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Vista Móvil: Tarjetas táctiles de movimientos */}
                <div className="mobile-only-view">
                  {filteredMovements.map((m) => {
                    const tipoUpper = (m.tipo || '').toUpperCase()
                    const isEntrada = tipoUpper === 'ENTRADA'
                    const isSalida = tipoUpper === 'SALIDA'
                    const badgeClass = isEntrada ? 'badge-success' : isSalida ? 'badge-danger' : 'badge-warning'
                    return (
                      <div key={m.id} className="mobile-movement-card">
                        <div className="mobile-movement-top">
                          <span className={`badge ${badgeClass}`}>{m.tipo}</span>
                          <span className={`font-bold text-sm ${isEntrada ? 'text-emerald' : isSalida ? 'text-rose' : ''}`}>
                            {isEntrada ? '+' : isSalida ? '-' : '±'} {m.cantidad} {m.producto?.unidadMedida || ''}
                          </span>
                        </div>
                        <div className="font-semibold text-primary-dark mt-1">
                          {m.producto?.nombre || 'Producto'}
                        </div>
                        {m.motivo && <div className="text-xs text-secondary mt-1">{m.motivo}</div>}
                        <div className="mobile-movement-footer">
                          <span className="text-xs text-muted">
                            {new Date(m.fecha).toLocaleString('es-PE', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <span className="text-xs font-medium text-secondary">
                            {m.usuario?.nombre || 'Admin'}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal: Registrar Movimiento */}
      {showAdjustModal && (
        <div className="modal-overlay" onClick={() => setShowAdjustModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Registrar Movimiento de Inventario</h3>
                <p className="modal-subtitle">Ajuste de existencias por compra, merma o balance</p>
              </div>
              <button className="btn-close" onClick={() => setShowAdjustModal(false)}>
                <IconClose size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Producto *</label>
                  <select
                    className="form-select"
                    value={adjustData.productoId}
                    onChange={(e) => setAdjustData({ ...adjustData, productoId: e.target.value })}
                    required
                  >
                    <option value="">Selecciona un producto...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} (Stock actual: {p.stock} {p.unidadMedida})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Tipo de Movimiento *</label>
                    <select
                      className="form-select"
                      value={adjustData.tipo}
                      onChange={(e) => setAdjustData({ ...adjustData, tipo: e.target.value })}
                    >
                      <option value="Entrada">🟢 ENTRADA (Reposición / Compra)</option>
                      <option value="Salida">🔴 SALIDA (Merma / Descarte)</option>
                      <option value="Ajuste">🟡 AJUSTE (Conteo físico)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Cantidad *</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      className="form-input"
                      value={adjustData.cantidad}
                      onChange={(e) => setAdjustData({ ...adjustData, cantidad: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Motivo o Justificación *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={adjustData.motivo}
                    onChange={(e) => setAdjustData({ ...adjustData, motivo: e.target.value })}
                    required
                    placeholder="Ej. Compra factura F001-124, producto vencido, conteo de fin de mes..."
                  />
                </div>
              </div>

              <div className="modal-footer flex justify-between">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAdjustModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirmar Movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Historial de Movimientos por Producto */}
      {historyProduct && (
        <InventoryHistoryModal
          product={historyProduct}
          onClose={() => setHistoryProduct(null)}
        />
      )}
    </div>
  )
}
