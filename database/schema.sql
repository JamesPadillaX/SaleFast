-- Script de creación de tablas para PostgreSQL / Supabase con identificadores UUID
-- Sistema de Gestión de Inventario y Ventas para Minimarket

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. TABLA: roles
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(50) NOT NULL UNIQUE
);

-- 2. TABLA: usuarios
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    rol_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABLA: categorias
CREATE TABLE categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion VARCHAR(255),
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABLA: productos
CREATE TABLE productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_barras VARCHAR(100) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    categoria_id UUID NOT NULL REFERENCES categorias(id) ON DELETE RESTRICT,
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

-- 5. TABLA: proveedores
CREATE TABLE proveedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(150) NOT NULL,
    ruc VARCHAR(11) NOT NULL UNIQUE CHECK (length(ruc) = 11),
    telefono VARCHAR(20),
    direccion VARCHAR(255),
    correo VARCHAR(100)
);

-- 6. TABLA: clientes
CREATE TABLE clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(150) NOT NULL,
    dni VARCHAR(8) NOT NULL UNIQUE CHECK (length(dni) = 8),
    telefono VARCHAR(20),
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. TABLA: compras
CREATE TABLE compras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proveedor_id UUID NOT NULL REFERENCES proveedores(id) ON DELETE RESTRICT,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total >= 0)
);

-- 8. TABLA: detalle_compras
CREATE TABLE detalle_compras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    compra_id UUID NOT NULL REFERENCES compras(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    cantidad NUMERIC(10, 2) NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(10, 2) NOT NULL CHECK (precio_unitario >= 0),
    subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0)
);

-- 9. TABLA: ventas
CREATE TABLE ventas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES clientes(id) ON DELETE RESTRICT,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    igv NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (igv >= 0),
    total NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total >= 0),
    metodo_pago VARCHAR(20) NOT NULL CHECK (metodo_pago IN ('Efectivo', 'Tarjeta', 'Yape', 'Plin'))
);

-- 10. TABLA: detalle_ventas
CREATE TABLE detalle_ventas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venta_id UUID NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    cantidad NUMERIC(10, 2) NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(10, 2) NOT NULL CHECK (precio_unitario >= 0),
    subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0)
);

-- 11. TABLA: movimientos_inventario
CREATE TABLE movimientos_inventario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('Entrada', 'Salida', 'Ajuste')),
    cantidad NUMERIC(10, 2) NOT NULL,
    motivo VARCHAR(255) NOT NULL,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimizar búsquedas frecuentes
CREATE INDEX idx_productos_codigo_barras ON productos(codigo_barras);
CREATE INDEX idx_productos_nombre ON productos(nombre);
CREATE INDEX idx_ventas_fecha ON ventas(fecha);
CREATE INDEX idx_compras_fecha ON compras(fecha);
CREATE INDEX idx_clientes_dni ON clientes(dni);
CREATE INDEX idx_proveedores_ruc ON proveedores(ruc);
