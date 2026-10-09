-- ====================================================================
-- ESQUEMA COMPLETO Y ESCALABLE PARA SUPABASE (SCHEMA PUBLIC)
-- Esto permite que todas las tablas sean visibles en el "Table Editor"
-- del Dashboard de Supabase y en las APIs de Supabase.
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

SET search_path TO public;

-- 1. Tabla: roles
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(50) NOT NULL UNIQUE
);

-- 2. Tabla: usuarios
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    rol_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla: categorias
CREATE TABLE IF NOT EXISTS public.categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion VARCHAR(255),
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabla: productos
CREATE TABLE IF NOT EXISTS public.productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_barras VARCHAR(100) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    categoria_id UUID NOT NULL REFERENCES public.categorias(id) ON DELETE RESTRICT,
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

-- 5. Tabla: proveedores
CREATE TABLE IF NOT EXISTS public.proveedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(150) NOT NULL,
    ruc VARCHAR(11) NOT NULL UNIQUE CHECK (length(ruc) = 11),
    telefono VARCHAR(20),
    direccion VARCHAR(255),
    correo VARCHAR(100)
);

-- 6. Tabla: clientes
CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(150) NOT NULL,
    dni VARCHAR(8) NOT NULL UNIQUE CHECK (length(dni) = 8),
    telefono VARCHAR(20),
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tabla: compras
CREATE TABLE IF NOT EXISTS public.compras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proveedor_id UUID NOT NULL REFERENCES public.proveedores(id) ON DELETE RESTRICT,
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE RESTRICT,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total >= 0)
);

-- 8. Tabla: detalle_compras
CREATE TABLE IF NOT EXISTS public.detalle_compras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    compra_id UUID NOT NULL REFERENCES public.compras(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES public.productos(id) ON DELETE RESTRICT,
    cantidad NUMERIC(10, 2) NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(10, 2) NOT NULL CHECK (precio_unitario >= 0),
    subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0)
);

-- 9. Tabla: ventas
CREATE TABLE IF NOT EXISTS public.ventas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE RESTRICT,
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE RESTRICT,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    igv NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (igv >= 0),
    total NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total >= 0),
    metodo_pago VARCHAR(20) NOT NULL CHECK (metodo_pago IN ('Efectivo', 'Tarjeta', 'Yape', 'Plin'))
);

-- 10. Tabla: detalle_ventas
CREATE TABLE IF NOT EXISTS public.detalle_ventas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venta_id UUID NOT NULL REFERENCES public.ventas(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES public.productos(id) ON DELETE RESTRICT,
    cantidad NUMERIC(10, 2) NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(10, 2) NOT NULL CHECK (precio_unitario >= 0),
    subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0)
);

-- 11. Tabla: movimientos_inventario
CREATE TABLE IF NOT EXISTS public.movimientos_inventario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id UUID NOT NULL REFERENCES public.productos(id) ON DELETE RESTRICT,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('Entrada', 'Salida', 'Ajuste')),
    cantidad NUMERIC(10, 2) NOT NULL,
    motivo VARCHAR(255) NOT NULL,
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE RESTRICT,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices B-Tree en public
CREATE INDEX IF NOT EXISTS idx_productos_codigo_barras ON public.productos(codigo_barras);
CREATE INDEX IF NOT EXISTS idx_productos_nombre ON public.productos(nombre);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON public.productos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON public.ventas(fecha);
CREATE INDEX IF NOT EXISTS idx_ventas_usuario ON public.ventas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_ventas_cliente ON public.ventas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_compras_fecha ON public.compras(fecha);
CREATE INDEX IF NOT EXISTS idx_clientes_dni ON public.clientes(dni);
CREATE INDEX IF NOT EXISTS idx_proveedores_ruc ON public.proveedores(ruc);
CREATE INDEX IF NOT EXISTS idx_movimientos_producto ON public.movimientos_inventario(producto_id);

-- Inserción de Roles Iniciales
INSERT INTO public.roles (id, nombre) VALUES 
('a0000000-0000-0000-0000-000000000001', 'ROLE_ADMIN'),
('a0000000-0000-0000-0000-000000000002', 'ROLE_EMPLOYEE')
ON CONFLICT (nombre) DO NOTHING;

-- Inserción de Usuarios Iniciales (Password: admin123)
INSERT INTO public.usuarios (id, username, password, nombre, rol_id, activo) VALUES
('b0000000-0000-0000-0000-000000000001', 'admin', '$2a$10$R9h/lIPMD9s1Eqz.fKpH8u9Q3G7vS/nE8bspUaL5eU.nC9qU7M77u', 'Administrador Principal', 'a0000000-0000-0000-0000-000000000001', true),
('b0000000-0000-0000-0000-000000000002', 'cajero', '$2a$10$R9h/lIPMD9s1Eqz.fKpH8u9Q3G7vS/nE8bspUaL5eU.nC9qU7M77u', 'Cajero de Turno', 'a0000000-0000-0000-0000-000000000002', true)
ON CONFLICT (username) DO NOTHING;
