-- Agregar columna tipo_entrega a la tabla pedidos
-- Ejecuta este SQL en el SQL Editor de Supabase

ALTER TABLE pedidos 
ADD COLUMN IF NOT EXISTS tipo_entrega VARCHAR(20) DEFAULT 'recoger';

-- Opcional: agregar un check constraint para validar los valores
ALTER TABLE pedidos 
ADD CONSTRAINT check_tipo_entrega 
CHECK (tipo_entrega IN ('delivery', 'recoger'));

-- Comentario descriptivo
COMMENT ON COLUMN pedidos.tipo_entrega IS 'Tipo de entrega del pedido: delivery o recoger';
