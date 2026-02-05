const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function testQuery() {
  console.log('🧪 Probando la query de productos...\n');
  
  // Test 1: Obtener todos los productos
  const { data: todos, error: e1 } = await supabase
    .from('productos')
    .select('*, categorias(nombre)')
    .eq('disponible', true)
    .limit(5);
  
  console.log('✅ Test 1: Primeros 5 productos:');
  console.log(JSON.stringify(todos, null, 2));
  
  // Test 2: Filtrar por subcategoría Licuados (ID 27)
  console.log('\n\n🔍 Test 2: Filtrar por subcategoria_id = 27 (Licuados):');
  const { data: licuados, error: e2 } = await supabase
    .from('productos')
    .select('*, categorias(nombre)')
    .eq('subcategoria_id', 27)
    .eq('disponible', true);
  
  console.log(`Encontrados: ${licuados?.length || 0}`);
  console.log(JSON.stringify(licuados, null, 2));
  
  // Test 3: Query con OR para Bebidas (ID 23)
  console.log('\n\n🔍 Test 3: Query OR para Bebidas (categoria 23):');
  const { data: bebidas, error: e3 } = await supabase
    .from('productos')
    .select('*, categorias(nombre)')
    .or(`categoria_id.eq.23,subcategoria_id.eq.23`)
    .eq('disponible', true);
  
  console.log(`Encontrados: ${bebidas?.length || 0}`);
  if (e3) console.log('Error:', e3);
  
  // Test 4: Sin filtros
  console.log('\n\n🔍 Test 4: Todos los productos sin filtro:');
  const { data: all } = await supabase
    .from('productos')
    .select('id, nombre, categoria_id, subcategoria_id')
    .eq('disponible', true);
  
  console.log(`Total productos: ${all?.length || 0}`);
}

testQuery();
