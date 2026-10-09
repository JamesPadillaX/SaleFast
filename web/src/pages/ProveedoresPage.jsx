import React, { useState, useEffect } from 'react'
import { api } from '../api'
import {
  IconSearch,
  IconPlus,
  IconEdit,
  IconTrash,
  IconSuppliers,
  IconClose,
} from '../components/Icons'
import ConfirmModal from '../components/ConfirmModal'
import SuccessModal from '../components/SuccessModal'

export default function ProveedoresPage() {
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState(null)
  const [supplierToDelete, setSupplierToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Animación de Check (Success Modal)
  const [successModal, setSuccessModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    actionType: 'add',
    detailItem: null,
  })

  const [formData, setFormData] = useState({
    nombre: '',
    ruc: '',
    telefono: '',
    correo: '',
    direccion: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const res = await api.get('/proveedores')
      if (res.ok) {
        const data = await res.json()
        setSuppliers(Array.isArray(data) ? data : [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  function openCreateModal() {
    setEditingSupplier(null)
    setFormData({
      nombre: '',
      ruc: '',
      telefono: '',
      correo: '',
      direccion: '',
    })
    setShowModal(true)
  }

  function openEditModal(sup) {
    setEditingSupplier(sup)
    setFormData({
      nombre: sup.nombre || '',
      ruc: sup.ruc || '',
      telefono: sup.telefono || '',
      correo: sup.correo || '',
      direccion: sup.direccion || '',
    })
    setShowModal(true)
  }

  async function handleSaveSupplier(e) {
    e.preventDefault()
    if (!formData.nombre.trim()) return alert('El nombre es obligatorio')
    if (!formData.ruc.trim()) return alert('El RUC es obligatorio')

    const payload = {
      nombre: formData.nombre.trim(),
      ruc: formData.ruc.trim(),
      telefono: formData.telefono.trim(),
      correo: formData.correo.trim(),
      direccion: formData.direccion.trim(),
    }

    try {
      let res
      if (editingSupplier) {
        res = await api.put(`/proveedores/${editingSupplier.id}`, payload)
      } else {
        res = await api.post('/proveedores', payload)
      }

      if (res.ok) {
        const isEdit = !!editingSupplier
        const savedName = formData.nombre.trim()
        const savedRuc = formData.ruc.trim()
        setShowModal(false)
        await loadData()

        setSuccessModal({
          isOpen: true,
          title: isEdit ? '¡Proveedor Actualizado!' : '¡Proveedor Registrado!',
          message: isEdit
            ? `Los datos del proveedor "${savedName}" se actualizaron con éxito.`
            : `El proveedor "${savedName}" fue registrado exitosamente en la base de datos.`,
          actionType: isEdit ? 'edit' : 'add',
          detailItem: {
            title: savedName,
            badge: `RUC: ${savedRuc}`,
            subtitle: formData.direccion || formData.telefono || 'Sin datos de contacto adicionales',
          },
        })
      } else {
        const err = await res.json()
        alert(err.message || 'Error al guardar proveedor')
      }
    } catch (err) {
      alert('Error de conexión con el servidor')
    }
  }

  function confirmDeleteSupplier(s) {
    setSupplierToDelete(s)
  }

  async function executeDeleteSupplier() {
    if (!supplierToDelete) return
    setIsDeleting(true)
    try {
      const res = await api.delete(`/proveedores/${supplierToDelete.id}`)
      if (res.ok) {
        const deletedName = supplierToDelete.nombre
        const deletedRuc = supplierToDelete.ruc
        setSupplierToDelete(null)
        await loadData()

        setSuccessModal({
          isOpen: true,
          title: '¡Proveedor Eliminado!',
          message: `El proveedor "${deletedName}" fue eliminado correctamente del sistema.`,
          actionType: 'delete',
          detailItem: {
            title: deletedName,
            badge: 'Eliminado',
            subtitle: `RUC: ${deletedRuc}`,
          },
        })
      } else {
        alert('No se pudo eliminar el proveedor.')
      }
    } catch (e) {
      alert('Error al eliminar proveedor')
    } finally {
      setIsDeleting(false)
    }
  }

  const filteredSuppliers = suppliers.filter((s) => {
    const q = search.toLowerCase()
    return (
      !q ||
      s.nombre.toLowerCase().includes(q) ||
      (s.ruc && s.ruc.includes(q)) ||
      (s.telefono && s.telefono.includes(q)) ||
      (s.correo && s.correo.toLowerCase().includes(q))
    )
  })

  return (
    <div className="page-content">
      {/* Header Actions */}
      <div className="page-header-actions">
        <div className="search-box">
          <IconSearch size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por razón social, RUC o teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch('')}>
              ×
            </button>
          )}
        </div>

        <button className="btn btn-primary" onClick={openCreateModal}>
          <IconPlus size={18} /> Nuevo Proveedor
        </button>
      </div>

      {/* Suppliers Table Card */}
      <div className="card">
        <div className="card-header flex justify-between items-center">
          <div>
            <h2 className="card-title">Directorio de Proveedores ({filteredSuppliers.length})</h2>
            <p className="card-subtitle">Administra los proveedores de mercadería y contactos comerciales</p>
          </div>
        </div>

        <div className="card-body">
          {loading ? (
            <div className="py-8 text-center text-muted">Cargando proveedores...</div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🏢</span>
              <p>No se encontraron proveedores registrados.</p>
              <button className="btn btn-primary mt-2" onClick={openCreateModal}>
                Registrar primer proveedor
              </button>
            </div>
          ) : (
            <>
              <div className="table-responsive desktop-only-view">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>RUC / NIT</th>
                      <th>Razón Social / Proveedor</th>
                      <th>Teléfono</th>
                      <th>Correo Electrónico</th>
                      <th>Dirección</th>
                      <th className="text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSuppliers.map((s) => (
                      <tr key={s.id}>
                        <td>
                          <span className="font-mono text-xs font-semibold bg-slate-100 px-2 py-1 rounded">
                            {s.ruc}
                          </span>
                        </td>
                        <td className="font-semibold text-primary-dark">{s.nombre}</td>
                        <td>
                          {s.telefono ? (
                            <span className="text-secondary">{s.telefono}</span>
                          ) : (
                            <span className="text-muted text-xs">—</span>
                          )}
                        </td>
                        <td>
                          {s.correo ? (
                            <a href={`mailto:${s.correo}`} className="text-primary hover:underline">
                              {s.correo}
                            </a>
                          ) : (
                            <span className="text-muted text-xs">—</span>
                          )}
                        </td>
                        <td className="text-secondary text-sm">{s.direccion || '—'}</td>
                        <td className="text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              className="btn-icon"
                              title="Editar proveedor"
                              onClick={() => openEditModal(s)}
                            >
                              <IconEdit size={16} />
                            </button>
                            <button
                              className="btn-icon text-rose"
                              title="Eliminar proveedor"
                              onClick={() => confirmDeleteSupplier(s)}
                            >
                              <IconTrash size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Vista Móvil: Tarjetas de Proveedores */}
              <div className="mobile-only-view">
                {filteredSuppliers.map((s) => (
                  <div key={s.id} className="mobile-supplier-card">
                    <div className="mobile-supplier-header">
                      <div>
                        <div className="font-semibold text-primary-dark">{s.nombre}</div>
                        <span className="font-mono text-xs text-muted">RUC: {s.ruc}</span>
                      </div>
                      <div className="mobile-supplier-actions">
                        <button
                          className="btn-icon"
                          title="Editar"
                          onClick={() => openEditModal(s)}
                        >
                          <IconEdit size={16} />
                        </button>
                        <button
                          className="btn-icon text-rose"
                          title="Eliminar"
                          onClick={() => confirmDeleteSupplier(s)}
                        >
                          <IconTrash size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="mobile-supplier-details">
                      {s.telefono && (
                        <div className="text-xs text-secondary">
                          Tel: <span className="font-medium">{s.telefono}</span>
                        </div>
                      )}
                      {s.correo && (
                        <div className="text-xs text-secondary">
                          Email: {s.correo}
                        </div>
                      )}
                      {s.direccion && (
                        <div className="text-xs text-muted">
                          Dir: {s.direccion}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal: Crear / Editar Proveedor */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">
                  {editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                </h3>
                <p className="modal-subtitle">
                  {editingSupplier ? `Modificando ${editingSupplier.nombre}` : 'Registra un distribuidor o mayorista'}
                </p>
              </div>
              <button className="btn-close" onClick={() => setShowModal(false)}>
                <IconClose size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier}>
              <div className="modal-body">
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">RUC (11 dígitos) *</label>
                    <input
                      type="text"
                      maxLength={11}
                      className="form-input font-mono"
                      value={formData.ruc}
                      onChange={(e) => setFormData({ ...formData, ruc: e.target.value })}
                      required
                      placeholder="20123456789"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Teléfono de Contacto</label>
                    <input
                      type="tel"
                      className="form-input"
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      placeholder="999 888 777"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Razón Social / Nombre Comercial *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                    placeholder="Ej. Alicorp S.A.A."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Correo Electrónico</label>
                  <input
                    type="email"
                    className="form-input"
                    value={formData.correo}
                    onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                    placeholder="ventas@proveedor.com"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Dirección Fiscal / Despacho</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    placeholder="Av. Principal 123, Lima"
                  />
                </div>
              </div>

              <div className="modal-footer flex justify-between">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingSupplier ? 'Guardar Cambios' : 'Registrar Proveedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación para Eliminar Proveedor */}
      <ConfirmModal
        isOpen={!!supplierToDelete}
        onClose={() => !isDeleting && setSupplierToDelete(null)}
        onConfirm={executeDeleteSupplier}
        type="danger"
        icon={<IconTrash size={28} />}
        title="¿Eliminar proveedor?"
        message="Se eliminará la ficha del proveedor y su historial de contacto asociado."
        detailItem={
          supplierToDelete && {
            title: supplierToDelete.nombre,
            badge: `RUC: ${supplierToDelete.ruc}`,
            subtitle: supplierToDelete.direccion || supplierToDelete.telefono || 'Sin datos de contacto',
          }
        }
        confirmText="Sí, eliminar proveedor"
        cancelText="Conservar proveedor"
        loading={isDeleting}
      />

      {/* Animación de Check para Agregar, Editar y Eliminar Proveedor */}
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
