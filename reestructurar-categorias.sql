-- ====================================
-- REESTRUCTURACIÓN DE CATEGORÍAS
-- Sistema con subcategorías
-- ====================================

-- 1. Agregar columna para subcategorías en la tabla categorias
ALTER TABLE categorias 
ADD COLUMN IF NOT EXISTS categoria_padre_id INTEGER REFERENCES categorias(id),
ADD COLUMN IF NOT EXISTS orden INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS icono TEXT,
ADD COLUMN IF NOT EXISTS descripcion TEXT;

-- 2. Crear índice para búsquedas más rápidas
CREATE INDEX IF NOT EXISTS idx_categorias_padre ON categorias(categoria_padre_id);

-- 3. Actualizar tabla productos para mejor organización
ALTER TABLE productos 
ADD COLUMN IF NOT EXISTS subcategoria_id INTEGER REFERENCES categorias(id),
ADD COLUMN IF NOT EXISTS orden INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS imagen_url TEXT;

-- 4. Crear índice
CREATE INDEX IF NOT EXISTS idx_productos_subcategoria ON productos(subcategoria_id);

-- ====================================
-- COMENTARIOS SOBRE LA NUEVA ESTRUCTURA
-- ====================================

-- CATEGORÍAS PRINCIPALES (categoria_padre_id = NULL):
-- - Pambazos
-- - Tostadas  
-- - Hamburguesas
-- - Caldos
-- - Desayunos
-- - Bebidas (con subcategorías)
-- - etc.

-- SUBCATEGORÍAS (categoria_padre_id = ID de categoría padre):
-- Solo para Bebidas inicialmente:
-- - Refrescos
-- - Aguas Frescas
-- - Jugos
-- - Licuados
-- - Atoles

-- PRODUCTOS:
-- - categoria_id: Categoría principal
-- - subcategoria_id: Subcategoría (opcional, solo si la categoría la tiene)
