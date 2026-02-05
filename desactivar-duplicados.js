const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function desactivarDuplicados() {
  console.log('🔄 Desactivando productos con precios antiguos...\n');

  // Estrategia: Para cada producto duplicado, desactivar el más viejo (menor ID)
  const productosDuplicados = [
    'Pambazo de Chorizo con Papas',
    'Tostada de Pata de Res',
    'Tostada de Tinga de Pollo',
    'Tostada de Tinga de Res',
    'Hot-Dog',
    'Caldo de Res Chico',
    'Caldo de Pollo Chico',
    'Pancita de Res Chica',
    'Pancita de Res Grande',
    'Hot Cakes con Huevo y Tocino',
    'Chilaquiles Rojos Chicos',
    'Chilaquiles Rojos Grandes',
    'Chilaquiles Verdes Chicos',
    'Chilaquiles Verdes Grandes',
    'Enchiladas Verdes',
    'Enchiladas Rojas',
    'Enchiladas de Pollo',
    'Enchiladas de Mole',
    'Enfrijoladas de Pollo',
    'Quesadilla de Papa',
    'Quesadilla de Bisteck',
    'Quesadilla de Tinga de Pollo',
    'Quesadilla de Tinga de Res',
    'Quesadilla de Papas con Rajas',
    'Quesadilla de Hongos',
    'Quesadilla de Picadillo',
    'Torta de Salchicha',
    'Torta de Huevo con Longaniza',
    'Torta de Longaniza',
    'Torta de Jamón',
    'Torta de Milanesa de Pollo',
    'Torta de Milanesa de Res',
    'Tacos Dorados de Res',
    'Tacos Dorados de Pollo',
    'Tacos Dorados de Papas con Longaniza',
    'Fanta',
    'Manzana',
    'Sprite',
    'Café de Olla',
    'Té de Limón',
    'Manzanilla',
    'Jugo Verde',
    'Jugo de Naranja',
    'Jugo de Zanahoria',
    'Licuado de Fresa',
    'Licuado de Plátano',
    'Licuado de Avena',
    'Atole',
  ];

  let desactivados = 0;
  let yaDesactivados = 0;

  for (const nombre of productosDuplicados) {
    // Buscar todos los productos con ese nombre
    const { data: productos } = await supabase
      .from('productos')
      .select('id, nombre, precio, disponible')
      .eq('nombre', nombre)
      .order('id', { ascending: true });

    if (productos && productos.length > 1) {
      // Hay duplicados, desactivar el más viejo (primer ID)
      const productoViejo = productos[0];
      const productoNuevo = productos[productos.length - 1];

      if (productoViejo.disponible) {
        const { error } = await supabase
          .from('productos')
          .update({ disponible: false })
          .eq('id', productoViejo.id);

        if (error) {
          console.log(`❌ Error: ${nombre} - ${error.message}`);
        } else {
          console.log(`✅ Desactivado: ${nombre} ($${productoViejo.precio} → ahora usa $${productoNuevo.precio})`);
          desactivados++;
        }
      } else {
        yaDesactivados++;
      }
    }
  }

  // También desactivar productos "Sopa" que ahora son "Sopes"
  const sopasViejas = ['Sopa de Bisteck', 'Sopa de Huevo', 'Sopa de Pollo'];
  for (const nombre of sopasViejas) {
    const { data: productos } = await supabase
      .from('productos')
      .select('id, nombre, precio, disponible')
      .eq('nombre', nombre);

    if (productos && productos.length > 0) {
      for (const prod of productos) {
        if (prod.disponible) {
          await supabase
            .from('productos')
            .update({ disponible: false })
            .eq('id', prod.id);
          
          console.log(`✅ Desactivado: ${nombre} (reemplazado por Sopes)`);
          desactivados++;
        }
      }
    }
  }

  // Desactivar "Jugo Natural" simple (ahora es Chico/Grande)
  const { data: jugoNatural } = await supabase
    .from('productos')
    .select('id, nombre, precio, disponible')
    .eq('nombre', 'Jugo Natural');

  if (jugoNatural && jugoNatural.length > 0) {
    for (const prod of jugoNatural) {
      if (prod.disponible) {
        await supabase
          .from('productos')
          .update({ disponible: false })
          .eq('id', prod.id);
        
        console.log(`✅ Desactivado: Jugo Natural (ahora es Chico/Grande)`);
        desactivados++;
      }
    }
  }

  console.log(`\n📊 Resumen:`);
  console.log(`   ✅ Productos desactivados: ${desactivados}`);
  console.log(`   ℹ️  Ya estaban desactivados: ${yaDesactivados}`);
  
  // Contar productos activos
  const { count } = await supabase
    .from('productos')
    .select('*', { count: 'exact', head: true })
    .eq('disponible', true);

  console.log(`   📦 Total productos ACTIVOS: ${count}`);
  console.log(`\n✅ Actualización completada - Solo se mostrarán productos con precios nuevos`);
}

desactivarDuplicados();
