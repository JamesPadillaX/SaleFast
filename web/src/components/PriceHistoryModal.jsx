import React, { useState, useEffect } from 'react'
import { IconClose, IconDollar } from './Icons'

export default function PriceHistoryModal({ product, onClose, onPriceUpdated }) {
  if (!product) return null

  const pCompra = Number(product.precioCompra) || 0
  const pVenta = Number(product.precioVenta) || 0
  const margen = pVenta - pCompra
  const margenPct = pVenta > 0 ? ((margen / pVenta) * 100).toFixed(1) : '0.0'
  const stock = Number(product.stock) || 0

  // Retrieve stored history or generate baseline
  const historyKey = `price_history_${product.id}`
  const [history, setHistory] = useState(() => {
    try {
      const stored = localStorage.getItem(historyKey)
      if (stored) return JSON.parse(stored)
    } catch {}
    return [
      {
        fecha: product.fechaCreacion || new Date().toISOString(),
        precioCompra: pCompra,
        precioVenta: pVenta,
        motivo: 'Registro inicial del producto',
      },
    ]
  })

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Historial de Precios & Rentabilidad</h3>
            <p className="modal-subtitle">{product.nombre} (COD: {product.codigoBarras})</p>
          </div>
          <button className="btn-close" onClick={onClose}>
            <IconClose size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Financial Breakdown Cards */}
          <div className="kpi-mini-grid">
            <div className="kpi-mini-card">
              <span className="kpi-mini-label">Precio Inicial / Costo</span>
              <span className="kpi-mini-val text-muted">S/ {pCompra.toFixed(2)}</span>
            </div>
            <div className="kpi-mini-card">
              <span className="kpi-mini-label">Precio de Venta</span>
              <span className="kpi-mini-val text-primary font-bold">S/ {pVenta.toFixed(2)}</span>
            </div>
            <div className="kpi-mini-card">
              <span className="kpi-mini-label">Margen Unitario</span>
              <span className="kpi-mini-val text-emerald font-bold">S/ {margen.toFixed(2)}</span>
              <span className="kpi-mini-sub">{margenPct}% margen</span>
            </div>
          </div>

          <div className="inventory-valuation-box mt-4">
            <div className="flex justify-between items-center text-sm py-1 border-b">
              <span className="text-secondary">Stock actual:</span>
              <span className="font-semibold">{stock} {product.unidadMedida}</span>
            </div>
            <div className="flex justify-between items-center text-sm py-1 border-b">
              <span className="text-secondary">Inversión total a costo:</span>
              <span className="font-semibold">S/ {(stock * pCompra).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm py-1 border-b">
              <span className="text-secondary">Retorno esperado a venta:</span>
              <span className="font-semibold text-primary">S/ {(stock * pVenta).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm py-1">
              <span className="text-secondary">Ganancia bruta proyectada:</span>
              <span className="font-semibold text-emerald">S/ {(stock * margen).toFixed(2)}</span>
            </div>
          </div>

          {/* Historical Log */}
          <h4 className="font-semibold text-sm mt-5 mb-2">Registro de Precios:</h4>
          <div className="history-table-container">
            <table className="data-table data-table-sm">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Precio Costo</th>
                  <th>Precio Venta</th>
                  <th>Margen</th>
                  <th>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, idx) => {
                  const m = Number(h.precioVenta) - Number(h.precioCompra)
                  return (
                    <tr key={idx}>
                      <td className="text-xs text-muted">
                        {new Date(h.fecha).toLocaleDateString('es-PE', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td>S/ {Number(h.precioCompra).toFixed(2)}</td>
                      <td className="font-semibold">S/ {Number(h.precioVenta).toFixed(2)}</td>
                      <td className="text-emerald font-semibold">+S/ {m.toFixed(2)}</td>
                      <td className="text-xs text-muted">{h.motivo}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="modal-footer flex justify-end">
          <button className="btn btn-primary" onClick={onClose}>
            Entendido
          </button>
        </div>
      </div>
    </div>
  )
}
