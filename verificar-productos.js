const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function verificarProductos() {
  console.log('🔍 Verificando productos en Supabase...\n');
  
  // Verificar algunos productos específicos con precios actualizados
  const productosAVerificar = [
    'Pambazo de Chorizo con Papas',
    'Tostada de Pata de Res',
    'Hot-Dog',
    'Chilaquiles Rojos Chicos',
    'Quesadilla de Papa',
    'Torta de Salchicha',
    'Coca-Cola',
    'Taco de Cecina'
  ];

  for (const nombre of productosAVerificar) {
    const { data, error } = await supabase
      .from('productos')
      .select('nombre, precio, disponible')
      .ilike('nombre', nombre)
      .single();

    if (data) {
      console.log(`✅ ${data.nombre}: $${data.precio} ${data.disponible ? '(Disponible)' : '(No disponible)'}`);
    } else {
      console.log(`❌ No encontrado: ${nombre}`);
    }
  }

  // Contar total de productos
  const { count } = await supabase
    .from('productos')
    .select('*', { count: 'exact', head: true });

  console.log(`\n📊 Total de productos en base de datos: ${count}`);
  console.log('\n✅ Verificación completada');
}

verificarProductos();
