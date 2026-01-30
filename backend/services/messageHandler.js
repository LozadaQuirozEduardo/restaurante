/**
 * Message Handler
 * Lógica principal del bot para procesar mensajes y gestionar conversaciones
 */

const whatsappService = require('./whatsappService');
const supabaseService = require('./supabaseService');

// Almacenamiento temporal de sesiones (en producción usar Redis o BD)
const sessions = new Map();

// Tiempo de expiración de sesión (15 minutos)
const SESSION_TIMEOUT = 15 * 60 * 1000;

/**
 * Obtener o crear sesión de usuario
 */
function getSession(phoneNumber) {
  if (!sessions.has(phoneNumber)) {
    sessions.set(phoneNumber, {
      step: 'inicio',
      data: {},
      lastActivity: Date.now()
    });
  }

  const session = sessions.get(phoneNumber);
  
  // Verificar si la sesión expiró
  if (Date.now() - session.lastActivity > SESSION_TIMEOUT) {
    sessions.set(phoneNumber, {
      step: 'inicio',
      data: {},
      lastActivity: Date.now()
    });
    return sessions.get(phoneNumber);
  }

  session.lastActivity = Date.now();
  return session;
}

/**
 * Actualizar sesión
 */
function updateSession(phoneNumber, updates) {
  const session = getSession(phoneNumber);
  Object.assign(session, updates);
  session.lastActivity = Date.now();
}

/**
 * Limpiar sesión
 */
function clearSession(phoneNumber) {
  sessions.delete(phoneNumber);
}

/**
 * Manejar mensaje entrante
 */
async function handleMessage(from, message, messageId) {
  try {
    const session = getSession(from);
    const textLower = message.toLowerCase().trim();

    console.log(`📱 Mensaje de ${from}: "${message}" (Paso: ${session.step})`);

    // Comandos globales que funcionan en cualquier momento
    if (textLower === 'hola' || textLower === 'inicio' || textLower === 'empezar') {
      await sendWelcomeMessage(from);
      return;
    }

    if (textLower === 'cancelar' || textLower === 'salir') {
      await whatsappService.sendTextMessage(from, 
        '❌ Operación cancelada.\n\nEscribe *hola* para volver al menú principal.');
      clearSession(from);
      return;
    }

    // Procesar según el paso actual de la conversación
    switch (session.step) {
      case 'inicio':
        await handleInicioStep(from, textLower);
        break;

      case 'menu_principal':
        await handleMenuPrincipal(from, textLower);
        break;

      case 'ver_categorias':
        await handleVerCategorias(from, textLower);
        break;

      case 'ver_productos':
        await handleVerProductos(from, textLower);
        break;

      case 'pedir_inicio':
        await handlePedirInicio(from, textLower);
        break;

      case 'pedir_producto':
        await handlePedirProducto(from, message);
        break;

      case 'pedir_cantidad':
        await handlePedirCantidad(from, message);
        break;

      case 'pedir_mas_productos':
        await handlePedirMasProductos(from, textLower);
        break;

      case 'pedir_nombre':
        await handlePedirNombre(from, message);
        break;

      case 'pedir_direccion':
        await handlePedirDireccion(from, message);
        break;

      case 'pedir_notas':
        await handlePedirNotas(from, message);
        break;

      case 'confirmar_pedido':
        await handleConfirmarPedido(from, textLower);
        break;

      default:
        await sendWelcomeMessage(from);
    }

    // Marcar mensaje como leído
    await whatsappService.markAsRead(messageId);

  } catch (error) {
    console.error('❌ Error al procesar mensaje:', error);
    await whatsappService.sendTextMessage(from, 
      '😔 Ocurrió un error al procesar tu mensaje. Por favor intenta nuevamente o escribe *hola* para reiniciar.');
  }
}

/**
 * Mensaje de bienvenida
 */
async function sendWelcomeMessage(phoneNumber) {
  const welcomeText = `¡Hola! 👋 Bienvenido a nuestro restaurante.

¿En qué puedo ayudarte hoy?

📋 *menú* - Ver productos disponibles
🛒 *pedir* - Hacer un pedido
📞 *contacto* - Información de contacto
ℹ️ *ayuda* - Ver comandos disponibles

Escribe una opción para comenzar.`;

  await whatsappService.sendTextMessage(phoneNumber, welcomeText);
  updateSession(phoneNumber, { step: 'menu_principal', data: {} });
}

/**
 * Manejar paso inicial
 */
async function handleInicioStep(phoneNumber, message) {
  await sendWelcomeMessage(phoneNumber);
}

