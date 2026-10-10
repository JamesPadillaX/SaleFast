import { useAuth } from './useAuth'

/**
 * Hook para obtener el rol del usuario autenticado y utilidades de permisos.
 * Roles posibles: 'ADMIN' | 'EMPLOYEE'
 */
export function useRole() {
  const { user } = useAuth()

  // El backend envía el rol como "ROLE_ADMIN" o "ROLE_EMPLOYEE"
  const raw = user?.rol || user?.roles?.[0] || ''
  const role = raw.replace('ROLE_', '').toUpperCase()

  const isAdmin    = role === 'ADMIN'
  const isEmployee = role === 'EMPLOYEE' || role === 'CAJERO'

  return { role, isAdmin, isEmployee }
}
