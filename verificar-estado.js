const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function verificar() {
  console.log('🔍 Verificando estado actual...\n');
  
  // Categorías
  const { data: categorias } = await supabase
    .from('categorias')
    .select('*')
    .order('id');
  
  console.log(`📁 Total categorías: ${categorias.length}`);
  categorias.forEach(cat => {
    const padre = cat.categoria_padre_id ? ` (Padre: ${cat.categoria_padre_id})` : '';
    console.log(`   ${cat.id}. ${cat.nombre}${padre}`);
  });
  
  // Productos
  const { data: productos } = await supabase
    .from('productos')
    .select('*')
    .eq('disponible', true);
  
  console.log(`\n🍽️  Total productos activos: ${productos.length}`);
  
  // Productos por categoría
  const porCategoria = {};
  productos.forEach(p => {
    const catId = p.categoria_id;
    if (!porCategoria[catId]) porCategoria[catId] = 0;
    porCategoria[catId]++;
  });
  
  console.log('\n📊 Productos por categoría:');
  Object.entries(porCategoria).forEach(([catId, count]) => {
    const cat = categorias.find(c => c.id === parseInt(catId));
    console.log(`   ${cat?.nombre || 'Sin categoría'}: ${count}`);
  });
}

verificar();