/**
 * Manejar menú principal
 */
async function handleMenuPrincipal(phoneNumber, message) {
  if (message.includes('menu') || message.includes('menú') || message.includes('producto') || message === '1') {
    await showCategorias(phoneNumber);
  } else if (message.includes('pedir') || message.includes('pedido') || message.includes('comprar') || message === '2') {
    await iniciarPedido(phoneNumber);
  } else if (message.includes('contacto')) {
    await whatsappService.sendTextMessage(phoneNumber, 
      `📞 *Información de Contacto*\n\n` +
      `📱 WhatsApp: Este número\n` +
      `⏰ Horario: Lunes a Domingo 10:00 - 22:00\n` +
      `📍 Ubicación: [Tu dirección aquí]\n\n` +
      `¿Necesitas algo más? Escribe *hola* para ver el menú.`
    );
  } else if (message.includes('ayuda') || message.includes('help')) {
    await whatsappService.sendTextMessage(phoneNumber, 
      `ℹ️ *Comandos Disponibles:*\n\n` +
      `📋 *menú* - Ver todos los productos\n` +
      `🛒 *pedir* - Hacer un pedido\n` +
      `📞 *contacto* - Info de contacto\n` +
      `❌ *cancelar* - Cancelar operación actual\n` +
      `🏠 *hola* - Volver al inicio\n\n` +
      `¿Qué deseas hacer?`
    );
  } else {
    await whatsappService.sendTextMessage(phoneNumber, 
      `No entendí tu mensaje. Por favor elige una opción:\n\n` +
      `📋 *menú* - Ver productos\n` +
      `🛒 *pedir* - Hacer pedido\n` +
      `📞 *contacto* - Información\n` +
      `ℹ️ *ayuda* - Ver comandos`
    );
  }
}

/**
 * Mostrar categorías
 */
async function showCategorias(phoneNumber) {
  const categorias = await supabaseService.getCategorias();

  if (categorias.length === 0) {
    await whatsappService.sendTextMessage(phoneNumber, 
      '😔 Lo sentimos, no hay categorías disponibles en este momento.\n\nEscribe *hola* para volver al inicio.');
    return;
  }

  let message = '📋 *Nuestras Categorías:*\n\n';
  categorias.forEach((cat, index) => {
    message += `${index + 1}. ${cat.nombre}\n`;
  });
  message += `\n💡 Escribe el número de la categoría para ver sus productos o escribe *todo* para ver todos los productos.`;

  await whatsappService.sendTextMessage(phoneNumber, message);
  updateSession(phoneNumber, { 
    step: 'ver_categorias', 
    data: { categorias } 
  });
}

/**
 * Manejar selección de categoría
 */
async function handleVerCategorias(phoneNumber, message) {
  const session = getSession(phoneNumber);
  const { categorias } = session.data;

  if (message === 'todo' || message === 'todos') {
    await showAllProductos(phoneNumber);
    return;
  }

  const categoriaIndex = parseInt(message) - 1;
  
  if (isNaN(categoriaIndex) || categoriaIndex < 0 || categoriaIndex >= categorias.length) {
    await whatsappService.sendTextMessage(phoneNumber, 
      '❌ Número inválido. Por favor elige un número de la lista o escribe *todo* para ver todos los productos.');
    return;
  }

  const categoria = categorias[categoriaIndex];
  await showProductosByCategoria(phoneNumber, categoria);
}

/**
 * Mostrar todos los productos
 */
async function showAllProductos(phoneNumber) {
  const productos = await supabaseService.getProductos();

  if (productos.length === 0) {
    await whatsappService.sendTextMessage(phoneNumber, 
      '😔 No hay productos disponibles en este momento.\n\nEscribe *hola* para volver al inicio.');
    clearSession(phoneNumber);
    return;
  }

  let message = '🍽️ *Nuestro Menú Completo:*\n\n';
  
  const categorias = {};
  productos.forEach(prod => {
    const catNombre = prod.categorias?.nombre || 'Otros';
    if (!categorias[catNombre]) {
      categorias[catNombre] = [];
    }
    categorias[catNombre].push(prod);
  });

  Object.keys(categorias).forEach(catNombre => {
    message += `📂 *${catNombre}*\n`;
    categorias[catNombre].forEach(prod => {
      const precio = prod.precio % 1 === 0 ? prod.precio : prod.precio.toFixed(2);
      message += `  • ${prod.nombre} - $${precio} MXN\n`;
      if (prod.descripcion) {
        message += `    _${prod.descripcion}_\n`;
      }
    });
    message += '\n';
  });

  message += '🛒 ¿Deseas hacer un pedido? Escribe *pedir*';

  await whatsappService.sendTextMessage(phoneNumber, message);
  updateSession(phoneNumber, { step: 'menu_principal', data: {} });
}

