const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function crearCategoriasNuevas() {
  console.log('🎨 Creando nueva estructura de categorías...\n');

  try {
    // PASO 1: Eliminar categorías viejas (SOLO las categorías, NO los productos)
    console.log('📋 Paso 1: Limpiando categorías antiguas...');
    
    // Primero, poner categoria_id en NULL en todos los productos
    await supabase
      .from('productos')
      .update({ categoria_id: null })
      .neq('id', 0);

    // Ahora eliminar las categorías
    const { error: errorDelete } = await supabase
      .from('categorias')
      .delete()
      .neq('id', 0); // Eliminar todas

    if (errorDelete) {
      console.log(`   ⚠️  ${errorDelete.message}`);
    } else {
      console.log('   ✅ Categorías antiguas eliminadas\n');
    }

    // PASO 2: Crear categorías principales
    console.log('📋 Paso 2: Creando categorías principales...');

    const categoriasPrincipales = [
      { nombre: 'Pambazos', descripcion: 'Pambazos al gusto', icono: '🌮', orden: 1 },
      { nombre: 'Tostadas', descripcion: 'Tostadas variadas', icono: '🫓', orden: 2 },
      { nombre: 'Hamburguesas y Hot Dogs', descripcion: 'Con papas y tocino', icono: '🍔', orden: 3 },
      { nombre: 'Caldos', descripcion: 'Caldos caseros', icono: '🍲', orden: 4 },
      { nombre: 'Desayunos', descripcion: 'Desayunos completos', icono: '🍳', orden: 5 },
      { nombre: 'Hot Cakes', descripcion: 'Hot cakes con complementos', icono: '🥞', orden: 6 },
      { nombre: 'Chilaquiles', descripcion: 'Rojos y verdes', icono: '🌶️', orden: 7 },
      { nombre: 'Enchiladas', descripcion: 'Verdes, rojas y de mole', icono: '🫔', orden: 8 },
      { nombre: 'Enfrijoladas', descripcion: 'Con frijoles', icono: '🫘', orden: 9 },
      { nombre: 'Quesadillas', descripcion: 'Quesadillas variadas', icono: '🧀', orden: 10 },
      { nombre: 'Tortas', descripcion: 'Tortas mexicanas', icono: '🥖', orden: 11 },
      { nombre: 'Sopes', descripcion: 'Sopes tradicionales', icono: '🫔', orden: 12 },
      { nombre: 'Tacos Dorados', descripcion: 'Tacos dorados crujientes', icono: '🌮', orden: 13 },
      { nombre: 'Tacos Especiales', descripcion: 'Cecina, bisteck, pollo y más', icono: '🌮', orden: 14 },
      { nombre: 'Burritos', descripcion: 'Burritos completos', icono: '🌯', orden: 15 },
      { nombre: 'Banderillas', descripcion: 'Con o sin papas', icono: '🍢', orden: 16 },
      { nombre: 'Extras', descripcion: 'Complementos', icono: '➕', orden: 17 },
      { nombre: 'Bebidas', descripcion: 'Bebidas variadas', icono: '🥤', orden: 18 },
    ];

    const categoriasCreadas = {};

    for (const cat of categoriasPrincipales) {
      const { data, error } = await supabase
        .from('categorias')
        .insert(cat)
        .select()
        .single();

      if (error) {
        console.log(`   ❌ Error creando ${cat.nombre}: ${error.message}`);
      } else {
        console.log(`   ✅ ${cat.nombre} creada`);
        categoriasCreadas[cat.nombre] = data.id;
      }
    }

    // PASO 3: Crear subcategorías para Bebidas
    console.log('\n📋 Paso 3: Creando subcategorías de Bebidas...');

    const bebidasId = categoriasCreadas['Bebidas'];

    const subcategoriasBebidas = [
      { nombre: 'Refrescos', categoria_padre_id: bebidasId, icono: '🥤', orden: 1 },
      { nombre: 'Aguas Frescas', categoria_padre_id: bebidasId, icono: '💧', orden: 2 },
      { nombre: 'Jugos', categoria_padre_id: bebidasId, icono: '🧃', orden: 3 },
      { nombre: 'Licuados', categoria_padre_id: bebidasId, icono: '🥤', orden: 4 },
      { nombre: 'Atoles', categoria_padre_id: bebidasId, icono: '☕', orden: 5 },
    ];

    for (const subcat of subcategoriasBebidas) {
      const { data, error } = await supabase
        .from('categorias')
        .insert(subcat)
        .select()
        .single();

      if (error) {
        console.log(`   ❌ Error creando ${subcat.nombre}: ${error.message}`);
      } else {
        console.log(`   ✅ ${subcat.nombre} creada`);
        categoriasCreadas[subcat.nombre] = data.id;
      }
    }

    console.log('\n✅ Estructura de categorías creada exitosamente!');
    console.log('\n📊 IDs de las categorías creadas:');
    Object.entries(categoriasCreadas).forEach(([nombre, id]) => {
      console.log(`   ${nombre}: ${id}`);
    });

    console.log('\n📝 Próximo paso: Ejecutar "node asignar-productos-categorias.js" para reorganizar los productos');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

crearCategoriasNuevas();
