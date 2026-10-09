import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { IconStore } from '../components/Icons'

export default function LoginPage() {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Usuario o contraseña incorrectos')
      }

      login(data.token, {
        id: data.id,
        nombre: data.nombre,
        username: data.username,
        rol: data.rol,
      })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Error al conectar con el servidor')
    } finally {
      setLoading(false)
    }
  }

  function fillCreds(u, p) {
    setUsername(u)
    setPassword(p)
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon-box">
            <IconStore size={32} />
          </div>
          <h2 className="login-title">Sale Fast POS</h2>
          <p className="login-subtitle">Sistema de Punto de Venta Profesional</p>
        </div>

        {error && (
          <div className="login-error-alert">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label" htmlFor="username">Usuario</label>
            <input
              id="username"
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ej. admin"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={loading}
          >
            {loading ? 'Iniciando sesión...' : 'Ingresar al Sistema'}
          </button>
        </form>

        <div className="login-demo-bar">
          <span className="demo-hint">Acceso rápido de prueba:</span>
          <div className="demo-buttons">
            <button
              type="button"
              className="btn-demo-pill"
              onClick={() => fillCreds('admin', 'admin123')}
            >
              👑 Admin (admin / admin123)
            </button>
            <button
              type="button"
              className="btn-demo-pill"
              onClick={() => fillCreds('cajero', 'admin123')}
            >
              🛒 Cajero (cajero / admin123)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
