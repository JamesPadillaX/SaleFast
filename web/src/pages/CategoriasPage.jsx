import React, { useState, useEffect } from 'react'
import { api } from '../api'
import {
  IconSearch,
  IconPlus,
  IconEdit,
  IconTrash,
  IconCategories,
  IconClose,
} from '../components/Icons'
import ConfirmModal from '../components/ConfirmModal'
import SuccessModal from '../components/SuccessModal'

export default function CategoriasPage() {
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingCat, setEditingCat] = useState(null)
  const [categoryToDelete, setCategoryToDelete] = useState(null)
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
    descripcion: '',
    isSubcategory: false,
    parentName: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData(showLoading = true) {
    if (showLoading) setLoading(true)
    try {
      const [resCats, resProds] = await Promise.all([
        api.get('/categorias'),
        api.get('/productos?size=300'),
      ])
      if (resCats.ok) {
        const catData = await resCats.json()
        setCategories(Array.isArray(catData) ? catData : [])
      }
      if (resProds.ok) {
        const prodData = await resProds.json()
        setProducts(prodData.content || prodData || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  function openCreateModal(isSub = false, parent = '') {
    setEditingCat(null)
    setFormData({
      nombre: '',
      descripcion: '',
      isSubcategory: isSub,
      parentName: parent,
    })
    setShowModal(true)
  }

  function openEditModal(cat) {
    setEditingCat(cat)
    const isSub = cat.nombre.includes(' > ')
    const parts = cat.nombre.split(' > ')
    setFormData({
      nombre: isSub ? parts[1] : cat.nombre,
      descripcion: cat.descripcion || '',
      isSubcategory: isSub,
      parentName: isSub ? parts[0] : '',
    })
    setShowModal(true)
  }

  async function handleSaveCategory(e) {
    e.preventDefault()
    if (!formData.nombre.trim()) return alert('El nombre es obligatorio')

    let finalName = formData.nombre.trim()
    if (formData.isSubcategory && formData.parentName) {
      finalName = `${formData.parentName} > ${finalName}`
    }

    const payload = {
      nombre: finalName,
      descripcion: formData.descripcion.trim(),
    }

    try {
      let res
      if (editingCat) {
        res = await api.put(`/categorias/${editingCat.id}`, payload)
      } else {
        res = await api.post('/categorias', payload)
      }

      if (res.ok) {
        const savedCat = await res.json()
        const fullCat = { ...payload, ...savedCat }
        const isEdit = !!editingCat

        // Immediate state update (0ms lag)
        if (isEdit) {
          setCategories((prev) => prev.map((c) => (c.id === fullCat.id ? fullCat : c)))
        } else {
          setCategories((prev) => [fullCat, ...prev.filter((c) => c.id !== fullCat.id)])
        }

        setShowModal(false)

        setSuccessModal({
          isOpen: true,
          title: isEdit ? '¡Categoría Actualizada!' : '¡Categoría Registrada!',
          message: isEdit
            ? `La categoría "${finalName}" se actualizó correctamente.`
            : `La nueva categoría "${finalName}" fue creada con éxito en la base de datos.`,
          actionType: isEdit ? 'edit' : 'add',
          detailItem: {
            title: finalName,
            badge: formData.isSubcategory ? 'Subcategoría' : 'Categoría Principal',
            subtitle: formData.descripcion || 'Sin descripción adicional',
          },
        })

        // Reconcile in background
        loadData(false)
      } else {
        if (res.status === 403) {
          alert('Acceso Denegado: Se requieren permisos de Administrador para gestionar categorías.')
        } else {
          try {
            const err = await res.json()
            if (err.message && err.message.includes('duplicate key')) {
              alert(`Ya existe una categoría registrada con el nombre "${finalName}".`)
            } else {
              alert(err.message || 'Error al guardar categoría')
            }
          } catch {
            alert('Error al guardar categoría. Verifique los datos ingresados.')
          }
        }
      }
    } catch (err) {
      alert('Error de conexión con el servidor')
    }
  }

  function confirmDeleteCategory(cat) {
    // Check if products exist
    const prodsInCat = products.filter((p) => String(p.categoria?.id) === String(cat.id))
    if (prodsInCat.length > 0) {
      return alert(
        `No se puede eliminar la categoría "${cat.nombre}" porque contiene ${prodsInCat.length} producto(s) asociado(s). Reasigna o elimina los productos primero.`
      )
    }
    setCategoryToDelete(cat)
  }

  async function executeDeleteCategory() {
    if (!categoryToDelete) return
    setIsDeleting(true)
    try {
      const res = await api.delete(`/categorias/${categoryToDelete.id}`)
      if (res.ok) {
        const deletedId = categoryToDelete.id
        const deletedName = categoryToDelete.nombre

        // Instantly remove from local state
        setCategories((prev) => prev.filter((c) => c.id !== deletedId))
        setCategoryToDelete(null)

        setSuccessModal({
          isOpen: true,
          title: '¡Categoría Eliminada!',
          message: `La categoría "${deletedName}" fue eliminada satisfactoriamente.`,
          actionType: 'delete',
          detailItem: {
            title: deletedName,
            badge: 'Eliminada',
            subtitle: 'Registro removido del sistema',
          },
        })

        // Reconcile in background
        loadData(false)
      } else {
        alert('No se pudo eliminar la categoría.')
      }
    } catch (e) {
      alert('Error al eliminar categoría')
    } finally {
      setIsDeleting(false)
    }
  }

  // Group into main categories and subcategories
  const mainCategories = categories.filter((c) => !c.nombre.includes(' > '))

  const filteredCategories = categories.filter((c) => {
    const q = search.toLowerCase()
    return !q || c.nombre.toLowerCase().includes(q) || (c.descripcion && c.descripcion.toLowerCase().includes(q))
  })

  return (
    <div className="page-content">
      {/* Action Header */}
      <div className="page-header-actions">
        <div className="search-box">
          <IconSearch size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Buscar categoría o subcategoría..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch('')}>
              ×
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={() => openCreateModal(true, mainCategories[0]?.nombre || '')}>
            <IconPlus size={18} /> Nueva Subcategoría
          </button>
          <button className="btn btn-primary" onClick={() => openCreateModal(false)}>
            <IconPlus size={18} /> Nueva Categoría
          </button>
        </div>
      </div>

      {/* Categories Table Card */}
      <div className="card">
        <div className="card-header flex justify-between items-center">
          <div>
            <h2 className="card-title">Gestión de Categorías y Subcategorías ({filteredCategories.length})</h2>
            <p className="card-subtitle">Organiza tu inventario por grupos y familias de productos</p>
          </div>
        </div>

        <div className="card-body">
          {loading ? (
            <div className="py-8 text-center text-muted">Cargando categorías...</div>
          ) : filteredCategories.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📁</span>
              <p>No se encontraron categorías.</p>
              <button className="btn btn-primary mt-2" onClick={() => openCreateModal(false)}>
                Crear primera categoría
              </button>
            </div>
          ) : (
            <>
              <div className="table-responsive desktop-only-view">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Nombre</th>
                      <th>Categoría Principal</th>
                      <th>Descripción</th>
                      <th>Productos Asignados</th>
                      <th className="text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCategories.map((cat) => {
                      const isSub = cat.nombre.includes(' > ')
                      const parts = isSub ? cat.nombre.split(' > ') : [cat.nombre]
                      const parentName = isSub ? parts[0] : '-'
                      const displayName = isSub ? parts[1] : parts[0]
                      const countProds = products.filter(
                        (p) => String(p.categoria?.id) === String(cat.id)
                      ).length

                      return (
                        <tr key={cat.id}>
                          <td>
                            <span className={`badge ${isSub ? 'badge-info' : 'badge-primary'}`}>
                              {isSub ? 'Subcategoría' : 'Categoría Principal'}
                            </span>
                          </td>
                          <td className="font-semibold text-primary-dark">
                            {isSub && <span className="text-muted mr-1">↳</span>}
                            {displayName}
                          </td>
                          <td>
                            {isSub ? (
                              <span className="badge badge-neutral font-medium">{parentName}</span>
                            ) : (
                              <span className="text-muted text-xs">— Raíz</span>
                            )}
                          </td>
                          <td className="text-secondary text-sm">{cat.descripcion || 'Sin descripción'}</td>
                          <td>
                            <span className="badge badge-neutral">
                              {countProds} {countProds === 1 ? 'producto' : 'productos'}
                            </span>
                          </td>
                          <td className="text-right">
                            <div className="flex justify-end gap-1">
                              {!isSub && (
                                <button
                                  className="btn-icon"
                                  title="Añadir subcategoría"
                                  onClick={() => openCreateModal(true, cat.nombre)}
                                >
                                  <IconPlus size={16} />
                                </button>
                              )}
                              <button
                                className="btn-icon"
                                title="Editar categoría"
                                onClick={() => openEditModal(cat)}
                              >
                                <IconEdit size={16} />
                              </button>
                              <button
                                className="btn-icon text-rose"
                                title="Eliminar categoría"
                                onClick={() => confirmDeleteCategory(cat)}
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

              {/* Vista Móvil: Tarjetas de Categorías */}
              <div className="mobile-only-view">
                {filteredCategories.map((cat) => {
                  const isSub = cat.nombre.includes(' > ')
                  const parts = isSub ? cat.nombre.split(' > ') : [cat.nombre]
                  const parentName = isSub ? parts[0] : '-'
                  const displayName = isSub ? parts[1] : parts[0]
                  const countProds = products.filter(
                    (p) => String(p.categoria?.id) === String(cat.id)
                  ).length

                  return (
                    <div key={cat.id} className="mobile-category-card">
                      <div className="mobile-category-header">
                        <div>
                          <div className="font-semibold text-primary-dark">
                            {isSub && <span className="text-muted mr-1">↳</span>}
                            {displayName}
                          </div>
                          {isSub && (
                            <div className="text-xs text-muted">
                              Pertenece a: <span className="font-medium text-secondary">{parentName}</span>
                            </div>
                          )}
                        </div>
                        <span className={`badge ${isSub ? 'badge-info' : 'badge-primary'}`}>
                          {isSub ? 'Subcategoría' : 'Principal'}
                        </span>
                      </div>

                      {cat.descripcion && (
                        <div className="text-xs text-secondary mt-1">{cat.descripcion}</div>
                      )}

                      <div className="mobile-category-footer">
                        <span className="badge badge-neutral">
                          {countProds} {countProds === 1 ? 'producto' : 'productos'}
                        </span>
                        <div className="mobile-category-actions">
                          {!isSub && (
                            <button
                              className="btn-icon"
                              title="Añadir subcategoría"
                              onClick={() => openCreateModal(true, cat.nombre)}
                            >
                              <IconPlus size={16} />
                            </button>
                          )}
                          <button
                            className="btn-icon"
                            title="Editar"
                            onClick={() => openEditModal(cat)}
                          >
                            <IconEdit size={16} />
                          </button>
                          <button
                            className="btn-icon text-rose"
                            title="Eliminar"
                            onClick={() => confirmDeleteCategory(cat)}
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

      {/* Modal: Crear / Editar Categoría */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">
                  {editingCat
                    ? 'Editar Categoría / Subcategoría'
                    : formData.isSubcategory
                    ? 'Nueva Subcategoría'
                    : 'Nueva Categoría Principal'}
                </h3>
                <p className="modal-subtitle">Define el nombre y la agrupación en el catálogo</p>
              </div>
              <button className="btn-close" onClick={() => setShowModal(false)}>
                <IconClose size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCategory}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="flex items-center gap-2 cursor-pointer mb-2">
                    <input
                      type="checkbox"
                      checked={formData.isSubcategory}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isSubcategory: e.target.checked,
                          parentName: e.target.checked
                            ? formData.parentName || mainCategories[0]?.nombre || ''
                            : '',
                        })
                      }
                    />
                    <span className="text-sm font-semibold">Es una subcategoría de otra categoría</span>
                  </label>
                </div>

                {formData.isSubcategory && (
                  <div className="form-group">
                    <label className="form-label">Categoría Principal Padre *</label>
                    <select
                      className="form-select"
                      value={formData.parentName}
                      onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                      required
                    >
                      {mainCategories.map((c) => (
                        <option key={c.id} value={c.nombre}>
                          {c.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">
                    {formData.isSubcategory ? 'Nombre de la Subcategoría *' : 'Nombre de la Categoría *'}
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                    placeholder={formData.isSubcategory ? 'Ej. Lácteos Deslactosados' : 'Ej. Bebidas y Licores'}
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Descripción</label>
                  <textarea
                    className="form-input"
                    rows="3"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Breve descripción o notas sobre esta agrupación..."
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
                  {editingCat ? 'Guardar Cambios' : 'Crear Categoría'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación para Eliminar Categoría */}
      <ConfirmModal
        isOpen={!!categoryToDelete}
        onClose={() => !isDeleting && setCategoryToDelete(null)}
        onConfirm={executeDeleteCategory}
        type="danger"
        icon={<IconTrash size={28} />}
        title="¿Eliminar categoría?"
        message="Esta acción removerá permanentemente la categoría de la base de datos."
        detailItem={
          categoryToDelete && {
            title: categoryToDelete.nombre,
            badge: 'Categoría',
            subtitle: categoryToDelete.descripcion || 'Sin descripción',
          }
        }
        confirmText="Sí, eliminar categoría"
        cancelText="Conservar categoría"
        loading={isDeleting}
      />

      {/* Animación de Check para Agregar, Editar y Eliminar Categoría */}
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
