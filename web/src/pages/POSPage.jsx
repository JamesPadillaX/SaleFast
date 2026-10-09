import React, { useState, useEffect, useRef } from 'react'
import { api } from '../api'
import { useAuth } from '../hooks/useAuth'
import {
  IconSearch,
  IconPlus,
  IconTrash,
  IconClose,
  IconDollar,
  IconPOS,
  IconProducts,
  IconBanknote,
  IconSmartphone,
  IconWallet,
  IconCreditCard,
  IconSales,
} from '../components/Icons'
import { formatDateTime } from '../utils/formatters'
import ConfirmModal from '../components/ConfirmModal'
import SuccessModal from '../components/SuccessModal'

export default function POSPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCat, setSelectedCat] = useState('ALL')

  // Cart & Payment
  const [cart, setCart] = useState([])
  const [paymentMethod, setPaymentMethod] = useState('Efectivo')
  const [montoRecibido, setMontoRecibido] = useState('')
  const [processing, setProcessing] = useState(false)
  const [mobileTab, setMobileTab] = useState('catalog') // 'catalog' | 'cart'

  // Receipt Modal
  const [completedSale, setCompletedSale] = useState(null)
  const searchInputRef = useRef(null)

  // Modales Armónicos para Vaciar Carrito
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [successModal, setSuccessModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    actionType: 'delete',
    detailItem: null,
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [resProds, resCats] = await Promise.all([
        api.get('/productos?size=300'),
        api.get('/categorias'),
      ])
      if (resProds.ok) {
        const prodData = await resProds.json()
        setProducts(prodData.content || prodData || [])
      }
      if (resCats.ok) {
        const catData = await resCats.json()
        setCategories(Array.isArray(catData) ? catData : [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  function addToCart(prod) {
    if (Number(prod.stock) <= 0) {
      alert(`El producto "${prod.nombre}" no tiene stock disponible.`)
      return
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.producto.id === prod.id)
      if (existing) {
        if (existing.cantidad >= Number(prod.stock)) {
          alert(`Has alcanzado el stock disponible (${prod.stock}) para este producto.`)
          return prev
        }
        return prev.map((item) =>
          item.producto.id === prod.id
            ? { ...item, cantidad: item.cantidad + 1, subtotal: (item.cantidad + 1) * Number(prod.precioVenta) }
            : item
        )
      } else {
        return [
          ...prev,
          {
            producto: prod,
            cantidad: 1,
            precioUnitario: Number(prod.precioVenta),
            subtotal: Number(prod.precioVenta),
          },
        ]
      }
    })
  }

  function updateQuantity(productId, delta) {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.producto.id === productId) {
            const newQty = item.cantidad + delta
            if (newQty <= 0) return null
            if (newQty > Number(item.producto.stock)) {
              alert(`Stock máximo disponible: ${item.producto.stock}`)
              return item
            }
            return {
              ...item,
              cantidad: newQty,
              subtotal: newQty * Number(item.producto.precioVenta),
            }
          }
          return item
        })
        .filter(Boolean)
    })
  }

  function removeFromCart(productId) {
    setCart((prev) => prev.filter((item) => item.producto.id !== productId))
  }

  function handleRequestClearCart() {
    if (cart.length === 0) return
    setShowClearConfirm(true)
  }

  function executeClearCart() {
    const totalItems = cart.reduce((a, b) => a + b.cantidad, 0)
    setCart([])
    setMontoRecibido('')
    setShowClearConfirm(false)
    setSuccessModal({
      isOpen: true,
      title: '¡Carrito Vaciado!',
      message: `Se han retirado los ${totalItems} artículos del ticket de venta.`,
      actionType: 'delete',
      detailItem: {
        title: 'Ticket en Blanco',
        badge: '0 items',
        subtitle: 'Listo para iniciar una nueva venta',
      },
    })
  }

  // Handle barcode scanner enter
  function handleSearchKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      const val = search.trim().toLowerCase()
      if (!val) return

      const match = products.find(
        (p) =>
          p.codigoBarras?.toLowerCase() === val ||
          p.nombre?.toLowerCase() === val
      )

      if (match) {
        addToCart(match)
        setSearch('')
      } else {
        alert(`No se encontró producto con código "${search}"`)
      }
    }
  }

  // Financial calculations
  const total = cart.reduce((acc, item) => acc + item.subtotal, 0)
  const subtotalNeto = total / 1.18
  const igv = total - subtotalNeto
  const vuelto = Number(montoRecibido) > total ? Number(montoRecibido) - total : 0

  async function handleCheckout() {
    if (cart.length === 0) return alert('El carrito está vacío')

    if (paymentMethod === 'Efectivo' && montoRecibido && Number(montoRecibido) < total) {
      return alert('El monto recibido es menor al total de la venta.')
    }

    setProcessing(true)
    try {
      const payload = {
        detalles: cart.map((item) => ({
          productoId: item.producto.id,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
        })),
        metodoPago: paymentMethod,
        montoRecibido: montoRecibido ? parseFloat(montoRecibido) : total,
      }

      const res = await api.post('/ventas', payload)
      if (res.ok) {
        const saleData = await res.json()
        const saleDate = saleData?.fecha || saleData?.fechaVenta || new Date().toISOString()
        setCompletedSale({
          ...saleData,
          fecha: saleDate,
          fechaVenta: saleDate,
          items: [...cart],
          total,
          subtotalNeto,
          igv,
          metodoPago: paymentMethod,
          montoRecibido: montoRecibido || total,
          vuelto,
          cajero: user?.nombre || 'Cajero',
        })
        setCart([])
        setMontoRecibido('')
        setPaymentMethod('Efectivo')
        setMobileTab('catalog')
        // Refresh product stock in background
        loadData()
      } else {
        try {
          const err = await res.json()
          alert(err.message || 'Error al procesar la venta')
        } catch {
          alert(`Error al procesar la venta (${res.status})`)
        }
      }
    } catch (err) {
      alert('Error de conexión al registrar la venta')
    } finally {
      setProcessing(false)
    }
  }

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCat === 'ALL' || String(p.categoria?.id) === String(selectedCat)
    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      p.nombre.toLowerCase().includes(q) ||
      (p.codigoBarras && p.codigoBarras.toLowerCase().includes(q))
    return matchesCat && matchesSearch && p.activo !== false
  })

    const cartItemCount = cart.reduce((a, b) => a + b.cantidad, 0)

    return (
    <div className="pos-layout">
      {/* Selector de pestañas para celulares y pantallas táctiles */}
      <div className="pos-mobile-tabs">
        <button
          type="button"
          className={`pos-mobile-tab-btn ${mobileTab === 'catalog' ? 'active' : ''}`}
          onClick={() => setMobileTab('catalog')}
        >
          <IconProducts size={18} />
          <span>Catálogo ({filteredProducts.length})</span>
        </button>
        <button
          type="button"
          className={`pos-mobile-tab-btn ${mobileTab === 'cart' ? 'active' : ''}`}
          onClick={() => setMobileTab('cart')}
        >
          <IconPOS size={18} />
          <span>Ticket ({cartItemCount})</span>
          {cartItemCount > 0 && (
            <span className="pos-tab-badge">S/ {total.toFixed(2)}</span>
          )}
        </button>
      </div>

      {/* Left Column: Product Selection */}
      <div className={`pos-catalog-panel ${mobileTab === 'catalog' ? 'panel-active' : 'panel-hidden'}`}>
        {/* Search Bar */}
        <div className="pos-search-wrapper">
          <div className="search-box">
            <IconSearch size={20} className="search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              className="search-input text-base"
              placeholder="Escanea el código de barras o escribe para buscar... (ENTER para añadir)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              autoFocus
            />
            {search && (
              <button className="search-clear" onClick={() => setSearch('')}>
                ×
              </button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="pos-category-pills">
          <button
            className={`pill-btn ${selectedCat === 'ALL' ? 'active' : ''}`}
            onClick={() => setSelectedCat('ALL')}
          >
            Todos ({products.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              className={`pill-btn ${selectedCat === String(c.id) ? 'active' : ''}`}
              onClick={() => setSelectedCat(String(c.id))}
            >
              {c.nombre}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="pos-grid-container">
          {loading ? (
            <div className="py-12 text-center text-muted">Cargando catálogo...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="empty-state py-8 text-center">
              <div className="flex justify-center mb-2 text-muted">
                <IconSearch size={32} />
              </div>
              <p>No se encontraron productos disponibles.</p>
            </div>
          ) : (
            <div className="pos-product-grid">
              {filteredProducts.map((p) => {
                const inCart = cart.find((item) => item.producto.id === p.id)
                const isOutOfStock = Number(p.stock) <= 0
                return (
                  <div
                    key={p.id}
                    className={`pos-product-card ${isOutOfStock ? 'disabled' : ''} ${
                      inCart ? 'selected' : ''
                    }`}
                    onClick={() => !isOutOfStock && addToCart(p)}
                  >
                    <div className="pos-prod-category">{p.categoria?.nombre || 'General'}</div>
                    <div className="pos-prod-name" title={p.nombre}>{p.nombre}</div>
                    <div className="pos-prod-code">{p.codigoBarras}</div>
                    <div className="pos-prod-footer">
                      <span className="pos-prod-price">S/ {Number(p.precioVenta).toFixed(2)}</span>
                      <span className={`pos-prod-stock ${isOutOfStock ? 'text-rose' : ''}`}>
                        Stock: {p.stock}
                      </span>
                    </div>
                    {inCart && (
                      <div className="pos-card-badge">
                        {inCart.cantidad}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Order Cart & Checkout */}
      <div className={`pos-cart-panel ${mobileTab === 'cart' ? 'panel-active' : 'panel-hidden'}`}>
        <div className="pos-cart-header">
          <div>
            <h2 className="pos-cart-title">Ticket de Venta</h2>
            <span className="text-xs text-muted">Artículos: {cart.reduce((a, b) => a + b.cantidad, 0)}</span>
          </div>
          {cart.length > 0 && (
            <button className="btn-table btn-sm text-rose" onClick={handleRequestClearCart}>
              Vaciar
            </button>
          )}
        </div>

        {/* Cart Item List */}
        <div className="pos-cart-items">
          {cart.length === 0 ? (
            <div className="pos-cart-empty">
              <IconPOS size={38} className="text-muted" />
              <p className="mt-2 text-sm text-secondary font-medium">El carrito está vacío</p>
              <small className="text-muted">Haz clic en un producto o escanea su código</small>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.producto.id} className="pos-cart-row">
                <div className="pos-row-info">
                  <div className="pos-row-name">{item.producto.nombre}</div>
                  <div className="pos-row-unit">
                    S/ {Number(item.precioUnitario).toFixed(2)} c/u
                  </div>
                </div>

                <div className="pos-row-qty-controls">
                  <button
                    className="qty-btn"
                    onClick={() => updateQuantity(item.producto.id, -1)}
                  >
                    -
                  </button>
                  <span className="qty-val">{item.cantidad}</span>
                  <button
                    className="qty-btn"
                    onClick={() => updateQuantity(item.producto.id, 1)}
                  >
                    +
                  </button>
                </div>

                <div className="pos-row-subtotal">
                  S/ {item.subtotal.toFixed(2)}
                </div>

                <button
                  className="pos-row-delete"
                  onClick={() => removeFromCart(item.producto.id)}
                  title="Eliminar"
                >
                  <IconTrash size={15} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Cart Totals & Checkout Actions */}
        <div className="pos-cart-footer">
          <div className="pos-totals-box">
            <div className="pos-total-line text-sm text-muted">
              <span>Subtotal Neto (sin IGV)</span>
              <span>S/ {subtotalNeto.toFixed(2)}</span>
            </div>
            <div className="pos-total-line text-sm text-muted">
              <span>IGV (18%)</span>
              <span>S/ {igv.toFixed(2)}</span>
            </div>
            <div className="pos-total-line pos-total-grand">
              <span>TOTAL A COBRAR</span>
              <span>S/ {total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="payment-methods-grid">
            {[
              { label: 'Efectivo', value: 'Efectivo', icon: IconBanknote },
              { label: 'Yape', value: 'Yape', icon: IconSmartphone },
              { label: 'Plin', value: 'Plin', icon: IconWallet },
              { label: 'Tarjeta', value: 'Tarjeta', icon: IconCreditCard },
            ].map((m) => {
              const Icon = m.icon
              return (
                <button
                  key={m.value}
                  type="button"
                  className={`payment-method-btn ${paymentMethod === m.value ? 'active' : ''}`}
                  onClick={() => setPaymentMethod(m.value)}
                >
                  <Icon size={16} />
                  <span>{m.label}</span>
                </button>
              )
            })}
          </div>

          {/* Cash Change Input */}
          {paymentMethod === 'Efectivo' && cart.length > 0 && (
            <div className="cash-tendered-box">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-secondary">Monto Recibido:</label>
                {vuelto > 0 && (
                  <span className="text-xs font-bold text-emerald">
                    Vuelto: S/ {vuelto.toFixed(2)}
                  </span>
                )}
              </div>
              <div className="input-prefix-wrapper">
                <span className="input-prefix">S/</span>
                <input
                  type="number"
                  step="0.1"
                  className="form-input pl-8"
                  placeholder={total.toFixed(2)}
                  value={montoRecibido}
                  onChange={(e) => setMontoRecibido(e.target.value)}
                />
              </div>
            </div>
          )}

          <button
            className="btn btn-primary btn-block btn-lg pos-checkout-btn"
            disabled={cart.length === 0 || processing}
            onClick={handleCheckout}
          >
            {processing ? 'Emitiendo Ticket...' : `Cobrar S/ ${total.toFixed(2)}`}
          </button>
        </div>
      </div>

      {/* Barra Flotante de Carrito en Celular */}
      {cart.length > 0 && mobileTab === 'catalog' && (
        <div className="pos-floating-cart-bar" onClick={() => setMobileTab('cart')}>
          <div className="floating-cart-left">
            <span className="floating-cart-icon">
              <IconPOS size={22} />
            </span>
            <div>
              <div className="floating-cart-title">{cartItemCount} {cartItemCount === 1 ? 'producto' : 'productos'}</div>
              <div className="floating-cart-total">Total: S/ {total.toFixed(2)}</div>
            </div>
          </div>
          <button type="button" className="floating-cart-btn">
            Ver Ticket y Cobrar →
          </button>
        </div>
      )}

      {/* Sale Complete & Printable Ticket Modal */}
      {completedSale && (
        <div className="modal-overlay" onClick={() => setCompletedSale(null)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 380 }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">¡Venta Exitosa!</h3>
                <p className="modal-subtitle">Ticket emitido correctamente</p>
              </div>
              <button className="btn-close" onClick={() => setCompletedSale(null)}>
                <IconClose size={20} />
              </button>
            </div>

            <div className="modal-body">
              {/* Receipt Ticket Preview */}
              <div className="receipt-ticket">
                <div className="receipt-header">
                  <h3>SALE FAST POS</h3>
                  <p>Minimarket & Abarrotes</p>
                  <p className="font-mono text-xs">RUC: 20601234567</p>
                  <p className="text-xs">Ticket: #{String(completedSale.id || '001').padStart(6, '0')}</p>
                  <p className="text-xs font-semibold">{formatDateTime(completedSale.fecha || completedSale.fechaVenta)}</p>
                </div>

                <div className="receipt-divider" />

                <div className="receipt-items">
                  {completedSale.items.map((item, i) => (
                    <div key={i} className="receipt-row">
                      <span className="receipt-item-name">
                        {item.cantidad}x {item.producto.nombre}
                      </span>
                      <span className="receipt-item-price">
                        S/ {item.subtotal.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="receipt-divider" />

                <div className="receipt-totals">
                  <div className="receipt-row font-bold text-base">
                    <span>TOTAL:</span>
                    <span>S/ {completedSale.total.toFixed(2)}</span>
                  </div>
                  <div className="receipt-row text-xs text-muted">
                    <span>Método:</span>
                    <span>{completedSale.metodoPago}</span>
                  </div>
                  {completedSale.metodoPago === 'Efectivo' && (
                    <>
                      <div className="receipt-row text-xs text-muted">
                        <span>Recibido:</span>
                        <span>S/ {Number(completedSale.montoRecibido).toFixed(2)}</span>
                      </div>
                      <div className="receipt-row text-xs font-semibold">
                        <span>Vuelto:</span>
                        <span>S/ {Number(completedSale.vuelto).toFixed(2)}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="receipt-footer">
                  <p>Atendido por: {completedSale.cajero}</p>
                  <p>¡Gracias por su compra!</p>
                </div>
              </div>
            </div>

            <div className="modal-footer flex justify-between">
              <button className="btn btn-secondary" onClick={() => setCompletedSale(null)}>
                Cerrar
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  window.print()
                }}
              >
                <IconSales size={16} />
                <span>Imprimir Ticket</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Armónico de Confirmación para Vaciar Carrito */}
      <ConfirmModal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={executeClearCart}
        type="danger"
        icon={<IconTrash size={28} />}
        title="¿Vaciar el carrito de venta?"
        message="Se removerán todos los productos agregados al ticket actual. Esta acción no se puede deshacer."
        detailItem={{
          title: `${cart.reduce((a, b) => a + b.cantidad, 0)} artículos en orden`,
          badge: `S/ ${total.toFixed(2)}`,
          subtitle: `${cart.length} productos diferentes en el carrito`,
        }}
        confirmText="Sí, vaciar carrito"
        cancelText="Conservar artículos"
      />

      {/* Modal Armónico de Animación de Éxito al Vaciar */}
      <SuccessModal
        isOpen={successModal.isOpen}
        onClose={() => setSuccessModal((prev) => ({ ...prev, isOpen: false }))}
        title={successModal.title}
        message={successModal.message}
        actionType={successModal.actionType}
        detailItem={successModal.detailItem}
      />
    </div>
  )
}
