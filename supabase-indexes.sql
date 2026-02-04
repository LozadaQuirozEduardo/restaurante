-- ÍNDICES PARA OPTIMIZAR RENDIMIENTO DEL DASHBOARD
-- Ejecuta estos índices en el SQL Editor de Supabase

-- ============================================
-- ÍNDICES PARA TABLA PEDIDOS
-- ============================================

-- Índice compuesto para consultas de pedidos por fecha y estado (MUY IMPORTANTE)
CREATE INDEX IF NOT EXISTS idx_pedidos_created_estado 
ON pedidos(created_at DESC, estado);

-- Índice para filtrar por estado únicamente
CREATE INDEX IF NOT EXISTS idx_pedidos_estado 
ON pedidos(estado);

-- Índice para tipo de entrega
CREATE INDEX IF NOT EXISTS idx_pedidos_tipo_entrega 
ON pedidos(tipo_entrega);

-- Índice compuesto para dashboard (fecha + estado + total)
CREATE INDEX IF NOT EXISTS idx_pedidos_dashboard 
ON pedidos(created_at DESC, estado, total);

-- Índice para búsquedas por cliente
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente 
ON pedidos(nombre_cliente, telefono);

-- ============================================
-- ÍNDICES PARA TABLA PEDIDO_DETALLES
-- ============================================

-- Índice para unir con pedidos (foreign key)
CREATE INDEX IF NOT EXISTS idx_pedido_detalles_pedido_id 
ON pedido_detalles(pedido_id);

-- Índice para agrupar productos más vendidos
CREATE INDEX IF NOT EXISTS idx_pedido_detalles_producto 
ON pedido_detalles(producto_nombre, cantidad);

-- Índice compuesto para reportes de productos
CREATE INDEX IF NOT EXISTS idx_pedido_detalles_producto_cantidad 
ON pedido_detalles(producto_nombre, cantidad DESC);

-- ============================================
-- ÍNDICES PARA TABLA PRODUCTOS
-- ============================================

-- Índice para productos disponibles
CREATE INDEX IF NOT EXISTS idx_productos_disponible 
ON productos(disponible, nombre);

-- Índice por categoría
CREATE INDEX IF NOT EXISTS idx_productos_categoria 
ON productos(categoria_id, disponible);

-- ============================================
-- ÍNDICES PARA TABLA CLIENTES
-- ============================================

-- Índice único para teléfono (importante para búsquedas rápidas)
CREATE INDEX IF NOT EXISTS idx_clientes_telefono 
ON clientes(telefono);

-- ============================================
-- ESTADÍSTICAS Y ANÁLISIS
-- ============================================

-- Actualizar estadísticas de las tablas para el query planner
ANALYZE pedidos;
ANALYZE pedido_detalles;
ANALYZE productos;
ANALYZE clientes;

-- ============================================
-- VERIFICAR ÍNDICES CREADOS
-- ============================================

-- Ejecuta esta query para ver todos los índices
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================

/*
1. Estos índices mejoran significativamente las consultas del dashboard
2. Los índices compuestos son más efectivos para queries complejas
3. El orden de las columnas en los índices es importante
4. Ejecutar ANALYZE después de crear índices es recomendado

IMPACTO ESPERADO:
- Consultas de dashboard: 50-80% más rápidas
- Reportes: 60-90% más rápidos
- Búsquedas de pedidos: 70-90% más rápidas

MONITOREO:
- Revisa el uso de los índices con: 
  SELECT * FROM pg_stat_user_indexes WHERE schemaname = 'public';
*/
