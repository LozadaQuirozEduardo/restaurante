const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function asignarProductosCategorias() {
  console.log('📦 Asignando productos a nuevas categorías...\n');

  try {
    // Obtener todas las categorías
    const { data: categorias } = await supabase
      .from('categorias')
      .select('*');

    const catMap = {};
    categorias.forEach(cat => {
      catMap[cat.nombre] = cat.id;
    });

    console.log('📋 Categorías disponibles:');
    Object.keys(catMap).forEach(nombre => {
      console.log(`   ${nombre}: ${catMap[nombre]}`);
    });
    console.log('');

    // Mapeo de productos a categorías
    const asignaciones = [
      // PAMBAZOS
      { patron: /pambazo/i, categoria: 'Pambazos' },
      
      // TOSTADAS
      { patron: /tostada/i, categoria: 'Tostadas' },
      
      // HAMBURGUESAS Y HOT DOGS
      { patron: /hamburguesa|hot-dog/i, categoria: 'Hamburguesas y Hot Dogs' },
      
      // CALDOS
      { patron: /caldo|pancita|pozole/i, categoria: 'Caldos' },
      
      // DESAYUNOS
      { patron: /huevos|huevo/i, categoria: 'Desayunos' },
      
      // HOT CAKES
      { patron: /hot cake|hotcake/i, categoria: 'Hot Cakes' },
      
      // CHILAQUILES
      { patron: /chilaquiles/i, categoria: 'Chilaquiles' },
      
      // ENCHILADAS
      { patron: /enchiladas/i, categoria: 'Enchiladas' },
      
      // ENFRIJOLADAS
      { patron: /enfrijoladas/i, categoria: 'Enfrijoladas' },
      
      // QUESADILLAS
      { patron: /quesadilla/i, categoria: 'Quesadillas' },
      
      // TORTAS
      { patron: /torta/i, categoria: 'Tortas' },
      
      // SOPES
      { patron: /sope/i, categoria: 'Sopes' },
      
      // TACOS DORADOS
      { patron: /tacos dorados/i, categoria: 'Tacos Dorados' },
      
      // TACOS ESPECIALES
      { patron: /taco de|taco campechano/i, categoria: 'Tacos Especiales' },
      
      // BURRITOS
      { patron: /burrito/i, categoria: 'Burritos' },
      
      // BANDERILLAS
      { patron: /banderilla/i, categoria: 'Banderillas' },
      
      // EXTRAS
      { patron: /aros de cebolla|pan/i, categoria: 'Extras' },
    ];

    // Asignar categorías a productos normales
    let productosActualizados = 0;

    for (const asig of asignaciones) {
      const { data: productos } = await supabase
        .from('productos')
        .select('id, nombre')
        .ilike('nombre', `%${asig.patron.source.replace(/[^a-záéíóúñ ]/gi, '')}%`);

      if (productos) {
        for (const prod of productos) {
          if (asig.patron.test(prod.nombre)) {
            const { error } = await supabase
              .from('productos')
              .update({ categoria_id: catMap[asig.categoria] })
              .eq('id', prod.id);

            if (!error) {
              console.log(`✅ ${prod.nombre} → ${asig.categoria}`);
              productosActualizados++;
            }
          }
        }
      }
    }

    // BEBIDAS con subcategorías
    console.log('\n📋 Asignando bebidas a subcategorías...');

    const bebidasAsignaciones = [
      { nombres: ['Coca-Cola', 'Fanta', 'Manzana', 'Sprite'], subcategoria: 'Refrescos' },
      { nombres: ['Agua Fresca', 'Café de Olla', 'Té de Limón', 'Manzanilla'], subcategoria: 'Aguas Frescas' },
      { nombres: ['Jugo Natural Chico', 'Jugo Natural Grande', 'Jugo Verde', 'Jugo de Naranja', 'Jugo de Zanahoria'], subcategoria: 'Jugos' },
      { nombres: ['Licuado de Fresa', 'Licuado de Plátano', 'Licuado de Avena'], subcategoria: 'Licuados' },
      { nombres: ['Atole'], subcategoria: 'Atoles' },
    ];

    for (const asig of bebidasAsignaciones) {
      for (const nombre of asig.nombres) {
        const { data: producto } = await supabase
          .from('productos')
          .select('id')
          .eq('nombre', nombre)
          .single();

        if (producto) {
          const { error } = await supabase
            .from('productos')
            .update({ 
              categoria_id: catMap['Bebidas'],
              subcategoria_id: catMap[asig.subcategoria]
            })
            .eq('id', producto.id);

          if (!error) {
            console.log(`✅ ${nombre} → Bebidas > ${asig.subcategoria}`);
            productosActualizados++;
          }
        }
      }
    }

    console.log(`\n📊 Total de productos actualizados: ${productosActualizados}`);
    
    // Verificar productos sin categoría
    const { data: sinCategoria } = await supabase
      .from('productos')
      .select('nombre')
      .is('categoria_id', null);

    if (sinCategoria && sinCategoria.length > 0) {
      console.log(`\n⚠️  ${sinCategoria.length} productos sin categoría:`);
      sinCategoria.forEach(p => console.log(`   - ${p.nombre}`));
    }

    console.log('\n✅ Reorganización completada!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

asignarProductosCategorias();
