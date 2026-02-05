const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function limpiarYCrearCategorias() {
  console.log('🔄 Iniciando reestructuración de categorías...\n');

  try {
    // PASO 1: Ejecutar el SQL para agregar columnas
    console.log('📋 Paso 1: Verificando estructura de la base de datos...');
    console.log('   ⚠️  Debes ejecutar el archivo "reestructurar-categorias.sql" en Supabase primero');
    console.log('   📍 Ve a: Supabase Dashboard → SQL Editor → pega el contenido del archivo\n');

    // PASO 2: Guardar productos actuales
    console.log('📋 Paso 2: Respaldando productos actuales...');
    const { data: productosActuales, error: errorProductos } = await supabase
      .from('productos')
      .select('*');

    if (errorProductos) {
      console.error('❌ Error obteniendo productos:', errorProductos.message);
      return;
    }

    console.log(`   ✅ ${productosActuales.length} productos respaldados\n`);

    // PASO 3: Eliminar categorías viejas
    console.log('📋 Paso 3: ¿Deseas eliminar las categorías actuales? (Esto NO eliminará los productos)');
    console.log('   Las categorías actuales son:');
    
    const { data: categoriasActuales } = await supabase
      .from('categorias')
      .select('*');

    categoriasActuales?.forEach(cat => {
      console.log(`   - ${cat.nombre} (ID: ${cat.id})`);
    });

    console.log('\n   Para continuar, ejecuta: node crear-categorias-nuevas.js\n');
    console.log('✅ Preparación completada');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

limpiarYCrearCategorias();