/**
 * Mostrar productos por categoría
 */
async function showProductosByCategoria(phoneNumber, categoria) {
  const productos = await supabaseService.getProductos(categoria.id);

  if (productos.length === 0) {
    await whatsappService.sendTextMessage(phoneNumber, 
      `😔 No hay productos disponibles en la categoría *${categoria.nombre}*.\n\nEscribe *hola* para volver al inicio.`);
    clearSession(phoneNumber);
    return;
  }

  let message = `🍽️ *${categoria.nombre}*\n\n`;
  productos.forEach((prod, index) => {
    const precio = prod.precio % 1 === 0 ? prod.precio : prod.precio.toFixed(2);
    message += `${index + 1}. *${prod.nombre}* - $${precio} MXN\n`;
    if (prod.descripcion) {
      message += `   _${prod.descripcion}_\n`;
    }
  });

  message += '\n🛒 ¿Deseas hacer un pedido? Escribe *pedir*';

  await whatsappService.sendTextMessage(phoneNumber, message);
  updateSession(phoneNumber, { step: 'menu_principal', data: {} });
}

/**
 * Iniciar proceso de pedido
 */
async function iniciarPedido(phoneNumber) {
  const productos = await supabaseService.getProductos();

  if (productos.length === 0) {
    await whatsappService.sendTextMessage(phoneNumber, 
      '😔 Lo sentimos, no hay productos disponibles para ordenar en este momento.');
    clearSession(phoneNumber);
    return;
  }

  let message = '🛒 *Iniciar Pedido*\n\nPerfecto! Estos son nuestros productos:\n\n';
  
  productos.forEach((prod, index) => {
    const precio = prod.precio % 1 === 0 ? prod.precio : prod.precio.toFixed(2);
    message += `${index + 1}. ${prod.nombre} - $${precio} MXN\n`;
  });

  message += '\n📝 Escribe el(los) *número(s)* del producto que deseas ordenar.\n\n💡 Puedes seleccionar varios productos separados por comas (ej: 1, 3, 5)\n\n💡 También puedes escribir *cancelar* para salir.';

  await whatsappService.sendTextMessage(phoneNumber, message);
  updateSession(phoneNumber, { 
    step: 'pedir_producto', 
    data: { productos, carrito: [] } 
  });
}

/**
 * Manejar paso de inicio de pedido
 */
async function handlePedirInicio(phoneNumber, message) {
  await iniciarPedido(phoneNumber);
}

/**
 * Manejar selección de producto
 */
async function handlePedirProducto(phoneNumber, message) {
  const session = getSession(phoneNumber);
  const { productos } = session.data;

  // Permitir múltiples productos separados por comas
  const numeros = message.split(',').map(n => n.trim());
  const productosSeleccionados = [];

  for (const num of numeros) {
    const productoIndex = parseInt(num) - 1;
    
    if (isNaN(productoIndex) || productoIndex < 0 || productoIndex >= productos.length) {
      await whatsappService.sendTextMessage(phoneNumber, 
        `❌ El número "${num}" no es válido. Por favor elige números de la lista de productos.`);
      return;
    }
    
    productosSeleccionados.push(productos[productoIndex]);
  }

  // Guardar todos los productos seleccionados y empezar con el primero
  session.data.productosSeleccionados = productosSeleccionados;
  session.data.indiceProdActual = 0;
  
  const producto = productosSeleccionados[0];
  
  await whatsappService.sendTextMessage(phoneNumber, 
    `✅ Seleccionaste: *${producto.nombre}* ($${producto.precio.toFixed(2)})\n\n` +
    `📦 ¿Cuántas unidades deseas? (Escribe un número)`
  );

  session.data.productoSeleccionado = producto;
  updateSession(phoneNumber, { step: 'pedir_cantidad' });
}

/**
 * Manejar cantidad de producto
 */
