-- ================================================================
-- LIMPIEZA COMPLETA DE SUPABASE - MINIMARKET
-- Elimina TODOS los datos excepto roles y usuarios
-- ================================================================

-- Borrar en orden respetando foreign keys
DELETE FROM minimarket.movimientos_inventario;
DELETE FROM minimarket.detalle_ventas;
DELETE FROM minimarket.ventas;
DELETE FROM minimarket.detalle_compras;
DELETE FROM minimarket.compras;
DELETE FROM minimarket.clientes;
DELETE FROM minimarket.proveedores;
DELETE FROM minimarket.productos;
DELETE FROM minimarket.categorias;

-- Verificar lo que quedó
SELECT 'roles' AS tabla, COUNT(*) AS registros FROM minimarket.roles
UNION ALL
SELECT 'usuarios', COUNT(*) FROM minimarket.usuarios
UNION ALL
SELECT 'categorias', COUNT(*) FROM minimarket.categorias
UNION ALL
SELECT 'productos', COUNT(*) FROM minimarket.productos
UNION ALL
SELECT 'proveedores', COUNT(*) FROM minimarket.proveedores
UNION ALL
SELECT 'clientes', COUNT(*) FROM minimarket.clientes;
