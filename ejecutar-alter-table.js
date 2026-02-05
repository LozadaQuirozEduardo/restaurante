const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

async function ejecutarSQL() {
  console.log('🔧 Ejecutando ALTER TABLE directamente...\n')

  try {
    // Primero, vamos a verificar si las columnas ya existen
    const { data: columnas, error: errorConsulta } = await supabase
      .from('categorias')
      .select('*')
      .limit(1)

    if (errorConsulta) {
      console.log('❌ Error consultando categorias:', errorConsulta.message)
      return
    }

    console.log('📋 Columnas actuales en categorias:', Object.keys(columnas[0] || {}))

    // Intentar obtener la estructura con RPC
    console.log('\n📝 Necesitas ejecutar este SQL en el Editor SQL de Supabase:')
    console.log('='* 60)
    console.log(`
-- Paso 1: Modificar tabla categorias
ALTER TABLE categorias 
ADD COLUMN IF NOT EXISTS categoria_padre_id INTEGER REFERENCES categorias(id),
ADD COLUMN IF NOT EXISTS orden INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS icono TEXT,
ADD COLUMN IF NOT EXISTS descripcion TEXT;

-- Paso 2: Crear índice
CREATE INDEX IF NOT EXISTS idx_categorias_padre ON categorias(categoria_padre_id);

-- Paso 3: Modificar tabla productos
ALTER TABLE productos 
ADD COLUMN IF NOT EXISTS subcategoria_id INTEGER REFERENCES categorias(id),
ADD COLUMN IF NOT EXISTS orden INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS imagen_url TEXT;

-- Paso 4: Crear índice
CREATE INDEX IF NOT EXISTS idx_productos_subcategoria ON productos(subcategoria_id);
    `)
    console.log('=' * 60)
    console.log('\n📍 Instrucciones:')
    console.log('1. Ve a https://supabase.com/dashboard')
    console.log('2. Selecciona tu proyecto')
    console.log('3. Ve a SQL Editor')
    console.log('4. Copia y pega el SQL de arriba')
    console.log('5. Haz clic en "Run"')
    console.log('6. Vuelve a ejecutar "node crear-categorias-nuevas.js"')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

ejecutarSQL()
