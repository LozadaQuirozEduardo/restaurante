const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function testQueryCorregida() {
  console.log('🧪 Probando la query corregida...\n');
  
  // Test 1: Query básica sin JOIN
  const { data: todos, error: e1 } = await supabase
    .from('productos')
    .select('*')
    .eq('disponible', true)
    .limit(5);
  
  console.log('✅ Test 1: Primeros 5 productos (sin JOIN):');
  console.log(`Encontrados: ${todos?.length || 0}`);
  if (todos && todos.length > 0) {
    console.log(JSON.stringify(todos[0], null, 2));
  }
  
  // Test 2: Filtrar por subcategoría Licuados (ID 27)
  console.log('\n\n🔍 Test 2: Filtrar por subcategoria_id = 27 (Licuados):');
  const { data: licuados, error: e2 } = await supabase
    .from('productos')
    .select('*')
    .eq('subcategoria_id', 27)
    .eq('disponible', true);
  
  console.log(`Encontrados: ${licuados?.length || 0}`);
  if (licuados && licuados.length > 0) {
    licuados.forEach(p => console.log(`  - ${p.nombre}`));
  }
  
  // Test 3: Query OR para Bebidas (ID 23)
  console.log('\n\n🔍 Test 3: Query OR para Bebidas (categoria 23):');
  const { data: bebidas, error: e3 } = await supabase
    .from('productos')
    .select('*')
    .or(`categoria_id.eq.23,subcategoria_id.eq.23`)
    .eq('disponible', true);
  
  console.log(`Encontrados: ${bebidas?.length || 0}`);
  if (e3) console.log('Error:', e3);
  
  // Test 4: Filtrar por categoria_id = 6 (Pambazos)
  console.log('\n\n🔍 Test 4: Filtrar por categoria_id = 6 (Pambazos):');
  const { data: pambazos, error: e4 } = await supabase
    .from('productos')
    .select('*')
    .eq('categoria_id', 6)
    .eq('disponible', true);
  
  console.log(`Encontrados: ${pambazos?.length || 0}`);
  if (pambazos && pambazos.length > 0) {
    pambazos.forEach(p => console.log(`  - ${p.nombre}`));
  }
}

testQueryCorregida();
