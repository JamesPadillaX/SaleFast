import React, { useState, useEffect } from 'react'
import { api } from '../api'
import {
  IconSearch,
  IconPlus,
  IconEdit,
  IconTrash,
  IconQr,
  IconHistory,
  IconDollar,
  IconClose,
  IconCamera,
  IconBarcode,
} from '../components/Icons'
import QRCodeModal from '../components/QRCodeModal'
import PriceHistoryModal from '../components/PriceHistoryModal'
import InventoryHistoryModal from '../components/InventoryHistoryModal'
import ConfirmModal from '../components/ConfirmModal'
import SuccessModal from '../components/SuccessModal'
import Toast from '../components/Toast'
import BarcodeScannerModal from '../components/BarcodeScannerModal'

export default function ProductosPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCat, setSelectedCat] = useState('ALL')

  // Modals state
  const [showFormModal, setShowFormModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [selectedQrProduct, setSelectedQrProduct] = useState(null)
  const [selectedPriceHistoryProduct, setSelectedPriceHistoryProduct] = useState(null)
  const [selectedInventoryHistoryProduct, setSelectedInventoryHistoryProduct] = useState(null)
  const [showScannerModal, setShowScannerModal] = useState(false)

  // Animated Confirmation Modals & Action States
  const [productToDelete, setProductToDelete] = useState(null)
  const [showAddConfirm, setShowAddConfirm] = useState(false)
  const [showEditConfirm, setShowEditConfirm] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Animación de Check (Success Modal)
  const [successModal, setSuccessModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    actionType: 'add',
    detailItem: null,
  })

  // Toast feedback state
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'success' })

  // Form fields
  const [formData, setFormData] = useState({
    codigoBarras: '',
    nombre: '',
    categoriaId: '',
    descripcion: '',
    precioCompra: '',
    precioVenta: '',
    stock: '',
    stockMinimo: '5',
    unidadMedida: 'unidad',
    imagenUrl: '',
    activo: true,
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData(showLoading = true) {
    if (showLoading) setLoading(true)
    try {
      const [resProds, resCats] = await Promise.all([
        api.get('/productos?size=300'),
        api.get('/categorias'),
      ])

      if (resProds.ok) {
        const data = await resProds.json()
        setProducts(data.content || data || [])
      }
      if (resCats.ok) {
        const catData = await resCats.json()
        setCategories(Array.isArray(catData) ? catData : [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  function openCreateModal() {
    setEditingProduct(null)
    setFormData({
      codigoBarras: 'PROD-' + Math.floor(100000 + Math.random() * 900000),
      nombre: '',
      categoriaId: categories[0]?.id || '',
      descripcion: '',
      precioCompra: '',
      precioVenta: '',
      stock: '0',
      stockMinimo: '5',
      unidadMedida: 'unidad',
      imagenUrl: '',
      activo: true,
    })
    setShowFormModal(true)
  }

  function openEditModal(prod) {
    setEditingProduct(prod)
    setFormData({
      codigoBarras: prod.codigoBarras || '',
      nombre: prod.nombre || '',
      categoriaId: prod.categoria?.id || categories[0]?.id || '',
      descripcion: prod.descripcion || '',
      precioCompra: prod.precioCompra || '',
      precioVenta: prod.precioVenta || '',
      stock: prod.stock || '0',
      stockMinimo: prod.stockMinimo || '5',
      unidadMedida: prod.unidadMedida || 'unidad',
      imagenUrl: prod.imagenUrl || '',
      activo: prod.activo !== false,
    })
    setShowFormModal(true)
  }

  function handleFormSubmit(e) {
    e.preventDefault()
    if (!formData.nombre.trim()) return alert('El nombre es obligatorio')
    if (!formData.codigoBarras.trim()) return alert('El código de barras es obligatorio')

    if (editingProduct) {
      setShowEditConfirm(true)
    } else {
      setShowAddConfirm(true)
    }
  }

  async function executeSaveProduct() {
    setIsSaving(true)
    const selectedCategory =
      categories.find((c) => String(c.id) === String(formData.categoriaId)) || categories[0]

    const payload = {
      codigoBarras: formData.codigoBarras.trim(),
      nombre: formData.nombre.trim(),
      categoria: selectedCategory,
      descripcion: formData.descripcion.trim(),
      precioCompra: parseFloat(formData.precioCompra) || 0,
      precioVenta: parseFloat(formData.precioVenta) || 0,
      stock: editingProduct ? (parseFloat(formData.stock) || 0) : 0,
      stockMinimo: parseFloat(formData.stockMinimo) || 0,
      unidadMedida: formData.unidadMedida,
      imagenUrl: formData.imagenUrl.trim() || null,
      activo: formData.activo,
    }

    try {
      let res
      if (editingProduct) {
        // Track price changes in localStorage
        if (
          Number(editingProduct.precioCompra) !== Number(payload.precioCompra) ||
          Number(editingProduct.precioVenta) !== Number(payload.precioVenta)
        ) {
          const histKey = `price_history_${editingProduct.id}`
          const prevHist = JSON.parse(localStorage.getItem(histKey) || '[]')
          prevHist.unshift({
            fecha: new Date().toISOString(),
            precioCompra: payload.precioCompra,
            precioVenta: payload.precioVenta,
            motivo: 'Actualización de precio por administrador',
          })
          localStorage.setItem(histKey, JSON.stringify(prevHist))
        }

        res = await api.put(`/productos/${editingProduct.id}`, payload)
      } else {
        res = await api.post('/productos', payload)
      }

      if (res.ok) {
        const savedProd = await res.json()
        const fullProd = {
          ...payload,
          ...savedProd,
          categoria: savedProd.categoria || selectedCategory,
        }

        const isEdit = !!editingProduct

        // Immediate state update (0ms UI lag)
        if (isEdit) {
          setProducts((prev) => prev.map((p) => (p.id === fullProd.id ? fullProd : p)))
        } else {
          setProducts((prev) => [fullProd, ...prev.filter((p) => p.id !== fullProd.id)])
        }

        setShowAddConfirm(false)
        setShowEditConfirm(false)
        setShowFormModal(false)

        setSuccessModal({
          isOpen: true,
          title: isEdit ? '¡Producto Actualizado!' : '¡Producto Registrado!',
          message: isEdit
            ? `El producto "${payload.nombre}" se actualizó correctamente en la base de datos.`
            : `El producto "${payload.nombre}" fue registrado exitosamente.`,
          actionType: isEdit ? 'edit' : 'add',
          detailItem: {
            title: payload.nombre,
            badge: `S/ ${Number(payload.precioVenta).toFixed(2)}`,
            subtitle: `Código: ${payload.codigoBarras} • Stock: ${payload.stock} ${payload.unidadMedida}`,
          },
        })

        // Reconcile in background without locking UI
        loadData(false)
      } else {
        try {
          const err = await res.json()
          alert(err.message || 'Error al guardar producto')
        } catch {
          alert(`Error al guardar producto (${res.status}: ${res.statusText || 'Error del servidor'})`)
        }
      }
    } catch (err) {
      alert('Error al conectar con el servidor')
    } finally {
      setIsSaving(false)
    }
  }

  async function executeDeleteProduct() {
    if (!productToDelete) return
    setIsDeleting(true)
    try {
      const res = await api.delete(`/productos/${productToDelete.id}`)
      if (res.ok) {
        const deletedId = productToDelete.id
        const deletedName = productToDelete.nombre
        const deletedCode = productToDelete.codigoBarras

        // Instantly remove from local list
        setProducts((prev) => prev.filter((p) => p.id !== deletedId))
        setProductToDelete(null)

        setSuccessModal({
          isOpen: true,
          title: '¡Producto Eliminado!',
          message: `El producto "${deletedName}" fue eliminado correctamente del sistema.`,
          actionType: 'delete',
          detailItem: {
            title: deletedName,
            badge: 'Eliminado',
            subtitle: `Código de barras: ${deletedCode}`,
          },
        })

        // Reconcile in background
        loadData(false)
      } else {
        alert('No se pudo eliminar el producto.')
      }
    } catch (e) {
      alert('Error al eliminar producto')
    } finally {
      setIsDeleting(false)
    }
  }

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCat === 'ALL' || String(p.categoria?.id) === String(selectedCat)
    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      p.nombre.toLowerCase().includes(q) ||
      (p.codigoBarras && p.codigoBarras.toLowerCase().includes(q))
    return matchesCat && matchesSearch
  })

  return (
    <div className="page-content">
      {/* Top Action Header */}
      <div className="page-header-actions">
        <div className="search-filter-row">
          <div className="search-box">
            <IconSearch size={18} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Buscar por nombre o código de barras..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="search-clear" onClick={() => setSearch('')}>
                ×
              </button>
            )}
          </div>

          <div className="category-select-wrapper">
            <select
              className="form-select"
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
            >
              <option value="ALL">Todas las Categorías ({products.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button className="btn btn-primary" onClick={openCreateModal}>
          <IconPlus size={18} /> Nuevo Producto
        </button>
      </div>

      {/* Products Table Card */}
      <div className="card">
        <div className="card-header flex justify-between items-center">
          <div>
            <h2 className="card-title">Catálogo de Productos ({filteredProducts.length})</h2>
            <p className="card-subtitle">Administra precios, stock, códigos QR e historial de movimientos</p>
          </div>
        </div>

        <div className="card-body">
          {loading ? (
            <div className="py-8 text-center text-muted">Cargando productos...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📦</span>
              <p>No se encontraron productos con los criterios de búsqueda.</p>
              <button className="btn btn-secondary mt-2" onClick={openCreateModal}>
                Agregar primer producto
              </button>
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
                      <th>Precio Compra (Costo)</th>
                      <th>Precio Venta</th>
                      <th>Stock</th>
                      <th>Estado</th>
                      <th className="text-center">Historial & QR</th>
                      <th className="text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((p) => {
                      const isLow = Number(p.stock) <= Number(p.stockMinimo)
                      return (
                        <tr key={p.id}>
                          <td>
                            <span className="font-mono text-xs font-semibold bg-slate-100 px-2 py-1 rounded">
                              {p.codigoBarras}
                            </span>
                          </td>
                          <td>
                            <div className="font-semibold text-primary-dark">{p.nombre}</div>
                            {p.descripcion && (
                              <small className="text-muted line-clamp-1">{p.descripcion}</small>
                            )}
                          </td>
                          <td>
                            <span className="badge badge-neutral">
                              {p.categoria?.nombre || 'General'}
                            </span>
                          </td>
                          <td>
                            <span className="text-muted font-mono font-medium">
                              S/ {Number(p.precioCompra || 0).toFixed(2)}
                            </span>
                          </td>
                          <td>
                            <span className="font-semibold font-mono text-primary">
                              S/ {Number(p.precioVenta || 0).toFixed(2)}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                Number(p.stock) <= 0
                                  ? 'badge-danger'
                                  : isLow
                                  ? 'badge-warning'
                                  : 'badge-success'
                              }`}
                            >
                              {p.stock} {p.unidadMedida}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                p.activo !== false ? 'badge-success' : 'badge-neutral'
                              }`}
                            >
                              {p.activo !== false ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td>
                            <div className="flex justify-center gap-1">
                              <button
                                className="btn-action-pill"
                                title="Ver / Imprimir Código QR"
                                onClick={() => setSelectedQrProduct(p)}
                              >
                                <IconQr size={15} /> QR
                              </button>
                              <button
                                className="btn-action-pill"
                                title="Historial de Precio Inicial y Margen"
                                onClick={() => setSelectedPriceHistoryProduct(p)}
                              >
                                <IconDollar size={15} /> Precios
                              </button>
                              <button
                                className="btn-action-pill"
                                title="Historial de Movimientos de Inventario"
                                onClick={() => setSelectedInventoryHistoryProduct(p)}
                              >
                                <IconHistory size={15} /> Stock
                              </button>
                            </div>
                          </td>
                          <td className="text-right">
                            <div className="flex justify-end gap-1">
                              <button
                                className="btn-icon"
                                title="Editar producto"
                                onClick={() => openEditModal(p)}
                              >
                                <IconEdit size={16} />
                              </button>
                              <button
                                className="btn-icon text-rose"
                                title="Eliminar producto"
                                onClick={() => setProductToDelete(p)}
                              >
                                <IconTrash size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Vista Móvil: Tarjetas táctiles de producto */}
              <div className="mobile-only-view">
                {filteredProducts.map((p) => {
                  const isLow = Number(p.stock) <= Number(p.stockMinimo)
                  const isZero = Number(p.stock) <= 0
                  const stockBadge = isZero ? 'badge-danger' : isLow ? 'badge-warning' : 'badge-success'

                  return (
                    <div key={p.id} className="mobile-product-card">
                      <div className="mobile-product-header">
                        <div className="mobile-product-title-wrap">
                          <span className="mobile-product-name">{p.nombre}</span>
                          <div className="mobile-product-meta">
                            <span className="font-mono text-xs text-muted">#{p.codigoBarras}</span>
                            <span className="badge badge-neutral text-xs">{p.categoria?.nombre || 'General'}</span>
                          </div>
                        </div>
                        <span className={`badge ${p.activo !== false ? 'badge-success' : 'badge-neutral'}`}>
                          {p.activo !== false ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>

                      <div className="mobile-product-pricing">
                        <div className="mobile-price-col">
                          <span className="text-xs text-muted">Venta</span>
                          <span className="mobile-price-val">S/ {Number(p.precioVenta || 0).toFixed(2)}</span>
                        </div>
                        <div className="mobile-price-col">
                          <span className="text-xs text-muted">Costo</span>
                          <span className="text-xs font-mono text-secondary">S/ {Number(p.precioCompra || 0).toFixed(2)}</span>
                        </div>
                        <div className="mobile-price-col text-right">
                          <span className="text-xs text-muted">Stock</span>
                          <span className={`badge ${stockBadge}`}>
                            {p.stock} {p.unidadMedida}
                          </span>
                        </div>
                      </div>

                      <div className="mobile-product-actions">
                        <button
                          className="btn-action-pill"
                          onClick={() => setSelectedQrProduct(p)}
                          title="Código QR"
                        >
                          <IconQr size={13} /> QR
                        </button>
                        <button
                          className="btn-action-pill"
                          onClick={() => setSelectedPriceHistoryProduct(p)}
                          title="Historial de Precios"
                        >
                          <IconDollar size={13} /> Precios
                        </button>
                        <button
                          className="btn-action-pill"
                          onClick={() => setSelectedInventoryHistoryProduct(p)}
                          title="Historial de Stock"
                        >
                          <IconHistory size={13} /> Stock
                        </button>
                        <div className="mobile-product-crud-btns">
                          <button
                            className="btn-icon"
                            onClick={() => openEditModal(p)}
                            title="Editar"
                          >
                            <IconEdit size={16} />
                          </button>
                          <button
                            className="btn-icon text-rose"
                            onClick={() => setProductToDelete(p)}
                            title="Eliminar"
                          >
                            <IconTrash size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal: Crear / Editar Producto */}
      {showFormModal && (
        <div className="modal-overlay" onClick={() => setShowFormModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">
                  {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                </h3>
                <p className="modal-subtitle">
                  {editingProduct ? `Modificando ${editingProduct.nombre}` : 'Registra un artículo en el inventario'}
                </p>
              </div>
              <button className="btn-close" onClick={() => setShowFormModal(false)}>
                <IconClose size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
                <div className="form-grid-2">
                  <div className="form-group">
                    <div className="flex justify-between items-center mb-1">
                      <label className="form-label mb-0">Código de Barras *</label>
                      <button
                        type="button"
                        className="btn btn-xs btn-outline flex items-center gap-1 py-0.5 px-2 text-xs"
                        onClick={() => setShowScannerModal(true)}
                        title="Escanear con cámara del dispositivo"
                      >
                        <IconCamera size={13} /> Escanear Cámara
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="form-input font-mono"
                        value={formData.codigoBarras}
                        onChange={(e) => setFormData({ ...formData, codigoBarras: e.target.value })}
                        required
                        placeholder="Ej. 775012345678"
                      />
                      <button
                        type="button"
                        className="btn btn-secondary px-3"
                        onClick={() => setShowScannerModal(true)}
                        title="Abrir Cámara del Celular / Laptop"
                      >
                        <IconCamera size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Categoría *</label>
                    <select
                      className="form-select"
                      value={formData.categoriaId}
                      onChange={(e) => setFormData({ ...formData, categoriaId: e.target.value })}
                      required
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Nombre del Producto *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                    placeholder="Ej. Arroz Extra Costeño 1kg"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Descripción</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Detalles adicionales, marca, presentación..."
                  />
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Precio Inicial de Compra (Costo) *</label>
                    <div className="input-prefix-wrapper">
                      <span className="input-prefix">S/</span>
                      <input
                        type="number"
                        step="0.01"
                        className="form-input"
                        value={formData.precioCompra}
                        onChange={(e) => setFormData({ ...formData, precioCompra: e.target.value })}
                        required
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Precio de Venta al Público *</label>
                    <div className="input-prefix-wrapper">
                      <span className="input-prefix">S/</span>
                      <input
                        type="number"
                        step="0.01"
                        className="form-input"
                        value={formData.precioVenta}
                        onChange={(e) => setFormData({ ...formData, precioVenta: e.target.value })}
                        required
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-grid-3">
                  <div className="form-group">
                    <label className="form-label flex items-center justify-between">
                      <span>Stock Actual</span>
                      {!editingProduct && <span className="text-xs text-muted font-normal">(Inicio 0)</span>}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      className="form-input"
                      value={editingProduct ? formData.stock : '0'}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      disabled={!editingProduct}
                      placeholder="0"
                    />
                    {!editingProduct && (
                      <span className="text-xs text-muted mt-1 block" style={{ fontSize: '0.72rem' }}>
                        * Stock inicial 0 (Se gestiona en Inventario / Compras)
                      </span>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Stock Mínimo</label>
                    <input
                      type="number"
                      step="0.1"
                      className="form-input"
                      value={formData.stockMinimo}
                      onChange={(e) => setFormData({ ...formData, stockMinimo: e.target.value })}
                      placeholder="5"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Unidad de Medida</label>
                    <select
                      className="form-select"
                      value={formData.unidadMedida}
                      onChange={(e) => setFormData({ ...formData, unidadMedida: e.target.value })}
                    >
                      <option value="unidad">Unidad</option>
                      <option value="kilogramo">Kilogramo (kg)</option>
                      <option value="litro">Litro (L)</option>
                      <option value="paquete">Paquete</option>
                      <option value="caja">Caja</option>
                    </select>
                  </div>
                </div>

                <div className="form-group mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.activo}
                      onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                    />
                    <span className="text-sm font-semibold">Producto activo para la venta</span>
                  </label>
                </div>
              </div>

              <div className="modal-footer flex justify-between">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowFormModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? 'Guardar Cambios' : 'Registrar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {selectedQrProduct && (
        <QRCodeModal
          product={selectedQrProduct}
          onClose={() => setSelectedQrProduct(null)}
        />
      )}

      {/* Price History Modal */}
      {selectedPriceHistoryProduct && (
        <PriceHistoryModal
          product={selectedPriceHistoryProduct}
          onClose={() => setSelectedPriceHistoryProduct(null)}
          onPriceUpdated={loadData}
        />
      )}

      {/* Inventory History Modal */}
      {selectedInventoryHistoryProduct && (
        <InventoryHistoryModal
          product={selectedInventoryHistoryProduct}
          onClose={() => setSelectedInventoryHistoryProduct(null)}
        />
      )}

      {/* Modal Animado: Confirmar Eliminación de Producto */}
      <ConfirmModal
        isOpen={!!productToDelete}
        onClose={() => !isDeleting && setProductToDelete(null)}
        onConfirm={executeDeleteProduct}
        type="danger"
        icon={<IconTrash size={28} />}
        title="¿Eliminar producto?"
        message="¿Estás seguro de que deseas eliminar permanentemente este producto del catálogo? Esta acción no se puede deshacer."
        detailItem={
          productToDelete
            ? {
                title: productToDelete.nombre,
                badge: productToDelete.codigoBarras,
                subtitle: `Precio Venta: S/ ${Number(productToDelete.precioVenta || 0).toFixed(2)} | Stock: ${productToDelete.stock} ${productToDelete.unidadMedida || 'unidad'}`,
              }
            : null
        }
        confirmText="Sí, eliminar producto"
        cancelText="Cancelar"
        loading={isDeleting}
      />

      {/* Modal Animado: Confirmar Registro de Nuevo Producto */}
      <ConfirmModal
        isOpen={showAddConfirm}
        onClose={() => !isSaving && setShowAddConfirm(false)}
        onConfirm={executeSaveProduct}
        type="success"
        icon={<IconPlus size={28} />}
        title="¿Registrar nuevo producto?"
        message="Se creará el producto en la base de datos y quedará disponible para el punto de venta e inventario."
        detailItem={{
          title: formData.nombre || 'Nuevo Producto',
          badge: formData.codigoBarras || 'Sin código',
          subtitle: `Precio Venta: S/ ${Number(formData.precioVenta || 0).toFixed(2)} | Stock inicial: ${formData.stock || 0} ${formData.unidadMedida || 'unidad'}`,
        }}
        confirmText="Sí, registrar producto"
        cancelText="Seguir editando"
        loading={isSaving}
      />

      {/* Modal Animado: Confirmar Edición de Producto */}
      <ConfirmModal
        isOpen={showEditConfirm}
        onClose={() => !isSaving && setShowEditConfirm(false)}
        onConfirm={executeSaveProduct}
        type="warning"
        icon={<IconEdit size={28} />}
        title="¿Guardar cambios del producto?"
        message="Se actualizarán las características, precios y parámetros del producto en el catálogo."
        detailItem={{
          title: formData.nombre || 'Producto',
          badge: formData.codigoBarras || '',
          subtitle: `Precio Venta: S/ ${Number(formData.precioVenta || 0).toFixed(2)} | Stock: ${formData.stock || 0} ${formData.unidadMedida || 'unidad'}`,
        }}
        confirmText="Sí, actualizar cambios"
        cancelText="Seguir editando"
        loading={isSaving}
      />

      {/* Animación de Check para Agregar, Editar y Eliminar */}
      <SuccessModal
        isOpen={successModal.isOpen}
        onClose={() => setSuccessModal((prev) => ({ ...prev, isOpen: false }))}
        title={successModal.title}
        message={successModal.message}
        actionType={successModal.actionType}
        detailItem={successModal.detailItem}
      />

      {/* Notificación Toast Animada de Éxito / Alerta */}
      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((t) => ({ ...t, isOpen: false }))}
      />

      {/* Lector de Código de Barras con la Cámara */}
      <BarcodeScannerModal
        isOpen={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        onScanSuccess={(scannedCode) => {
          setFormData((prev) => ({ ...prev, codigoBarras: scannedCode }))
          setShowScannerModal(false)
          setToast({
            isOpen: true,
            message: `Código escaneado con éxito: ${scannedCode}`,
            type: 'success',
          })
        }}
      />
    </div>
  )
}
