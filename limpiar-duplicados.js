const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function limpiarDuplicados() {
  console.log('🧹 Limpiando productos duplicados (versiones antiguas)...\n');

  // Lista de productos para eliminar las versiones viejas
  const productosParaLimpiar = [
    { nombre: 'Pambazo de Chorizo con Papas', precio_viejo: 90 },
    { nombre: 'Tostada de Pata de Res', precio_viejo: 35 },
    { nombre: 'Tostada de Tinga de Pollo', precio_viejo: 35 },
    { nombre: 'Tostada de Tinga de Res', precio_viejo: 35 },
    { nombre: 'Hot-Dog', precio_viejo: 75 },
    { nombre: 'Caldo de Res Chico', precio_viejo: 95 },
    { nombre: 'Caldo de Pollo Chico', precio_viejo: 95 },
    { nombre: 'Pancita de Res Chica', precio_viejo: 95 },
    { nombre: 'Pancita de Res Grande', precio_viejo: 105 },
    { nombre: 'Hot Cakes con Huevo y Tocino', precio_viejo: 110 },
    { nombre: 'Chilaquiles Rojos Chicos', precio_viejo: 125 },
    { nombre: 'Chilaquiles Rojos Grandes', precio_viejo: 145 },
    { nombre: 'Chilaquiles Verdes Chicos', precio_viejo: 125 },
    { nombre: 'Chilaquiles Verdes Grandes', precio_viejo: 145 },
    { nombre: 'Enchiladas Verdes', precio_viejo: 135 },
    { nombre: 'Enchiladas Rojas', precio_viejo: 135 },
    { nombre: 'Enchiladas de Pollo', precio_viejo: 135 },
    { nombre: 'Enchiladas de Mole', precio_viejo: 135 },
    { nombre: 'Enfrijoladas de Pollo', precio_viejo: 135 },
    { nombre: 'Quesadilla de Papa', precio_viejo: 15 },
    { nombre: 'Quesadilla de Bisteck', precio_viejo: 25 },
    { nombre: 'Quesadilla de Tinga de Pollo', precio_viejo: 25 },
    { nombre: 'Quesadilla de Tinga de Res', precio_viejo: 25 },
    { nombre: 'Quesadilla de Papas con Rajas', precio_viejo: 25 },
    { nombre: 'Quesadilla de Hongos', precio_viejo: 25 },
    { nombre: 'Quesadilla de Picadillo', precio_viejo: 25 },
    { nombre: 'Torta de Salchicha', precio_viejo: 70 },
    { nombre: 'Torta de Huevo con Longaniza', precio_viejo: 70 },
    { nombre: 'Torta de Longaniza', precio_viejo: 70 },
    { nombre: 'Torta de Jamón', precio_viejo: 70 },
    { nombre: 'Torta de Milanesa de Pollo', precio_viejo: 85 },
    { nombre: 'Torta de Milanesa de Res', precio_viejo: 85 },
    { nombre: 'Sopa de Bisteck', precio_viejo: 45 },
    { nombre: 'Sopa de Huevo', precio_viejo: 45 },
    { nombre: 'Sopa de Pollo', precio_viejo: 45 },
    { nombre: 'Tacos Dorados de Res', precio_viejo: 45 },
    { nombre: 'Tacos Dorados de Pollo', precio_viejo: 45 },
    { nombre: 'Tacos Dorados de Papas con Longaniza', precio_viejo: 60 },
    { nombre: 'Fanta', precio_viejo: 25 },
    { nombre: 'Manzana', precio_viejo: 25 },
    { nombre: 'Sprite', precio_viejo: 25 },
    { nombre: 'Café de Olla', precio_viejo: 25 },
    { nombre: 'Té de Limón', precio_viejo: 25 },
    { nombre: 'Manzanilla', precio_viejo: 25 },
    { nombre: 'Jugo Natural', precio_viejo: 45 },
    { nombre: 'Jugo Verde', precio_viejo: 45 },
    { nombre: 'Jugo de Naranja', precio_viejo: 45 },
    { nombre: 'Jugo de Zanahoria', precio_viejo: 45 },
    { nombre: 'Licuado de Fresa', precio_viejo: 45 },
    { nombre: 'Licuado de Plátano', precio_viejo: 45 },
    { nombre: 'Licuado de Avena', precio_viejo: 45 },
    { nombre: 'Atole', precio_viejo: 25 },
  ];

  let eliminados = 0;
  let noEncontrados = 0;

  for (const producto of productosParaLimpiar) {
    const { data, error } = await supabase
      .from('productos')
      .delete()
      .eq('nombre', producto.nombre)
      .eq('precio', producto.precio_viejo);

    if (error) {
      console.log(`❌ Error eliminando ${producto.nombre}: ${error.message}`);
    } else if (data && data.length > 0) {
      console.log(`✅ Eliminado: ${producto.nombre} ($${producto.precio_viejo})`);
      eliminados++;
    } else {
      // No se encontró, probablemente ya fue eliminado o nunca existió
      noEncontrados++;
    }
  }

  console.log(`\n📊 Resumen:`);
  console.log(`   ✅ Productos eliminados: ${eliminados}`);
  console.log(`   ⚠️  No encontrados: ${noEncontrados}`);
  
  // Contar productos finales
  const { count } = await supabase
    .from('productos')
    .select('*', { count: 'exact', head: true });

  console.log(`   📦 Total productos ahora: ${count}`);
  console.log(`\n✅ Limpieza completada`);
}

limpiarDuplicados();
