import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import {
  IconPOS,
  IconProducts,
  IconSales,
  IconInventory,
  IconDollar,
  IconPlus,
  IconRefresh,
  IconClose,
  IconTrendingUp,
  IconCreditCard,
  IconSmartphone,
  IconBanknote,
  IconWallet,
  IconChevronRight,
  IconAlertTriangle,
} from '../components/Icons'
import { formatDateTime, parseDate } from '../utils/formatters'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalVentasHoy: 0,
    numVentasHoy: 0,
    ticketPromedio: 0,
    ventasMes: 0,
    totalProductos: 0,
    bajoStockCount: 0,
    bajoStockList: [],
    ultimasVentas: [],
    topVendidos: [],
    metodosPago: {
      Efectivo: 0,
      Yape: 0,
      Plin: 0,
      Tarjeta: 0,
    },
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedSale, setSelectedSale] = useState(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData(showLoading = true) {
    if (showLoading) setLoading(true)
    setRefreshing(true)

    try {
      // 1 sola petición ultra optimizada con todos los datos calculados en base de datos
      const res = await api.get('/reportes/dashboard')
      if (res.ok) {
        const dashData = await res.json()

        const finalVentasHoy = Number(dashData?.ventasDia || 0)
        const finalNumVentas = Number(dashData?.numVentasDia || 0)
        const ticketPromedio = Number(dashData?.ticketPromedio || (finalNumVentas > 0 ? finalVentasHoy / finalNumVentas : 0))

        const breakdown = {
          Efectivo: Number(dashData?.metodosPago?.Efectivo || 0),
          Yape: Number(dashData?.metodosPago?.Yape || 0),
          Plin: Number(dashData?.metodosPago?.Plin || 0),
          Tarjeta: Number(dashData?.metodosPago?.Tarjeta || 0),
        }

        const listUltimas = Array.isArray(dashData?.ultimasVentas) ? dashData.ultimasVentas : []
        const topProds = Array.isArray(dashData?.productosMasVendidos) ? dashData.productosMasVendidos : []
        const bajoStock = Array.isArray(dashData?.bajoStockList) ? dashData.bajoStockList : []

        setStats({
          totalVentasHoy: finalVentasHoy,
          numVentasHoy: finalNumVentas,
          ticketPromedio,
          ventasMes: Number(dashData?.ventasMes || finalVentasHoy),
          totalProductos: Number(dashData?.productosRegistrados || 0),
          bajoStockCount: Number(dashData?.productosBajoStock || bajoStock.length || 0),
          bajoStockList: bajoStock.slice(0, 6),
          ultimasVentas: listUltimas.slice(0, 6),
          topVendidos: topProds.slice(0, 5),
          metodosPago: breakdown,
        })
      }
    } catch (e) {
      console.error('Error loading dashboard:', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const hoyFormatted = new Date().toLocaleDateString('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="page-content dashboard-page">
      {/* Header del Dashboard */}
      <div className="dashboard-header flex justify-between items-center mb-4 flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="dashboard-welcome-title">Panel de Control General</h2>
            <span className="live-status-pill">
              <span className="live-dot" /> Sistema en Línea
            </span>
          </div>
          <p className="text-xs text-muted mt-1 capitalize">{hoyFormatted}</p>
        </div>

        <button
          className="btn btn-secondary btn-sm"
          onClick={() => loadDashboardData(false)}
          disabled={refreshing}
          title="Actualizar datos"
        >
          <IconRefresh size={15} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      {/* Tarjetas KPI Principales */}
      <div className="kpi-grid">
        {/* KPI 1: Ventas de Hoy */}
        <div className="kpi-card kpi-blue">
          <div className="kpi-info">
            <span className="kpi-title">Ventas de Hoy</span>
            <span className="kpi-value text-primary">S/ {Number(stats.totalVentasHoy).toFixed(2)}</span>
            <div className="kpi-badge-sub text-emerald">
              <IconTrendingUp size={13} />
              <span>{stats.numVentasHoy} {stats.numVentasHoy === 1 ? 'ticket emitido' : 'tickets hoy'}</span>
            </div>
          </div>
          <div className="kpi-icon-wrapper">
            <IconDollar size={24} />
          </div>
        </div>

        {/* KPI 2: Operaciones Realizadas */}
        <div className="kpi-card kpi-emerald">
          <div className="kpi-info">
            <span className="kpi-title">Operaciones Realizadas</span>
            <span className="kpi-value">{stats.numVentasHoy}</span>
            <span className="kpi-sub">
              Ticket Promedio: <strong>S/ {Number(stats.ticketPromedio).toFixed(2)}</strong>
            </span>
          </div>
          <div className="kpi-icon-wrapper">
            <IconSales size={24} />
          </div>
        </div>

        {/* KPI 3: Catálogo Activo */}
        <div className="kpi-card kpi-cyan">
          <div className="kpi-info">
            <span className="kpi-title">Productos en Catálogo</span>
            <span className="kpi-value">{stats.totalProductos}</span>
            <span className="kpi-sub">Artículos disponibles en almacén</span>
          </div>
          <div className="kpi-icon-wrapper">
            <IconProducts size={24} />
          </div>
        </div>

        {/* KPI 4: Alertas de Stock */}
        <div className={`kpi-card ${stats.bajoStockCount > 0 ? 'kpi-rose' : 'kpi-neutral'}`}>
          <div className="kpi-info">
            <span className="kpi-title">Stock Crítico</span>
            <span className="kpi-value">{stats.bajoStockCount}</span>
            <span className="kpi-sub">
              {stats.bajoStockCount > 0
                ? 'Requieren reposición inmediata'
                : 'Existencias en orden'}
            </span>
          </div>
          <div className="kpi-icon-wrapper">
            <IconInventory size={24} />
          </div>
        </div>
      </div>

      {/* Desglose de Métodos de Pago del Día */}
      <div className="payment-breakdown-card mb-6">
        <div className="payment-breakdown-header">
          <h3 className="section-subtitle mb-0">Flujo de Ingresos por Método de Pago (Hoy)</h3>
          <span className="text-xs text-muted font-medium">Total: S/ {Number(stats.totalVentasHoy).toFixed(2)}</span>
        </div>
        <div className="payment-breakdown-grid">
          <div className="payment-pill-card pill-cash">
            <div className="payment-pill-top">
              <IconBanknote size={17} />
              <span className="payment-pill-name">Efectivo</span>
            </div>
            <div className="payment-pill-amount">
              S/ {Number(stats.metodosPago?.Efectivo || 0).toFixed(2)}
            </div>
          </div>

          <div className="payment-pill-card pill-yape">
            <div className="payment-pill-top">
              <IconSmartphone size={17} />
              <span className="payment-pill-name">Yape</span>
            </div>
            <div className="payment-pill-amount">
              S/ {Number(stats.metodosPago?.Yape || 0).toFixed(2)}
            </div>
          </div>

          <div className="payment-pill-card pill-plin">
            <div className="payment-pill-top">
              <IconWallet size={17} />
              <span className="payment-pill-name">Plin</span>
            </div>
            <div className="payment-pill-amount">
              S/ {Number(stats.metodosPago?.Plin || 0).toFixed(2)}
            </div>
          </div>

          <div className="payment-pill-card pill-card">
            <div className="payment-pill-top">
              <IconCreditCard size={17} />
              <span className="payment-pill-name">Tarjeta</span>
            </div>
            <div className="payment-pill-amount">
              S/ {Number(stats.metodosPago?.Tarjeta || 0).toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Accesos Rápidos */}
      <div className="quick-actions-bar mb-6">
        <h3 className="section-subtitle">Accesos Rápidos</h3>
        <div className="quick-buttons">
          <Link to="/pos" className="btn btn-primary">
            <IconPOS size={18} /> Iniciar Cobro POS
          </Link>
          <Link to="/productos" className="btn btn-secondary">
            <IconPlus size={18} /> Nuevo Producto
          </Link>
          <Link to="/inventario" className="btn btn-secondary">
            <IconInventory size={18} /> Movimientos de Stock
          </Link>
          <Link to="/ventas" className="btn btn-secondary">
            <IconSales size={18} /> Historial de Ventas
          </Link>
        </div>
      </div>

      {/* Grid de 2 Columnas: Últimas Transacciones y Stock / Más Vendidos */}
      <div className="dashboard-columns">
        {/* Columna 1: Últimas Transacciones */}
        <div className="card dashboard-card">
          <div className="card-header flex justify-between items-center">
            <div>
              <div className="card-title-icon">
                <IconSales size={18} className="text-primary" />
                <span>Últimas Transacciones</span>
              </div>
              <p className="card-subtitle">Tickets emitidos recientemente</p>
            </div>
            <Link to="/ventas" className="btn-link-pill">
              <span>Ver todas</span>
              <IconChevronRight size={13} />
            </Link>
          </div>

          <div className="card-body">
            {loading ? (
              <div className="py-8 text-center text-muted">Cargando transacciones...</div>
            ) : stats.ultimasVentas.length === 0 ? (
              <div className="empty-state py-8 text-center">
                <p className="text-sm text-secondary">Aún no se registran transacciones el día de hoy.</p>
                <Link to="/pos" className="btn btn-primary btn-sm mt-3 inline-flex">
                  Hacer primera venta
                </Link>
              </div>
            ) : (
              <>
                {/* Vista Desktop: Tabla tradicional */}
                <div className="table-responsive desktop-only-view">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Ticket</th>
                        <th>Fecha y Hora</th>
                        <th>Método</th>
                        <th>Total</th>
                        <th className="text-right">Detalle</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.ultimasVentas.map((v) => {
                        const metodo = v.metodoPago || 'Efectivo'
                        let badgeClass = 'badge-success'
                        if (metodo === 'Yape') badgeClass = 'badge-purple'
                        else if (metodo === 'Plin') badgeClass = 'badge-info'
                        else if (metodo === 'Tarjeta') badgeClass = 'badge-primary'

                        return (
                          <tr key={v.id}>
                            <td className="font-mono font-semibold text-primary">
                              #{String(v.id).substring(0, 8)}
                            </td>
                            <td className="text-xs text-muted whitespace-nowrap">
                              {formatDateTime(v.fecha || v.fechaVenta)}
                            </td>
                            <td>
                              <span className={`badge ${badgeClass}`}>{metodo}</span>
                            </td>
                            <td className="font-bold text-primary-dark">
                              S/ {Number(v.total).toFixed(2)}
                            </td>
                            <td className="text-right">
                              <button
                                className="btn-table btn-sm btn-primary"
                                onClick={() => setSelectedSale(v)}
                              >
                                Ver Ticket
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Vista Móvil: Tarjetas táctiles y ordenadas */}
                <div className="mobile-only-view">
                  {stats.ultimasVentas.map((v) => {
                    const metodo = v.metodoPago || 'Efectivo'
                    let badgeClass = 'badge-success'
                    if (metodo === 'Yape') badgeClass = 'badge-purple'
                    else if (metodo === 'Plin') badgeClass = 'badge-info'
                    else if (metodo === 'Tarjeta') badgeClass = 'badge-primary'

                    return (
                      <div key={v.id} className="mobile-tx-card">
                        <div className="mobile-tx-row-top">
                          <div className="mobile-tx-meta">
                            <span className="mobile-tx-id">#{String(v.id).substring(0, 8)}</span>
                            <span className={`badge ${badgeClass}`}>{metodo}</span>
                          </div>
                          <div className="mobile-tx-amount">
                            S/ {Number(v.total).toFixed(2)}
                          </div>
                        </div>
                        <div className="mobile-tx-row-bottom">
                          <span className="mobile-tx-date">
                            {formatDateTime(v.fecha || v.fechaVenta)}
                          </span>
                          <button
                            className="mobile-tx-btn"
                            onClick={() => setSelectedSale(v)}
                          >
                            <span>Ver Ticket</span>
                            <IconChevronRight size={13} />
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

        {/* Columna 2: Stock Crítico & Productos Más Vendidos */}
        <div className="dashboard-right-stack flex flex-col gap-4">
          {/* Card: Stock Bajo */}
          <div className="card dashboard-card">
            <div className="card-header flex justify-between items-center">
              <div>
                <div className="card-title-icon">
                  <IconAlertTriangle size={18} className="text-amber" />
                  <span>Productos con Bajo Stock</span>
                </div>
                <p className="card-subtitle">Artículos próximos a agotarse</p>
              </div>
              <Link to="/inventario" className="btn-link-pill">
                <span>Gestionar inventario</span>
                <IconChevronRight size={13} />
              </Link>
            </div>

            <div className="card-body">
              {stats.bajoStockList.length === 0 ? (
                <div className="empty-state py-6 text-center">
                  <p className="text-sm text-secondary">Todos los productos cuentan con existencias adecuadas.</p>
                </div>
              ) : (
                <>
                  {/* Vista Desktop: Tabla tradicional */}
                  <div className="table-responsive desktop-only-view">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Producto</th>
                          <th>Stock Actual</th>
                          <th>Mínimo</th>
                          <th>Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.bajoStockList.map((prod) => (
                          <tr key={prod.id}>
                            <td className="font-semibold text-secondary">
                              <div>{prod.nombre}</div>
                              <small className="text-muted">{prod.categoria?.nombre || 'General'}</small>
                            </td>
                            <td>
                              <span className="badge badge-danger">
                                {prod.stock} {prod.unidadMedida}
                              </span>
                            </td>
                            <td className="text-xs text-muted font-mono">
                              {prod.stockMinimo} {prod.unidadMedida}
                            </td>
                            <td>
                              <Link to="/inventario" className="btn-table btn-sm btn-primary">
                                Reponer
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Vista Móvil: Tarjetas táctiles y ordenadas */}
                  <div className="mobile-only-view">
                    {stats.bajoStockList.map((prod) => (
                      <div key={prod.id} className="mobile-stock-card">
                        <div className="mobile-stock-info">
                          <div className="mobile-stock-name">{prod.nombre}</div>
                          <div className="mobile-stock-meta">
                            <span>{prod.categoria?.nombre || 'General'}</span>
                          </div>
                          <div className="mobile-stock-badges">
                            <span className="badge badge-danger">
                              Stock: {prod.stock} {prod.unidadMedida}
                            </span>
                            <span className="text-xs text-muted">
                              (Mín: {prod.stockMinimo})
                            </span>
                          </div>
                        </div>
                        <div className="mobile-stock-action">
                          <Link to="/inventario" className="btn btn-sm btn-primary">
                            Reponer
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Card: Productos Más Vendidos */}
          {stats.topVendidos.length > 0 && (
            <div className="card dashboard-card">
              <div className="card-header">
                <div className="card-title-icon">
                  <IconTrendingUp size={18} className="text-primary" />
                  <span>Productos con Mayor Rotación</span>
                </div>
                <p className="card-subtitle">Artículos con mayor demanda en tienda</p>
              </div>
              <div className="card-body p-3">
                <div className="top-products-list">
                  {stats.topVendidos.map((item, idx) => {
                    return (
                      <div key={idx} className="top-product-item">
                        <span className={`top-rank-badge top-rank-${idx + 1}`}>
                          #{idx + 1}
                        </span>
                        <div className="top-product-info flex-1 min-w-0">
                          <div className="top-product-name truncate font-semibold text-sm">
                            {item.producto}
                          </div>
                          <div className="top-product-bar-wrapper mt-1">
                            <div
                              className="top-product-bar"
                              style={{
                                width: `${Math.min(100, (Number(item.cantidad) / Number(stats.topVendidos[0]?.cantidad || 1)) * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                        <span className="top-product-qty badge badge-primary font-bold">
                          {Number(item.cantidad)} unid.
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Detalle de Ticket desde el Dashboard */}
      {selectedSale && (
        <div className="modal-overlay" onClick={() => setSelectedSale(null)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">
                  Ticket #{String(selectedSale.id).substring(0, 8)}
                </h3>
                <p className="modal-subtitle">
                  {formatDateTime(selectedSale.fecha || selectedSale.fechaVenta)}
                </p>
              </div>
              <button className="btn-close" onClick={() => setSelectedSale(null)}>
                <IconClose size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="receipt-ticket">
                <div className="receipt-header">
                  <h3>SALE FAST POS</h3>
                  <p>Minimarket & Abarrotes</p>
                  <p className="font-mono text-xs">RUC: 20601234567</p>
                  <p className="text-xs">Ticket: #{String(selectedSale.id).substring(0, 8)}</p>
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
                    <div className="text-center py-2 text-xs text-muted">
                      Total de la orden: S/ {Number(selectedSale.total).toFixed(2)}
                    </div>
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
                </div>

                <div className="receipt-footer">
                  <p>Atendido por: {selectedSale.usuario?.nombre || 'Cajero'}</p>
                  <p>¡Gracias por su preferencia!</p>
                </div>
              </div>
            </div>

            <div className="modal-footer flex justify-between">
              <button className="btn btn-secondary" onClick={() => setSelectedSale(null)}>
                Cerrar
              </button>
              <button
                className="btn btn-primary"
                onClick={() => window.print()}
              >
                Imprimir Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
