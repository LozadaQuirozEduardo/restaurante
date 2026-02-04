const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Cargar variables de entorno
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function agregarProductosAdicionales() {
  try {
    // Obtener categorías
    const { data: categorias } = await supabase.from('categorias').select('*');
    
    // Crear categoría para paquetes si no existe
    let catPaquetes = categorias.find(c => c.nombre.toLowerCase() === 'paquetes');
    if (!catPaquetes) {
      const { data: nuevaCat } = await supabase
        .from('categorias')
        .insert({ nombre: 'PAQUETES' })
        .select()
        .single();
      catPaquetes = nuevaCat;
      console.log('✅ Categoría PAQUETES creada');
    }

    const catMap = {};
    categorias.forEach(cat => {
      catMap[cat.nombre.toLowerCase()] = cat.id;
    });
    catMap['paquetes'] = catPaquetes.id;

    console.log('📋 Categorías disponibles:', catMap);

    const productos = [
      // TACOS (Imagen 1 y 2)
      { nombre: 'Taco de Cecina', descripcion: 'Incluye porción de papas', precio: 60, categoria_id: catMap['platos fuertes'], disponible: true },
      { nombre: 'Taco de Cecina con Queso', descripcion: 'Incluye porción de papas', precio: 65, categoria_id: catMap['platos fuertes'], disponible: true },
      { nombre: 'Taco de Chorizo Argentino', descripcion: 'Incluye porción de papas', precio: 50, categoria_id: catMap['platos fuertes'], disponible: true },
      { nombre: 'Taco de Chorizo Argentino con Queso', descripcion: 'Incluye porción de papas', precio: 55, categoria_id: catMap['platos fuertes'], disponible: true },
      { nombre: 'Taco de Chistorra', descripcion: 'Incluye porción de papas', precio: 50, categoria_id: catMap['platos fuertes'], disponible: true },
      { nombre: 'Taco de Chistorra con Queso', descripcion: 'Incluye porción de papas', precio: 55, categoria_id: catMap['platos fuertes'], disponible: true },
      { nombre: 'Taco de Bisteck', descripcion: 'Incluye porción de papas', precio: 50, categoria_id: catMap['platos fuertes'], disponible: true },
      { nombre: 'Taco de Bisteck con Queso', descripcion: 'Incluye porción de papas', precio: 55, categoria_id: catMap['platos fuertes'], disponible: true },
      { nombre: 'Taco de Pollo', descripcion: 'Incluye porción de papas', precio: 50, categoria_id: catMap['platos fuertes'], disponible: true },
      { nombre: 'Taco de Pollo con Queso', descripcion: 'Incluye porción de papas', precio: 55, categoria_id: catMap['platos fuertes'], disponible: true },
      { nombre: 'Taco Campechano', descripcion: 'Incluye porción de papas', precio: 50, categoria_id: catMap['platos fuertes'], disponible: true },
      { nombre: 'Taco Campechano con Queso', descripcion: 'Incluye porción de papas', precio: 55, categoria_id: catMap['platos fuertes'], disponible: true },
      { nombre: 'Taco de Carnitas', descripcion: '', precio: 20, categoria_id: catMap['platos fuertes'], disponible: true },

      // BURRITOS (Imagen 1)
      { nombre: 'Burrito de Bisteck', descripcion: 'Acompañado de papas, arroz o ensalada', precio: 110, categoria_id: catMap['platos fuertes'], disponible: true },
      { nombre: 'Burrito de Pollo', descripcion: 'Acompañado de papas, arroz o ensalada', precio: 100, categoria_id: catMap['platos fuertes'], disponible: true },
      { nombre: 'Burrito de Salchicha', descripcion: 'Acompañado de papas, arroz o ensalada', precio: 80, categoria_id: catMap['platos fuertes'], disponible: true },
      { nombre: 'Burrito de Longaniza', descripcion: 'Acompañado de papas, arroz o ensalada', precio: 110, categoria_id: catMap['platos fuertes'], disponible: true },

      // BANDERILLAS (Imagen 1)
      { nombre: 'Banderilla de Salchicha', descripcion: 'Sin papas', precio: 30, categoria_id: catMap['entradas'], disponible: true },
      { nombre: 'Banderilla de Salchicha con Papas', descripcion: 'Con papas', precio: 40, categoria_id: catMap['entradas'], disponible: true },
      { nombre: 'Banderilla de Queso', descripcion: 'Sin papas', precio: 30, categoria_id: catMap['entradas'], disponible: true },
      { nombre: 'Banderilla de Queso con Papas', descripcion: 'Con papas', precio: 40, categoria_id: catMap['entradas'], disponible: true },
      { nombre: 'Banderilla Combinada', descripcion: 'Sin papas', precio: 30, categoria_id: catMap['entradas'], disponible: true },
      { nombre: 'Banderilla Combinada con Papas', descripcion: 'Con papas', precio: 40, categoria_id: catMap['entradas'], disponible: true },

      // OTROS (Imagen 1 y 2)
      { nombre: 'Aros de Cebolla', descripcion: '', precio: 40, categoria_id: catMap['entradas'], disponible: true },
      { nombre: 'Pan', descripcion: '', precio: 17, categoria_id: catMap['entradas'], disponible: true },

      // ALITAS (Imagen 4)
      { nombre: '12 Alitas', descripcion: '', precio: 220, categoria_id: catMap['platos fuertes'], disponible: true },
      { nombre: '18 Alitas', descripcion: '', precio: 290, categoria_id: catMap['platos fuertes'], disponible: true },

      // PAQUETES DE LUNES A VIERNES (Imagen 3 y 4)
      { nombre: 'Paquete Lunes', descripcion: '2 Hamburguesas + 5 Papas + 5 Alitas', precio: 250, categoria_id: catMap['paquetes'], disponible: true },
      { nombre: 'Paquete Martes', descripcion: 'Carne toda la que puedas comer + 1 bebida', precio: 300, categoria_id: catMap['paquetes'], disponible: true },
      { nombre: 'Paquete Miércoles', descripcion: '1 Hamburguesa + 1 Papas + 1 Jarritos 600ml', precio: 130, categoria_id: catMap['paquetes'], disponible: true },
      { nombre: 'Paquete Jueves', descripcion: '1 Hamburguesa + 1 Papas + 1 Jarritos 600ml + 5 Alitas', precio: 180, categoria_id: catMap['paquetes'], disponible: true },
      { nombre: 'Paquete Viernes', descripcion: '5 Alitas + 1 Papas + 2 Jarritos', precio: 150, categoria_id: catMap['paquetes'], disponible: true },
    ];

    console.log(`📦 Agregando ${productos.length} productos adicionales...`);

    let exitosos = 0;
    let fallidos = 0;

    for (const producto of productos) {
      const { error } = await supabase
        .from('productos')
        .insert(producto);

      if (error) {
        console.error(`❌ Error al agregar ${producto.nombre}:`, error.message);
        fallidos++;
      } else {
        console.log(`✅ ${producto.nombre} agregado`);
        exitosos++;
      }
    }

    console.log('\n📊 Resumen:');
    console.log(`✅ Exitosos: ${exitosos}`);
    console.log(`❌ Fallidos: ${fallidos}`);
    console.log(`📊 Total: ${productos.length}`);

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

agregarProductosAdicionales();