async function handlePedirCantidad(phoneNumber, message) {
  const session = getSession(phoneNumber);
  const { productoSeleccionado, carrito, productosSeleccionados, indiceProdActual } = session.data;

  const cantidad = parseInt(message);

  if (isNaN(cantidad) || cantidad <= 0) {
    await whatsappService.sendTextMessage(phoneNumber, 
      '❌ Por favor ingresa una cantidad válida (número mayor a 0).');
    return;
  }

  // Agregar al carrito
  carrito.push({
    producto_id: productoSeleccionado.id,
    nombre: productoSeleccionado.nombre,
    precio: productoSeleccionado.precio,
    cantidad: cantidad
  });

  const subtotal = productoSeleccionado.precio * cantidad;

  await whatsappService.sendTextMessage(phoneNumber, 
    `✅ Agregado: ${cantidad}x ${productoSeleccionado.nombre} - $${subtotal.toFixed(2)}`
  );

  // Verificar si hay más productos pendientes de la selección múltiple
  if (productosSeleccionados && indiceProdActual < productosSeleccionados.length - 1) {
    // Pasar al siguiente producto
    const siguienteIndice = indiceProdActual + 1;
    session.data.indiceProdActual = siguienteIndice;
    const siguienteProducto = productosSeleccionados[siguienteIndice];
    
    await whatsappService.sendTextMessage(phoneNumber,
      `\n✅ Seleccionaste: *${siguienteProducto.nombre}* ($${siguienteProducto.precio.toFixed(2)})\n\n` +
      `📦 ¿Cuántas unidades deseas? (Escribe un número)`
    );
    
    session.data.productoSeleccionado = siguienteProducto;
    updateSession(phoneNumber, { step: 'pedir_cantidad' });
  } else {
    // Ya terminó con todos los productos seleccionados
    await whatsappService.sendTextMessage(phoneNumber, 
      `\n¿Deseas agregar más productos?\n\n` +
      `✅ *si* - Agregar más\n` +
      `✅ *no* - Continuar con el pedido`
    );
    
    updateSession(phoneNumber, { step: 'pedir_mas_productos' });
  }
}

/**
 * Preguntar si desea más productos
 */
async function handlePedirMasProductos(phoneNumber, message) {
  const session = getSession(phoneNumber);

  if (message.includes('si') || message.includes('sí') || message.includes('mas') || message.includes('más')) {
    await iniciarPedido(phoneNumber);
  } else if (message.includes('no') || message.includes('continuar') || message.includes('siguiente')) {
    await solicitarNombre(phoneNumber);
  } else {
    await whatsappService.sendTextMessage(phoneNumber, 
      'Por favor responde *si* para agregar más productos o *no* para continuar.');
  }
}

/**
 * Solicitar nombre del cliente
 */
async function solicitarNombre(phoneNumber) {
  await whatsappService.sendTextMessage(phoneNumber, 
    '👤 *Datos de entrega*\n\n' +
    'Por favor, dime tu nombre completo:'
  );
  updateSession(phoneNumber, { step: 'pedir_nombre' });
}

/**
 * Manejar nombre del cliente
 */
async function handlePedirNombre(phoneNumber, message) {
  const session = getSession(phoneNumber);
  session.data.nombre = message;
  session.data.tipoEntrega = 'Recoger en restaurante';

  await whatsappService.sendTextMessage(phoneNumber, 
    `Gracias ${message}! 🏪\n\n` +
    `Tu pedido será para: *Recoger en restaurante* 📍\n\n` +
    `¿Tienes alguna nota adicional para tu pedido? (Ej: Sin cebolla, extra picante, etc.)\n\n` +
    `O escribe *no* si no tienes notas.`
  );
  
  updateSession(phoneNumber, { step: 'pedir_notas' });
}

/**
 * Manejar dirección
 */
async function handlePedirDireccion(phoneNumber, message) {
  const session = getSession(phoneNumber);
  session.data.direccion = message;

  await whatsappService.sendTextMessage(phoneNumber, 
    '📝 ¿Tienes alguna nota o comentario especial para tu pedido?\n\n' +
    '(Escribe *no* si no tienes comentarios)'
  );
  
  updateSession(phoneNumber, { step: 'pedir_notas' });
}

/**
 * Manejar notas adicionales
 */
async function handlePedirNotas(phoneNumber, message) {
  const session = getSession(phoneNumber);
  
  if (message.toLowerCase() !== 'no') {
    session.data.notas = message;
  }

  await mostrarResumenPedido(phoneNumber);
}

/**
 * Mostrar resumen del pedido
 */
