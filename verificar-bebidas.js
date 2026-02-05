const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function verificarBebidas() {
  console.log('🍹 Verificando productos de bebidas...\n');
  
  const { data: productos } = await supabase
    .from('productos')
    .select('id, nombre, categoria_id, subcategoria_id, disponible')
    .eq('categoria_id', 23) // Bebidas
    .eq('disponible', true);
  
  console.log(`Total productos de Bebidas: ${productos.length}\n`);
  
  // Agrupar por subcategoría
  const subcategorias = {
    24: 'Refrescos',
    25: 'Aguas Frescas', 
    26: 'Jugos',
    27: 'Licuados',
    28: 'Atoles',
    null: 'Sin subcategoría'
  };
  
  Object.entries(subcategorias).forEach(([id, nombre]) => {
    const subId = id === 'null' ? null : parseInt(id);
    const prods = productos.filter(p => p.subcategoria_id === subId);
    if (prods.length > 0) {
      console.log(`\n📂 ${nombre} (ID: ${id}):`);
      prods.forEach(p => {
        console.log(`   - ${p.nombre} (ID: ${p.id}, cat: ${p.categoria_id}, subcat: ${p.subcategoria_id})`);
      });
    }
  });
}

verificarBebidas();
