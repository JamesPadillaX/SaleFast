import React, { useState, useEffect } from 'react'
import { api } from '../api'
import {
  IconSearch,
  IconPlus,
  IconEdit,
  IconTrash,
  IconUsers,
  IconClose,
} from '../components/Icons'
import ConfirmModal from '../components/ConfirmModal'
import SuccessModal from '../components/SuccessModal'

export default function UsuariosPage() {
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [userToDelete, setUserToDelete] = useState(null)
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
    username: '',
    nombre: '',
    password: '',
    rolId: '1',
    activo: true,
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [resUsers, resRoles] = await Promise.all([
        api.get('/usuarios'),
        api.get('/usuarios/roles'),
      ])
      if (resUsers.ok) {
        const uData = await resUsers.json()
        setUsers(Array.isArray(uData) ? uData : [])
      }
      if (resRoles.ok) {
        const rData = await resRoles.json()
        setRoles(Array.isArray(rData) ? rData : [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  function openCreateModal() {
    setEditingUser(null)
    setFormData({
      username: '',
      nombre: '',
      password: '',
      rolId: roles[0]?.id || '1',
      activo: true,
    })
    setShowModal(true)
  }

  function openEditModal(u) {
    setEditingUser(u)
    setFormData({
      username: u.username || '',
      nombre: u.nombre || '',
      password: '', // leave empty unless changing
      rolId: u.rol?.id || roles[0]?.id || '1',
      activo: u.activo !== false,
    })
    setShowModal(true)
  }

  async function handleSaveUser(e) {
    e.preventDefault()
    if (!formData.nombre.trim()) return alert('El nombre es obligatorio')

    if (!editingUser) {
      if (!formData.username.trim()) return alert('El nombre de usuario es obligatorio')
      if (!formData.password) return alert('La contraseña es obligatoria para nuevos usuarios')
    }

    try {
      let res
      if (editingUser) {
        const payload = {
          nombre: formData.nombre.trim(),
          rolId: formData.rolId,
          activo: formData.activo,
        }
        if (formData.password.trim()) {
          payload.password = formData.password.trim()
        }
        res = await api.put(`/usuarios/${editingUser.id}`, payload)
      } else {
        const payload = {
          username: formData.username.trim(),
          nombre: formData.nombre.trim(),
          password: formData.password.trim(),
          rolId: formData.rolId,
        }
        res = await api.post('/usuarios', payload)
      }

      if (res.ok) {
        const isEdit = !!editingUser
        const savedNombre = formData.nombre.trim()
        const savedUser = formData.username.trim()
        setShowModal(false)
        await loadData()

        setSuccessModal({
          isOpen: true,
          title: isEdit ? '¡Usuario Actualizado!' : '¡Usuario Creado!',
          message: isEdit
            ? `Los datos del usuario "${savedNombre}" se actualizaron con éxito.`
            : `El usuario "${savedNombre}" (${savedUser}) fue registrado exitosamente.`,
          actionType: isEdit ? 'edit' : 'add',
          detailItem: {
            title: savedNombre,
            badge: isEdit ? 'Actualizado' : 'Nuevo Usuario',
            subtitle: `Usuario: @${savedUser || editingUser?.username}`,
          },
        })
      } else {
        const err = await res.json()
        alert(err.message || 'Error al procesar usuario')
      }
    } catch (err) {
      alert('Error al conectar con el servidor')
    }
  }

  function confirmDeleteUser(u) {
    setUserToDelete(u)
  }

  async function executeDeleteUser() {
    if (!userToDelete) return
    setIsDeleting(true)
    try {
      const res = await api.delete(`/usuarios/${userToDelete.id}`)
      if (res.ok) {
        const deletedName = userToDelete.nombre
        const deletedUsername = userToDelete.username
        setUserToDelete(null)
        await loadData()

        setSuccessModal({
          isOpen: true,
          title: '¡Usuario Desactivado!',
          message: `El usuario "${deletedName}" fue dado de baja del sistema correctamente.`,
          actionType: 'delete',
          detailItem: {
            title: deletedName,
            badge: 'Desactivado',
            subtitle: `Usuario: @${deletedUsername}`,
          },
        })
      } else {
        alert('No se pudo desactivar el usuario.')
      }
    } catch (e) {
      alert('Error al desactivar usuario')
    } finally {
      setIsDeleting(false)
    }
  }

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase()
    return (
      !q ||
      u.nombre.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q)
    )
  })

  return (
    <div className="page-content">
      {/* Top Actions */}
      <div className="page-header-actions">
        <div className="search-box">
          <IconSearch size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por usuario o nombre completo..."
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
          <IconPlus size={18} /> Nuevo Usuario
        </button>
      </div>

      {/* Users Card */}
      <div className="card">
        <div className="card-header flex justify-between items-center">
          <div>
            <h2 className="card-title">Gestión de Usuarios del Sistema ({filteredUsers.length})</h2>
            <p className="card-subtitle">Control de accesos, roles de cajero y permisos de administrador</p>
          </div>
        </div>

        <div className="card-body">
          {loading ? (
            <div className="py-8 text-center text-muted">Cargando usuarios...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">👥</span>
              <p>No se encontraron usuarios.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Nombre Completo</th>
                    <th>Rol Asignado</th>
                    <th>Estado</th>
                    <th>Fecha de Alta</th>
                    <th className="text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => {
                    const roleName = u.rol?.nombre?.replace('ROLE_', '') || 'CAJERO'
                    return (
                      <tr key={u.id}>
                        <td className="font-mono font-semibold text-primary-dark">
                          @{u.username}
                        </td>
                        <td className="font-medium">{u.nombre}</td>
                        <td>
                          <span
                            className={`badge ${
                              roleName === 'ADMIN' ? 'badge-primary' : 'badge-neutral'
                            }`}
                          >
                            {roleName}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              u.activo !== false ? 'badge-success' : 'badge-danger'
                            }`}
                          >
                            {u.activo !== false ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="text-xs text-muted">
                          {u.fechaCreacion
                            ? new Date(u.fechaCreacion).toLocaleDateString('es-PE', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '—'}
                        </td>
                        <td className="text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              className="btn-icon"
                              title="Editar usuario"
                              onClick={() => openEditModal(u)}
                            >
                              <IconEdit size={16} />
                            </button>
                            <button
                              className="btn-icon text-rose"
                              title="Desactivar usuario"
                              onClick={() => confirmDeleteUser(u)}
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
          )}
        </div>
      </div>

      {/* Modal: Crear / Editar Usuario */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">
                  {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                </h3>
                <p className="modal-subtitle">
                  {editingUser ? `Modificando @${editingUser.username}` : 'Crea una cuenta para cajero o administrador'}
                </p>
              </div>
              <button className="btn-close" onClick={() => setShowModal(false)}>
                <IconClose size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveUser}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nombre Completo *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                    placeholder="Ej. Juan Pérez"
                  />
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Nombre de Usuario (@) *</label>
                    <input
                      type="text"
                      className="form-input font-mono"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      required={!editingUser}
                      disabled={!!editingUser}
                      placeholder="jperez"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Rol del Sistema *</label>
                    <select
                      className="form-select"
                      value={formData.rolId}
                      onChange={(e) => setFormData({ ...formData, rolId: e.target.value })}
                    >
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.nombre?.replace('ROLE_', '')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {editingUser ? 'Nueva Contraseña (dejar en blanco para no cambiar)' : 'Contraseña *'}
                  </label>
                  <input
                    type="password"
                    className="form-input"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!editingUser}
                    placeholder="••••••••"
                  />
                </div>

                {editingUser && (
                  <div className="form-group mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.activo}
                        onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                      />
                      <span className="text-sm font-semibold">Usuario activo en la plataforma</span>
                    </label>
                  </div>
                )}
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
                  {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación para Desactivar Usuario */}
      <ConfirmModal
        isOpen={!!userToDelete}
        onClose={() => !isDeleting && setUserToDelete(null)}
        onConfirm={executeDeleteUser}
        type="danger"
        icon={<IconTrash size={28} />}
        title="¿Desactivar usuario del sistema?"
        message="El usuario perderá inmediatamente el acceso a la plataforma y no podrá registrar ventas ni acceder a los módulos."
        detailItem={
          userToDelete && {
            title: userToDelete.nombre,
            badge: `@${userToDelete.username}`,
            subtitle: `Rol: ${userToDelete.rol?.nombre?.replace('ROLE_', '') || 'USUARIO'}`,
          }
        }
        confirmText="Sí, desactivar usuario"
        cancelText="Conservar usuario"
        loading={isDeleting}
      />

      {/* Animación de Check para Agregar, Editar y Eliminar Usuario */}
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