async function mostrarResumenPedido(phoneNumber) {
  const session = getSession(phoneNumber);
  const { carrito, nombre, tipoEntrega, notas } = session.data;

  let total = 0;
  let resumen = '📋 *Resumen de tu Pedido*\n\n';
  
  resumen += '🛒 *Productos:*\n';
  carrito.forEach(item => {
    const subtotal = item.precio * item.cantidad;
    total += subtotal;
    const precioFormat = subtotal % 1 === 0 ? subtotal : subtotal.toFixed(2);
    resumen += `  • ${item.cantidad}x ${item.nombre} - $${precioFormat} MXN\n`;
  });

  const totalFormat = total % 1 === 0 ? total : total.toFixed(2);
  resumen += `\n💰 *Total: $${totalFormat} MXN*\n\n`;
  resumen += `👤 *Nombre:* ${nombre}\n`;
  resumen += `📍 *Tipo de entrega:* ${tipoEntrega}\n`;
  
  if (notas) {
    resumen += `📝 *Notas:* ${notas}\n`;
  }

  resumen += `\n¿Confirmas tu pedido?\n\n`;
  resumen += `✅ *si* - Confirmar pedido\n`;
  resumen += `❌ *no* - Cancelar`;

  await whatsappService.sendTextMessage(phoneNumber, resumen);
  updateSession(phoneNumber, { step: 'confirmar_pedido' });
}

/**
 * Confirmar pedido
 */
async function handleConfirmarPedido(phoneNumber, message) {
  const session = getSession(phoneNumber);

  if (message.includes('si') || message.includes('sí') || message.includes('confirmar')) {
    await procesarPedido(phoneNumber);
  } else {
    await whatsappService.sendTextMessage(phoneNumber, 
      '❌ Pedido cancelado.\n\nEscribe *hola* si deseas hacer un nuevo pedido.');
    clearSession(phoneNumber);
  }
}

/**
 * Procesar y guardar pedido
 */
async function procesarPedido(phoneNumber) {
  try {
    const session = getSession(phoneNumber);
    const { carrito, nombre, tipoEntrega, notas } = session.data;

    // Obtener o crear cliente
    const cliente = await supabaseService.getOrCreateCliente(phoneNumber, nombre);

    if (!cliente) {
      throw new Error('No se pudo crear el cliente');
    }

    // Crear pedido
    const pedido = await supabaseService.createPedido(
      cliente.id,
      carrito,
      tipoEntrega,
      notas
    );

    if (!pedido) {
      throw new Error('No se pudo crear el pedido');
    }

    // Enviar confirmación al cliente
    await whatsappService.sendReaction(phoneNumber, '', '✅');
    await whatsappService.sendTextMessage(phoneNumber, 
      `🎉 *¡Pedido Confirmado!*\n\n` +
      `📦 Número de pedido: #${pedido.id}\n` +
      `💰 Total: $${pedido.total.toFixed(2)}\n` +
      `⏰ Tiempo estimado: 30-45 minutos\n\n` +
      `Gracias por tu pedido ${nombre}! 😊\n\n` +
      `Te notificaremos cuando esté en camino.\n\n` +
      `Escribe *hola* para hacer otro pedido.`
    );

    // Enviar notificación al restaurante
    const numeroRestaurante = '+5213349420820';
    const ahora = new Date();
    const hora = ahora.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    
    let notificacion = `🔔 *NUEVO PEDIDO #${pedido.id}*\n\n`;
    notificacion += `👤 *Cliente:* ${nombre}\n`;
    notificacion += `📱 *Teléfono:* ${phoneNumber}\n\n`;
    notificacion += `🛒 *Productos:*\n`;
    
    carrito.forEach(item => {
      const subtotal = item.precio * item.cantidad;
      const precioFormat = subtotal % 1 === 0 ? subtotal : subtotal.toFixed(2);
      notificacion += `• ${item.cantidad}x ${item.nombre} - $${precioFormat} MXN\n`;
    });
    
    const totalFormat = pedido.total % 1 === 0 ? pedido.total : pedido.total.toFixed(2);
    notificacion += `\n💰 *Total: $${totalFormat} MXN*\n`;
    notificacion += `📍 *${tipoEntrega}*\n`;
    
    if (notas) {
      notificacion += `📝 *Notas:* ${notas}\n`;
    }
    
    notificacion += `\n⏰ *Hora:* ${hora}`;
    
    await whatsappService.sendTextMessage(numeroRestaurante, notificacion);

    clearSession(phoneNumber);

    console.log(`✅ Pedido #${pedido.id} creado exitosamente para ${nombre}`);

  } catch (error) {
    console.error('❌ Error al procesar pedido:', error);
    await whatsappService.sendTextMessage(phoneNumber, 
      '😔 Lo sentimos, hubo un error al procesar tu pedido. Por favor intenta nuevamente más tarde.\n\n' +
      'Escribe *hola* para volver al inicio.'
    );
    clearSession(phoneNumber);
  }
}

module.exports = {
  handleMessage,
  getSession,
  clearSession
};
