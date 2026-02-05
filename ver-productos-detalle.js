const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function verProductosDetalle() {
  console.log('🔍 Analizando productos en Supabase...\n');
  
  // Ver todos los productos y buscar duplicados
  const { data: productos, error } = await supabase
    .from('productos')
    .select('id, nombre, precio, disponible, created_at')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('📋 Últimos 20 productos agregados:\n');
  productos.forEach((p, i) => {
    const fecha = new Date(p.created_at).toLocaleString('es-MX');
    console.log(`${i + 1}. ${p.nombre} - $${p.precio} (ID: ${p.id}) - ${fecha}`);
  });

  // Buscar productos con nombres similares a los que intentamos verificar
  console.log('\n\n🔎 Buscando productos con "Pambazo"...');
  const { data: pambazos } = await supabase
    .from('productos')
    .select('nombre, precio')
    .ilike('nombre', '%pambazo%');
  
  if (pambazos) {
    pambazos.forEach(p => console.log(`   ${p.nombre}: $${p.precio}`));
  }

  console.log('\n🔎 Buscando productos con "Tostada"...');
  const { data: tostadas } = await supabase
    .from('productos')
    .select('nombre, precio')
    .ilike('nombre', '%tostada%');
  
  if (tostadas) {
    tostadas.forEach(p => console.log(`   ${p.nombre}: $${p.precio}`));
  }

  console.log('\n🔎 Buscando productos con "Taco"...');
  const { data: tacos } = await supabase
    .from('productos')
    .select('nombre, precio')
    .ilike('nombre', '%taco%')
    .limit(10);
  
  if (tacos) {
    tacos.forEach(p => console.log(`   ${p.nombre}: $${p.precio}`));
  }

  // Contar productos por categoría
  console.log('\n\n📊 Productos por categoría:');
  const { data: categorias } = await supabase
    .from('categorias')
    .select('id, nombre');

  for (const cat of categorias) {
    const { count } = await supabase
      .from('productos')
      .select('*', { count: 'exact', head: true })
      .eq('categoria_id', cat.id);
    
    console.log(`   ${cat.nombre}: ${count} productos`);
  }
}

verProductosDetalle();
