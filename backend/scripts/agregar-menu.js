const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Cargar variables de entorno del archivo en la raíz
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function agregarProductos() {
  try {
    // Primero obtener IDs de categorías
    const { data: categorias } = await supabase.from('categorias').select('*');
    
    const catMap = {};
    categorias.forEach(cat => {
      catMap[cat.nombre.toLowerCase()] = cat.id;
    });

    console.log('📋 Categorías disponibles:', catMap);

    const productos = [
      // PAMBAZOS
      { nombre: 'Pambazo de Chorizo con Papas', descripcion: 'Al gusto', precio: 90, categoria_id: catMap['platos fuertes'] || catMap['entradas'], disponible: true },
      
      // TOSTADAS
      { nombre: 'Tostada de Pata de Res', descripcion: '', precio: 35, categoria_id: catMap['entradas'], disponible: true },
      { nombre: 'Tostada de Tinga de Pollo', descripcion: '', precio: 35, categoria_id: catMap['entradas'], disponible: true },
      { nombre: 'Tostada de Tinga de Res', descripcion: '', precio: 35, categoria_id: catMap['entradas'], disponible: true },
      
      // HAMBURGUESAS Y HOT-DOG
      { nombre: 'Hamburguesa Completa', descripcion: 'Con papas fritas, tocino y queso', precio: 110, categoria_id: catMap['platos fuertes'], disponible: true },
      { nombre: 'Hot-Dog', descripcion: 'Con tocino y papas fritas', precio: 75, categoria_id: catMap['platos fuertes'], disponible: true },
      
      // CALDOS
      { nombre: 'Caldo de Res Chico', descripcion: '', precio: 95, categoria_id: catMap['platos fuertes'], disponible: true },
      { nombre: 'Caldo de Res Grande', descripcion: '', precio: 110, categoria_id: catMap['platos fuertes'], disponible: true },
      { nombre: 'Caldo de Pollo Chico', descripcion: '', precio: 95, categoria_id: catMap['platos fuertes'], disponible: true },
      { nombre: 'Caldo de Pollo Grande', descripcion: '', precio: 110, categoria_id: catMap['platos fuertes'], disponible: true },
      { nombre: 'Pancita de Res Chica', descripcion: '', precio: 95, categoria_id: catMap['platos fuertes'], disponible: true },
      { nombre: 'Pancita de Res Grande', descripcion: '', precio: 105, categoria_id: catMap['platos fuertes'], disponible: true },
      { nombre: 'Pozole de Puerco y Pollo', descripcion: '', precio: 110, categoria_id: catMap['platos fuertes'], disponible: true },
      
      // DESAYUNOS
      { nombre: 'Huevos con Jamón', descripcion: '', precio: 130, categoria_id: catMap['platos fuertes'], disponible: true },
      { nombre: 'Huevos a la Mexicana', descripcion: '', precio: 130, categoria_id: catMap['platos fuertes'], disponible: true },
      { nombre: 'Huevos con Longaniza', descripcion: '', precio: 130, categoria_id: catMap['platos fuertes'], disponible: true },
      { nombre: 'Huevos con Salchicha', descripcion: '', precio: 130, categoria_id: catMap['platos fuertes'], disponible: true },
      
      // HOT CAKES
      { nombre: 'Hot Cakes con Huevo y Tocino', descripcion: '', precio: 110, categoria_id: catMap['postres'], disponible: true },
      
      // CHILAQUILES
      { nombre: 'Chilaquiles Rojos Chicos', descripcion: 'Con huevo, bisteck o pollo', precio: 125, categoria_id: catMap['platos fuertes'], disponible: true },
      { nombre: 'Chilaquiles Rojos Grandes', descripcion: 'Con huevo, bisteck o pollo', precio: 145, categoria_id: catMap['platos fuertes'], disponible: true },
      { nombre: 'Chilaquiles Verdes Chicos', descripcion: 'Con huevo, bisteck o pollo', precio: 125, categoria_id: catMap['platos fuertes'], disponible: true },
      { nombre: 'Chilaquiles Verdes Grandes', descripcion: 'Con huevo, bisteck o pollo', precio: 145, categoria_id: catMap['platos fuertes'], disponible: true },
      
      // ENCHILADAS
      { nombre: 'Enchiladas Verdes', descripcion: 'El pedido incluye huevo', precio: 135, categoria_id: catMap['platos fuertes'], disponible: true },
      { nombre: 'Enchiladas Rojas', descripcion: 'El pedido incluye huevo', precio: 135, categoria_id: catMap['platos fuertes'], disponible: true },
      { nombre: 'Enchiladas de Pollo', descripcion: 'El pedido incluye huevo', precio: 135, categoria_id: catMap['platos fuertes'], disponible: true },
      { nombre: 'Enchiladas de Bisteck', descripcion: 'El pedido incluye huevo', precio: 160, categoria_id: catMap['platos fuertes'], disponible: true },
      { nombre: 'Enchiladas de Mole', descripcion: 'El pedido incluye huevo', precio: 135, categoria_id: catMap['platos fuertes'], disponible: true },
      
      // ENFRIJOLADAS
      { nombre: 'Enfrijoladas de Pollo', descripcion: 'El pedido incluye huevo', precio: 135, categoria_id: catMap['platos fuertes'], disponible: true },
      { nombre: 'Enfrijoladas de Bisteck', descripcion: 'El pedido incluye huevo', precio: 160, categoria_id: catMap['platos fuertes'], disponible: true },
      
      // QUESADILLAS
      { nombre: 'Quesadilla de Papa', descripcion: '', precio: 15, categoria_id: catMap['entradas'], disponible: true },
      { nombre: 'Quesadilla de Bisteck', descripcion: '', precio: 25, categoria_id: catMap['entradas'], disponible: true },
      { nombre: 'Quesadilla de Tinga de Pollo', descripcion: '', precio: 25, categoria_id: catMap['entradas'], disponible: true },
      { nombre: 'Quesadilla de Tinga de Res', descripcion: '', precio: 25, categoria_id: catMap['entradas'], disponible: true },
      { nombre: 'Quesadilla de Papas con Rajas', descripcion: '', precio: 25, categoria_id: catMap['entradas'], disponible: true },
      { nombre: 'Quesadilla de Hongos', descripcion: '', precio: 25, categoria_id: catMap['entradas'], disponible: true },
      { nombre: 'Quesadilla de Picadillo', descripcion: '', precio: 25, categoria_id: catMap['entradas'], disponible: true },
      
      // TORTAS
      { nombre: 'Torta de Salchicha', descripcion: '', precio: 70, categoria_id: catMap['platos fuertes'], disponible: true },
      { nombre: 'Torta de Huevo con Longaniza', descripcion: '', precio: 70, categoria_id: catMap['platos fuertes'], disponible: true },
      { nombre: 'Torta de Longaniza', descripcion: '', precio: 70, categoria_id: catMap['platos fuertes'], disponible: true },
      { nombre: 'Torta de Jamón', descripcion: '', precio: 70, categoria_id: catMap['platos fuertes'], disponible: true },
      { nombre: 'Torta de Milanesa de Pollo', descripcion: '', precio: 85, categoria_id: catMap['platos fuertes'], disponible: true },
      { nombre: 'Torta de Milanesa de Res', descripcion: '', precio: 85, categoria_id: catMap['platos fuertes'], disponible: true },
      
      // SOPAS
      { nombre: 'Sopa de Bisteck', descripcion: '', precio: 45, categoria_id: catMap['platos fuertes'], disponible: true },
      { nombre: 'Sopa de Huevo', descripcion: '', precio: 45, categoria_id: catMap['platos fuertes'], disponible: true },
      { nombre: 'Sopa de Pollo', descripcion: '', precio: 45, categoria_id: catMap['platos fuertes'], disponible: true },
      
      // TACOS DORADOS
      { nombre: 'Tacos Dorados de Res', descripcion: '', precio: 45, categoria_id: catMap['platos fuertes'], disponible: true },
      { nombre: 'Tacos Dorados de Pollo', descripcion: '', precio: 45, categoria_id: catMap['platos fuertes'], disponible: true },
      { nombre: 'Tacos Dorados de Papas con Longaniza', descripcion: '', precio: 60, categoria_id: catMap['platos fuertes'], disponible: true },
      
      // BEBIDAS - REFRESCOS
      { nombre: 'Fanta', descripcion: 'Refresco 600ml', precio: 25, categoria_id: catMap['bebidas'], disponible: true },
      { nombre: 'Manzana', descripcion: 'Refresco', precio: 25, categoria_id: catMap['bebidas'], disponible: true },
      { nombre: 'Sprite', descripcion: 'Refresco', precio: 25, categoria_id: catMap['bebidas'], disponible: true },
      
      // BEBIDAS - AGUAS FRESCAS
      { nombre: 'Café de Olla', descripcion: '', precio: 25, categoria_id: catMap['bebidas'], disponible: true },
      { nombre: 'Té de Limón', descripcion: '', precio: 25, categoria_id: catMap['bebidas'], disponible: true },
      { nombre: 'Manzanilla', descripcion: '', precio: 25, categoria_id: catMap['bebidas'], disponible: true },
      
      // BEBIDAS - JUGOS
      { nombre: 'Jugo Natural', descripcion: '', precio: 45, categoria_id: catMap['bebidas'], disponible: true },
      { nombre: 'Jugo Verde', descripcion: '', precio: 45, categoria_id: catMap['bebidas'], disponible: true },
      { nombre: 'Jugo de Naranja', descripcion: '', precio: 45, categoria_id: catMap['bebidas'], disponible: true },
      { nombre: 'Jugo de Zanahoria', descripcion: '', precio: 45, categoria_id: catMap['bebidas'], disponible: true },
      
      // BEBIDAS - LICUADOS
      { nombre: 'Licuado de Fresa', descripcion: '', precio: 45, categoria_id: catMap['bebidas'], disponible: true },
      { nombre: 'Licuado de Plátano', descripcion: '', precio: 45, categoria_id: catMap['bebidas'], disponible: true },
      { nombre: 'Licuado de Avena', descripcion: '', precio: 45, categoria_id: catMap['bebidas'], disponible: true },
      
      // BEBIDAS - ATOLES
      { nombre: 'Atole', descripcion: '', precio: 25, categoria_id: catMap['bebidas'], disponible: true }
    ];

    console.log('📦 Agregando', productos.length, 'productos...');
    
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

agregarProductos();
