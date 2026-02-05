const { createClient } = require('@supabase/supabase-js');
const path = require('path');

require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function agregarProductosConSubcategorias() {
  try {
    const { data: categorias } = await supabase.from('categorias').select('*');
    
    const catMap = {};
    categorias.forEach(cat => {
      catMap[cat.nombre.toLowerCase()] = cat.id;
    });

    console.log('📋 Categorías disponibles:', Object.keys(catMap));

    const productos = [
      // PAMBAZOS
      { nombre: 'Pambazo de Chorizo con Papas', descripcion: 'Al gusto', precio: 150, categoria_id: catMap['pambazos'], orden: 1, disponible: true },
      
      // TOSTADAS
      { nombre: 'Tostada de Pata de Res', descripcion: '', precio: 125, categoria_id: catMap['tostadas'], orden: 1, disponible: true },
      { nombre: 'Tostada de Tinga de Pollo', descripcion: '', precio: 125, categoria_id: catMap['tostadas'], orden: 2, disponible: true },
      { nombre: 'Tostada de Tinga de Res', descripcion: '', precio: 125, categoria_id: catMap['tostadas'], orden: 3, disponible: true },
      
      // HAMBURGUESAS Y HOT-DOG
      { nombre: 'Hamburguesa Completa', descripcion: 'Con papas fritas, tocino y queso', precio: 110, categoria_id: catMap['hamburguesas y hot dogs'], orden: 1, disponible: true },
      { nombre: 'Hot-Dog', descripcion: 'Con tocino y papas fritas', precio: 175, categoria_id: catMap['hamburguesas y hot dogs'], orden: 2, disponible: true },
      
      // CALDOS
      { nombre: 'Caldo de Res Chico', descripcion: '', precio: 195, categoria_id: catMap['caldos'], orden: 1, disponible: true },
      { nombre: 'Caldo de Res Grande', descripcion: '', precio: 110, categoria_id: catMap['caldos'], orden: 2, disponible: true },
      { nombre: 'Caldo de Pollo Chico', descripcion: '', precio: 195, categoria_id: catMap['caldos'], orden: 3, disponible: true },
      { nombre: 'Caldo de Pollo Grande', descripcion: '', precio: 110, categoria_id: catMap['caldos'], orden: 4, disponible: true },
      { nombre: 'Pancita de Res Chica', descripcion: '', precio: 195, categoria_id: catMap['caldos'], orden: 5, disponible: true },
      { nombre: 'Pancita de Res Grande', descripcion: '', precio: 110, categoria_id: catMap['caldos'], orden: 6, disponible: true },
      { nombre: 'Pozole de Puerco y Pollo', descripcion: '', precio: 110, categoria_id: catMap['caldos'], orden: 7, disponible: true },
      
      // DESAYUNOS
      { nombre: 'Huevos con Jamón', descripcion: 'Al gusto papas a la Mexicana', precio: 130, categoria_id: catMap['desayunos'], orden: 1, disponible: true },
      { nombre: 'Huevos a la Mexicana', descripcion: 'Al gusto papas a la Mexicana', precio: 130, categoria_id: catMap['desayunos'], orden: 2, disponible: true },
      { nombre: 'Huevos con Longaniza', descripcion: 'Al gusto papas a la Mexicana', precio: 130, categoria_id: catMap['desayunos'], orden: 3, disponible: true },
      { nombre: 'Huevos con Salchicha', descripcion: 'Al gusto papas a la Mexicana', precio: 130, categoria_id: catMap['desayunos'], orden: 4, disponible: true },
      
      // HOT CAKES
      { nombre: 'Hot Cakes con Huevo y Tocino', descripcion: '', precio: 140, categoria_id: catMap['hot cakes'], orden: 1, disponible: true },
      
      // CHILAQUILES
      { nombre: 'Chilaquiles Rojos Chicos', descripcion: 'Con huevo, bisteck o pollo', precio: 185, categoria_id: catMap['chilaquiles'], orden: 1, disponible: true },
      { nombre: 'Chilaquiles Rojos Grandes', descripcion: 'Con huevo, bisteck o pollo', precio: 185, categoria_id: catMap['chilaquiles'], orden: 2, disponible: true },
      { nombre: 'Chilaquiles Verdes Chicos', descripcion: 'Con huevo, bisteck o pollo', precio: 185, categoria_id: catMap['chilaquiles'], orden: 3, disponible: true },
      { nombre: 'Chilaquiles Verdes Grandes', descripcion: 'Con huevo, bisteck o pollo', precio: 185, categoria_id: catMap['chilaquiles'], orden: 4, disponible: true },
      
      // ENCHILADAS
      { nombre: 'Enchiladas Verdes', descripcion: 'El pedido incluye huevo', precio: 185, categoria_id: catMap['enchiladas'], orden: 1, disponible: true },
      { nombre: 'Enchiladas Rojas', descripcion: 'El pedido incluye huevo', precio: 155, categoria_id: catMap['enchiladas'], orden: 2, disponible: true },
      { nombre: 'Enchiladas de Pollo', descripcion: 'El pedido incluye huevo', precio: 165, categoria_id: catMap['enchiladas'], orden: 3, disponible: true },
      { nombre: 'Enchiladas de Bisteck', descripcion: 'El pedido incluye huevo', precio: 160, categoria_id: catMap['enchiladas'], orden: 4, disponible: true },
      { nombre: 'Enchiladas de Mole', descripcion: 'El pedido incluye huevo', precio: 155, categoria_id: catMap['enchiladas'], orden: 5, disponible: true },
      
      // ENFRIJOLADAS
      { nombre: 'Enfrijoladas de Pollo', descripcion: 'El pedido incluye huevo', precio: 160, categoria_id: catMap['enfrijoladas'], orden: 1, disponible: true },
      { nombre: 'Enfrijoladas de Bisteck', descripcion: 'El pedido incluye huevo', precio: 160, categoria_id: catMap['enfrijoladas'], orden: 2, disponible: true },
      
      // QUESADILLAS
      { nombre: 'Quesadilla de Papa', descripcion: '', precio: 165, categoria_id: catMap['quesadillas'], orden: 1, disponible: true },
      { nombre: 'Quesadilla de Bisteck', descripcion: '', precio: 175, categoria_id: catMap['quesadillas'], orden: 2, disponible: true },
      { nombre: 'Quesadilla de Tinga de Pollo', descripcion: '', precio: 165, categoria_id: catMap['quesadillas'], orden: 3, disponible: true },
      { nombre: 'Quesadilla de Tinga de Res', descripcion: '', precio: 165, categoria_id: catMap['quesadillas'], orden: 4, disponible: true },
      { nombre: 'Quesadilla de Papas con Rajas', descripcion: '', precio: 165, categoria_id: catMap['quesadillas'], orden: 5, disponible: true },
      { nombre: 'Quesadilla de Hongos', descripcion: '', precio: 165, categoria_id: catMap['quesadillas'], orden: 6, disponible: true },
      { nombre: 'Quesadilla de Picadillo', descripcion: '', precio: 155, categoria_id: catMap['quesadillas'], orden: 7, disponible: true },
      
      // TORTAS
      { nombre: 'Torta de Salchicha', descripcion: '', precio: 170, categoria_id: catMap['tortas'], orden: 1, disponible: true },
      { nombre: 'Torta de Huevo con Longaniza', descripcion: '', precio: 170, categoria_id: catMap['tortas'], orden: 2, disponible: true },
      { nombre: 'Torta de Longaniza', descripcion: '', precio: 170, categoria_id: catMap['tortas'], orden: 3, disponible: true },
      { nombre: 'Torta de Jamón', descripcion: '', precio: 170, categoria_id: catMap['tortas'], orden: 4, disponible: true },
      { nombre: 'Torta de Milanesa de Pollo', descripcion: '', precio: 185, categoria_id: catMap['tortas'], orden: 5, disponible: true },
      { nombre: 'Torta de Milanesa de Res', descripcion: '', precio: 185, categoria_id: catMap['tortas'], orden: 6, disponible: true },
      
      // SOPES
      { nombre: 'Sopes de Bisteck', descripcion: '', precio: 145, categoria_id: catMap['sopes'], orden: 1, disponible: true },
      { nombre: 'Sopes de Huevo', descripcion: '', precio: 145, categoria_id: catMap['sopes'], orden: 2, disponible: true },
      { nombre: 'Sopes de Pollo', descripcion: '', precio: 145, categoria_id: catMap['sopes'], orden: 3, disponible: true },
      
      // TACOS DORADOS
      { nombre: 'Tacos Dorados de Res', descripcion: '', precio: 115, categoria_id: catMap['tacos dorados'], orden: 1, disponible: true },
      { nombre: 'Tacos Dorados de Pollo', descripcion: '', precio: 115, categoria_id: catMap['tacos dorados'], orden: 2, disponible: true },
      { nombre: 'Tacos Dorados de Papas con Longaniza', descripcion: '', precio: 115, categoria_id: catMap['tacos dorados'], orden: 3, disponible: true },
      
      // TACOS ESPECIALES - Todos incluyen porción de papas
      { nombre: 'Taco de Cecina', descripcion: 'Incluye porción de papas', precio: 60, categoria_id: catMap['tacos especiales'], orden: 1, disponible: true },
      { nombre: 'Taco de Cecina con Queso', descripcion: 'Incluye porción de papas + $5 queso extra', precio: 65, categoria_id: catMap['tacos especiales'], orden: 2, disponible: true },
      { nombre: 'Taco de Chorizo Argentino', descripcion: 'Incluye porción de papas', precio: 50, categoria_id: catMap['tacos especiales'], orden: 3, disponible: true },
      { nombre: 'Taco de Chorizo Argentino con Queso', descripcion: 'Incluye porción de papas + $5 queso extra', precio: 55, categoria_id: catMap['tacos especiales'], orden: 4, disponible: true },
      { nombre: 'Taco de Chistorra', descripcion: 'Incluye porción de papas', precio: 50, categoria_id: catMap['tacos especiales'], orden: 5, disponible: true },
      { nombre: 'Taco de Chistorra con Queso', descripcion: 'Incluye porción de papas + $5 queso extra', precio: 55, categoria_id: catMap['tacos especiales'], orden: 6, disponible: true },
      { nombre: 'Taco de Bisteck', descripcion: 'Incluye porción de papas', precio: 50, categoria_id: catMap['tacos especiales'], orden: 7, disponible: true },
      { nombre: 'Taco de Bisteck con Queso', descripcion: 'Incluye porción de papas + $5 queso extra', precio: 55, categoria_id: catMap['tacos especiales'], orden: 8, disponible: true },
      { nombre: 'Taco de Pollo', descripcion: 'Incluye porción de papas', precio: 50, categoria_id: catMap['tacos especiales'], orden: 9, disponible: true },
      { nombre: 'Taco de Pollo con Queso', descripcion: 'Incluye porción de papas + $5 queso extra', precio: 55, categoria_id: catMap['tacos especiales'], orden: 10, disponible: true },
      { nombre: 'Taco Campechano', descripcion: 'Incluye porción de papas', precio: 50, categoria_id: catMap['tacos especiales'], orden: 11, disponible: true },
      { nombre: 'Taco Campechano con Queso', descripcion: 'Incluye porción de papas + $5 queso extra', precio: 55, categoria_id: catMap['tacos especiales'], orden: 12, disponible: true },
      { nombre: 'Taco de Carnitas', descripcion: '', precio: 20, categoria_id: catMap['tacos especiales'], orden: 13, disponible: true },

      // BURRITOS - Acompañados de papas, arroz o ensalada
      { nombre: 'Burrito de Bisteck', descripcion: 'Acompañado de papas, arroz o ensalada', precio: 110, categoria_id: catMap['burritos'], orden: 1, disponible: true },
      { nombre: 'Burrito de Pollo', descripcion: 'Acompañado de papas, arroz o ensalada', precio: 100, categoria_id: catMap['burritos'], orden: 2, disponible: true },
      { nombre: 'Burrito de Salchicha', descripcion: 'Acompañado de papas, arroz o ensalada', precio: 80, categoria_id: catMap['burritos'], orden: 3, disponible: true },
      { nombre: 'Burrito de Longaniza', descripcion: 'Acompañado de papas, arroz o ensalada', precio: 110, categoria_id: catMap['burritos'], orden: 4, disponible: true },

      // BANDERILLAS - Pueden incluir papas o sin papas
      { nombre: 'Banderilla de Salchicha', descripcion: 'Sin papas', precio: 30, categoria_id: catMap['banderillas'], orden: 1, disponible: true },
      { nombre: 'Banderilla de Salchicha con Papas', descripcion: 'Con papas', precio: 40, categoria_id: catMap['banderillas'], orden: 2, disponible: true },
      { nombre: 'Banderilla de Queso', descripcion: 'Sin papas', precio: 30, categoria_id: catMap['banderillas'], orden: 3, disponible: true },
      { nombre: 'Banderilla de Queso con Papas', descripcion: 'Con papas', precio: 40, categoria_id: catMap['banderillas'], orden: 4, disponible: true },
      { nombre: 'Banderilla Combinada', descripcion: 'Sin papas', precio: 30, categoria_id: catMap['banderillas'], orden: 5, disponible: true },
      { nombre: 'Banderilla Combinada con Papas', descripcion: 'Con papas', precio: 40, categoria_id: catMap['banderillas'], orden: 6, disponible: true },

      // EXTRAS
      { nombre: 'Aros de Cebolla', descripcion: '', precio: 40, categoria_id: catMap['extras'], orden: 1, disponible: true },
      { nombre: 'Pan', descripcion: '', precio: 17, categoria_id: catMap['extras'], orden: 2, disponible: true },
      
      // BEBIDAS - REFRESCOS (con subcategoría)
      { nombre: 'Coca-Cola', descripcion: 'Refresco 600ml', precio: 175, categoria_id: catMap['bebidas'], subcategoria_id: catMap['refrescos'], orden: 1, disponible: true },
      { nombre: 'Fanta', descripcion: 'Refresco 600ml', precio: 135, categoria_id: catMap['bebidas'], subcategoria_id: catMap['refrescos'], orden: 2, disponible: true },
      { nombre: 'Manzana', descripcion: 'Refresco', precio: 125, categoria_id: catMap['bebidas'], subcategoria_id: catMap['refrescos'], orden: 3, disponible: true },
      { nombre: 'Sprite', descripcion: 'Refresco', precio: 135, categoria_id: catMap['bebidas'], subcategoria_id: catMap['refrescos'], orden: 4, disponible: true },
      
      // BEBIDAS - AGUAS FRESCAS (con subcategoría)
      { nombre: 'Agua Fresca', descripcion: '', precio: 170, categoria_id: catMap['bebidas'], subcategoria_id: catMap['aguas frescas'], orden: 1, disponible: true },
      { nombre: 'Café de Olla', descripcion: '', precio: 125, categoria_id: catMap['bebidas'], subcategoria_id: catMap['aguas frescas'], orden: 2, disponible: true },
      { nombre: 'Té de Limón', descripcion: '', precio: 125, categoria_id: catMap['bebidas'], subcategoria_id: catMap['aguas frescas'], orden: 3, disponible: true },
      { nombre: 'Manzanilla', descripcion: '', precio: 125, categoria_id: catMap['bebidas'], subcategoria_id: catMap['aguas frescas'], orden: 4, disponible: true },
      
      // BEBIDAS - JUGOS (con subcategoría)
      { nombre: 'Jugo Natural Chico', descripcion: '', precio: 145, categoria_id: catMap['bebidas'], subcategoria_id: catMap['jugos'], orden: 1, disponible: true },
      { nombre: 'Jugo Natural Grande', descripcion: '', precio: 195, categoria_id: catMap['bebidas'], subcategoria_id: catMap['jugos'], orden: 2, disponible: true },
      { nombre: 'Jugo Verde', descripcion: '', precio: 145, categoria_id: catMap['bebidas'], subcategoria_id: catMap['jugos'], orden: 3, disponible: true },
      { nombre: 'Jugo de Naranja', descripcion: '', precio: 145, categoria_id: catMap['bebidas'], subcategoria_id: catMap['jugos'], orden: 4, disponible: true },
      { nombre: 'Jugo de Zanahoria', descripcion: '', precio: 145, categoria_id: catMap['bebidas'], subcategoria_id: catMap['jugos'], orden: 5, disponible: true },
      
      // BEBIDAS - LICUADOS (con subcategoría)
      { nombre: 'Licuado de Fresa', descripcion: '', precio: 145, categoria_id: catMap['bebidas'], subcategoria_id: catMap['licuados'], orden: 1, disponible: true },
      { nombre: 'Licuado de Plátano', descripcion: '', precio: 145, categoria_id: catMap['bebidas'], subcategoria_id: catMap['licuados'], orden: 2, disponible: true },
      { nombre: 'Licuado de Avena', descripcion: '', precio: 145, categoria_id: catMap['bebidas'], subcategoria_id: catMap['licuados'], orden: 3, disponible: true },
      
      // BEBIDAS - ATOLES (con subcategoría)
      { nombre: 'Atole', descripcion: '', precio: 125, categoria_id: catMap['bebidas'], subcategoria_id: catMap['atoles'], orden: 1, disponible: true }
    ];

    console.log('📦 Agregando', productos.length, 'productos con subcategorías...');
    
    const { data, error } = await supabase.from('productos').insert(productos);
    
    if (error) {
      console.error('❌ Error:', error.message);
    } else {
      console.log('✅ ¡Todos los productos agregados exitosamente!');
      console.log('📊 Total de productos:', productos.length);
    }
  } catch (err) {
    console.error('❌ Error general:', err);
  }
}

agregarProductosConSubcategorias();
