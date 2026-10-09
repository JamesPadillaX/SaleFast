-- ====================================================================
-- ESQUEMA COMPLETO Y ESCALABLE PARA SUPABASE (POSTGRESQL 15+)
-- Sistema de Gestión de Inventario y Ventas - Minimarket POS
-- ====================================================================

-- 1. Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Esquema dedicado
CREATE SCHEMA IF NOT EXISTS minimarket;
SET search_path TO minimarket, public;

-- 3. Tabla de Roles
CREATE TABLE IF NOT EXISTS minimarket.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(50) NOT NULL UNIQUE
);

-- 4. Tabla de Usuarios
CREATE TABLE IF NOT EXISTS minimarket.usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    rol_id UUID NOT NULL REFERENCES minimarket.roles(id) ON DELETE RESTRICT,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabla de Categorías
CREATE TABLE IF NOT EXISTS minimarket.categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion VARCHAR(255),
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabla de Productos
CREATE TABLE IF NOT EXISTS minimarket.productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_barras VARCHAR(100) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    categoria_id UUID NOT NULL REFERENCES minimarket.categorias(id) ON DELETE RESTRICT,
    descripcion TEXT,
    precio_compra NUMERIC(10, 2) NOT NULL CHECK (precio_compra >= 0),
    precio_venta NUMERIC(10, 2) NOT NULL CHECK (precio_venta >= 0),
    stock NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (stock >= 0),
    stock_minimo NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (stock_minimo >= 0),
    unidad_medida VARCHAR(20) NOT NULL CHECK (unidad_medida IN ('unidad', 'kilogramo', 'litro', 'paquete', 'caja')),
    imagen_url TEXT,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tabla de Proveedores
CREATE TABLE IF NOT EXISTS minimarket.proveedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(150) NOT NULL,
    ruc VARCHAR(11) NOT NULL UNIQUE CHECK (length(ruc) = 11),
    telefono VARCHAR(20),
    direccion VARCHAR(255),
    correo VARCHAR(100)
);

-- 8. Tabla de Clientes
CREATE TABLE IF NOT EXISTS minimarket.clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(150) NOT NULL,
    dni VARCHAR(8) NOT NULL UNIQUE CHECK (length(dni) = 8),
    telefono VARCHAR(20),
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Tabla de Compras (Abastecimiento)
CREATE TABLE IF NOT EXISTS minimarket.compras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proveedor_id UUID NOT NULL REFERENCES minimarket.proveedores(id) ON DELETE RESTRICT,
    usuario_id UUID NOT NULL REFERENCES minimarket.usuarios(id) ON DELETE RESTRICT,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total >= 0)
);

-- 10. Detalle de Compras
CREATE TABLE IF NOT EXISTS minimarket.detalle_compras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    compra_id UUID NOT NULL REFERENCES minimarket.compras(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES minimarket.productos(id) ON DELETE RESTRICT,
    cantidad NUMERIC(10, 2) NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(10, 2) NOT NULL CHECK (precio_unitario >= 0),
    subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0)
);

-- 11. Tabla de Ventas (POS)
CREATE TABLE IF NOT EXISTS minimarket.ventas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES minimarket.clientes(id) ON DELETE RESTRICT,
    usuario_id UUID NOT NULL REFERENCES minimarket.usuarios(id) ON DELETE RESTRICT,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    igv NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (igv >= 0),
    total NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total >= 0),
    metodo_pago VARCHAR(20) NOT NULL CHECK (metodo_pago IN ('Efectivo', 'Tarjeta', 'Yape', 'Plin'))
);

-- 12. Detalle de Ventas
CREATE TABLE IF NOT EXISTS minimarket.detalle_ventas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venta_id UUID NOT NULL REFERENCES minimarket.ventas(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES minimarket.productos(id) ON DELETE RESTRICT,
    cantidad NUMERIC(10, 2) NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(10, 2) NOT NULL CHECK (precio_unitario >= 0),
    subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0)
);

-- 13. Movimientos de Inventario (Kardex)
CREATE TABLE IF NOT EXISTS minimarket.movimientos_inventario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id UUID NOT NULL REFERENCES minimarket.productos(id) ON DELETE RESTRICT,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('Entrada', 'Salida', 'Ajuste')),
    cantidad NUMERIC(10, 2) NOT NULL,
    motivo VARCHAR(255) NOT NULL,
    usuario_id UUID NOT NULL REFERENCES minimarket.usuarios(id) ON DELETE RESTRICT,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. Índices para Alto Rendimiento (B-Tree)
CREATE INDEX IF NOT EXISTS idx_productos_codigo_barras ON minimarket.productos(codigo_barras);
CREATE INDEX IF NOT EXISTS idx_productos_nombre ON minimarket.productos(nombre);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON minimarket.productos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON minimarket.ventas(fecha);
CREATE INDEX IF NOT EXISTS idx_ventas_usuario ON minimarket.ventas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_ventas_cliente ON minimarket.ventas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_compras_fecha ON minimarket.compras(fecha);
CREATE INDEX IF NOT EXISTS idx_clientes_dni ON minimarket.clientes(dni);
CREATE INDEX IF NOT EXISTS idx_proveedores_ruc ON minimarket.proveedores(ruc);
CREATE INDEX IF NOT EXISTS idx_movimientos_producto ON minimarket.movimientos_inventario(producto_id);

-- 15. Inserción de Roles Iniciales
INSERT INTO minimarket.roles (id, nombre) VALUES 
('a0000000-0000-0000-0000-000000000001', 'ROLE_ADMIN'),
('a0000000-0000-0000-0000-000000000002', 'ROLE_EMPLOYEE')
ON CONFLICT (nombre) DO NOTHING;

-- 16. Inserción de Usuarios Iniciales (Password: admin123)
INSERT INTO minimarket.usuarios (id, username, password, nombre, rol_id, activo) VALUES
('b0000000-0000-0000-0000-000000000001', 'admin', '$2a$10$R9h/lIPMD9s1Eqz.fKpH8u9Q3G7vS/nE8bspUaL5eU.nC9qU7M77u', 'Administrador Principal', 'a0000000-0000-0000-0000-000000000001', true),
('b0000000-0000-0000-0000-000000000002', 'cajero', '$2a$10$R9h/lIPMD9s1Eqz.fKpH8u9Q3G7vS/nE8bspUaL5eU.nC9qU7M77u', 'Cajero de Turno', 'a0000000-0000-0000-0000-000000000002', true)
ON CONFLICT (username) DO NOTHING;
