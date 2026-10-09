import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'

import LoginPage from './pages/LoginPage'
import DashboardLayout from './components/DashboardLayout'
import DashboardPage from './pages/DashboardPage'
import ProductosPage from './pages/ProductosPage'
import CategoriasPage from './pages/CategoriasPage'
import InventarioPage from './pages/InventarioPage'
import VentasPage from './pages/VentasPage'
import ProveedoresPage from './pages/ProveedoresPage'
import UsuariosPage from './pages/UsuariosPage'
import POSPage from './pages/POSPage'

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth()
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />

        {/* Protected: layout wraps all dashboard pages */}
        <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="pos" element={<POSPage />} />
          <Route path="productos" element={<ProductosPage />} />
          <Route path="categorias" element={<CategoriasPage />} />
          <Route path="inventario" element={<InventarioPage />} />
          <Route path="ventas" element={<VentasPage />} />
          <Route path="proveedores" element={<ProveedoresPage />} />
          <Route path="usuarios" element={<UsuariosPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  )
}
