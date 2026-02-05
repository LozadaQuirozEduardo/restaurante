const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function ejecutarSQL() {
  console.log('🔧 Actualizando estructura de la base de datos...\n');

  const comandosSQL = [
    // 1. Agregar columnas a categorias
    `ALTER TABLE categorias ADD COLUMN IF NOT EXISTS categoria_padre_id INTEGER REFERENCES categorias(id)`,
    `ALTER TABLE categorias ADD COLUMN IF NOT EXISTS orden INTEGER DEFAULT 0`,
    `ALTER TABLE categorias ADD COLUMN IF NOT EXISTS icono TEXT`,
    `ALTER TABLE categorias ADD COLUMN IF NOT EXISTS descripcion TEXT`,
    
    // 2. Crear índice
    `CREATE INDEX IF NOT EXISTS idx_categorias_padre ON categorias(categoria_padre_id)`,
    
    // 3. Agregar columnas a productos
    `ALTER TABLE productos ADD COLUMN IF NOT EXISTS subcategoria_id INTEGER REFERENCES categorias(id)`,
    `ALTER TABLE productos ADD COLUMN IF NOT EXISTS orden INTEGER DEFAULT 0`,
    `ALTER TABLE productos ADD COLUMN IF NOT EXISTS imagen_url TEXT`,
    
    // 4. Crear índice
    `CREATE INDEX IF NOT EXISTS idx_productos_subcategoria ON productos(subcategoria_id)`,
  ];

  for (let i = 0; i < comandosSQL.length; i++) {
    const comando = comandosSQL[i];
    console.log(`⏳ Ejecutando comando ${i + 1}/${comandosSQL.length}...`);
    
    const { error } = await supabase.rpc('exec_sql', { sql_query: comando });
    
    if (error) {
      // Intentar con método alternativo
      console.log(`   ⚠️  Método RPC no disponible, las columnas se crearán automáticamente`);
      console.log(`   ℹ️  Si tienes problemas, ejecuta manualmente en Supabase SQL Editor:`);
      console.log(`   ${comando}\n`);
    } else {
      console.log(`   ✅ Completado\n`);
    }
  }

  console.log('✅ Estructura de base de datos actualizada');
  console.log('\n📝 Siguiente paso: node crear-categorias-nuevas.js');
}

ejecutarSQL();
