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

// Número de administrador autorizado
const ADMIN_PHONE = '+5215519060013';

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

    // Comandos de administrador
    if (from === ADMIN_PHONE) {
      if (textLower === 'admin' || textLower === 'gestionar' || textLower === 'pedidos') {
        await handleAdminMenu(from);
        return;
      }

      if (textLower.startsWith('estado ')) {
        await handleCambiarEstado(from, textLower);
        return;
      }
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

      case 'pedir_tipo_entrega':
        await handlePedirTipoEntrega(from, message);
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

      case 'admin_menu':
        await handleAdminMenuOption(from, textLower);
        break;

      case 'admin_ver_pedido':
        await handleAdminVerPedido(from, message);
        break;

      case 'admin_cambiar_estado':
        await handleAdminConfirmarEstado(from, textLower);
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
  const welcomeText = `¡Hola! 👋 Bienvenido a *El Rinconcito* 🍽️

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
  const nombre = message.trim();

  if (nombre.length < 2) {
    await whatsappService.sendTextMessage(phoneNumber, 
      '❌ Por favor ingresa un nombre válido.');
    return;
  }

  session.data.nombre = nombre;

  await whatsappService.sendTextMessage(phoneNumber, 
    `Gracias ${nombre}! 📍\n\n` +
    `¿Cómo deseas recibir tu pedido?\n\n` +
    `1️⃣ *Recoger en restaurante* (Sin costo)\n` +
    `   📍 Unidad Habitacional los Héroes Chalco\n` +
    `   Mz 17 Lt 17 planta baja el cupido\n` +
    `   C.P 56644 (enfrente glorieta el oasis)\n\n` +
    `2️⃣ *Servicio a domicilio* 🏠 (+$15 MXN)\n\n` +
    `Responde *1* o *2*`
  );
  
  updateSession(phoneNumber, { step: 'pedir_tipo_entrega' });
}

/**
 * Manejar tipo de entrega
 */
async function handlePedirTipoEntrega(phoneNumber, message) {
  const session = getSession(phoneNumber);
  const respuesta = message.trim();

  if (respuesta === '1' || respuesta.toLowerCase().includes('recoger') || respuesta.toLowerCase().includes('restaurante')) {
    session.data.tipoEntrega = 'Recoger en restaurante';
    session.data.direccion = 'Unidad Habitacional los Héroes Chalco Mz 17 Lt 17 planta baja el cupido C.P 56644';

    await whatsappService.sendTextMessage(phoneNumber, 
      `Perfecto! 🏪\n\n` +
      `Tu pedido será para: *Recoger en restaurante*\n` +
      `📍 Unidad Habitacional los Héroes Chalco\n` +
      `Mz 17 Lt 17 planta baja el cupido C.P 56644\n` +
      `(enfrente de la glorieta el oasis)\n\n` +
      `¿Tienes alguna nota adicional para tu pedido? (Ej: Sin cebolla, extra picante, etc.)\n\n` +
      `O escribe *no* si no tienes notas.`
    );
    
    updateSession(phoneNumber, { step: 'pedir_notas' });
    
  } else if (respuesta === '2' || respuesta.toLowerCase().includes('domicilio') || respuesta.toLowerCase().includes('entregar')) {
    session.data.tipoEntrega = 'Servicio a domicilio';
    session.data.costoEnvio = 15;

    await whatsappService.sendTextMessage(phoneNumber, 
      `Perfecto! 🏠\n\n` +
      `*Costo de envío: $15 MXN*\n\n` +
      `Por favor, dime tu dirección completa para la entrega:\n\n` +
      `(Incluye calle, número, colonia, referencias)`
    );
    
    updateSession(phoneNumber, { step: 'pedir_direccion' });
    
  } else {
    await whatsappService.sendTextMessage(phoneNumber, 
      '❌ Por favor responde *1* para recoger en restaurante o *2* para servicio a domicilio.');
  }
}

/**
 * Manejar dirección
 */
async function handlePedirDireccion(phoneNumber, message) {
  const session = getSession(phoneNumber);
  const direccion = message.trim();

  if (direccion.length < 10) {
    await whatsappService.sendTextMessage(phoneNumber, 
      '❌ Por favor proporciona una dirección completa con calle, número y colonia.');
    return;
  }

  session.data.direccion = direccion;

  await whatsappService.sendTextMessage(phoneNumber, 
    `Perfecto! 📍\n\n` +
    `Dirección de entrega:\n${direccion}\n\n` +
    `¿Tienes alguna nota adicional para tu pedido? (Ej: Sin cebolla, extra picante, tocar timbre, etc.)\n\n` +
    `O escribe *no* si no tienes notas.`
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
  const { carrito, nombre, tipoEntrega, direccion, notas, costoEnvio } = session.data;

  let total = 0;
  let resumen = '📋 *Resumen de tu Pedido*\n\n';
  
  resumen += '🛒 *Productos:*\n';
  carrito.forEach(item => {
    const subtotal = item.precio * item.cantidad;
    total += subtotal;
    const precioFormat = subtotal % 1 === 0 ? subtotal : subtotal.toFixed(2);
    resumen += `  • ${item.cantidad}x ${item.nombre} - $${precioFormat} MXN\n`;
  });

  // Agregar costo de envío si es a domicilio
  if (costoEnvio) {
    resumen += `\n📦 *Envío a domicilio:* $${costoEnvio} MXN\n`;
    total += costoEnvio;
  }

  const totalFormat = total % 1 === 0 ? total : total.toFixed(2);
  resumen += `\n💰 *Total: $${totalFormat} MXN*\n\n`;
  resumen += `👤 *Nombre:* ${nombre}\n`;
  
  if (tipoEntrega === 'Servicio a domicilio') {
    resumen += `🏠 *Entrega:* ${tipoEntrega}\n`;
    resumen += `📍 *Dirección:* ${direccion}\n`;
  } else {
    resumen += `🏪 *Entrega:* ${tipoEntrega}\n`;
    resumen += `📍 *Dirección:* Unidad Habitacional los Héroes Chalco\n`;
    resumen += `   Mz 17 Lt 17 planta baja el cupido C.P 56644\n`;
  }
  
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
    const { carrito, nombre, tipoEntrega, notas, costoEnvio } = session.data;

    // Calcular total de productos
    let totalProductos = 0;
    carrito.forEach(item => {
      totalProductos += item.precio * item.cantidad;
    });

    // Agregar costo de envío si es a domicilio
    const totalFinal = costoEnvio ? totalProductos + costoEnvio : totalProductos;

    // Obtener o crear cliente
    const cliente = await supabaseService.getOrCreateCliente(phoneNumber, nombre);

    if (!cliente) {
      throw new Error('No se pudo crear el cliente');
    }

    // Crear pedido con el total correcto y tipo de entrega
    const pedido = await supabaseService.createPedido(
      cliente.id,
      carrito,
      tipoEntrega,
      session.data.direccion,
      notas,
      phoneNumber,
      nombre
    );

    if (!pedido) {
      throw new Error('No se pudo crear el pedido');
    }
    
    // Actualizar el total del pedido con el costo de envío si aplica
    pedido.total = totalFinal;

    // Enviar confirmación al cliente
    await whatsappService.sendReaction(phoneNumber, '', '✅');
    
    let mensajeConfirmacion = `🎉 *¡Pedido Confirmado!*\n\n`;
    mensajeConfirmacion += `📦 Número de pedido: #${pedido.id}\n`;
    mensajeConfirmacion += `💰 Total: $${pedido.total.toFixed(2)}\n`;
    mensajeConfirmacion += `⏰ Tiempo estimado: 30-45 minutos\n\n`;
    mensajeConfirmacion += `Gracias por tu pedido ${nombre}! 😊\n\n`;
    
    if (tipoEntrega === 'Servicio a domicilio') {
      mensajeConfirmacion += `🏠 Tu pedido será entregado en: ${session.data.direccion}\n\n`;
      mensajeConfirmacion += `Te notificaremos cuando esté en camino.\n\n`;
    } else {
      mensajeConfirmacion += `🏪 *Recoger en:*\n`;
      mensajeConfirmacion += `El Rinconcito\n`;
      mensajeConfirmacion += `Unidad Habitacional los Héroes Chalco\n`;
      mensajeConfirmacion += `Mz 17 Lt 17 planta baja el cupido\n`;
      mensajeConfirmacion += `C.P 56644 (enfrente glorieta el oasis)\n\n`;
      mensajeConfirmacion += `¡Te esperamos! 🍽️\n\n`;
    }
    
    mensajeConfirmacion += `Escribe *hola* para hacer otro pedido.`;
    
    await whatsappService.sendTextMessage(phoneNumber, mensajeConfirmacion);

    // Enviar notificación al restaurante
    const numeroRestaurante = '+5215519060013';
    const ahora = new Date();
    const hora = ahora.toLocaleTimeString('es-MX', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'America/Mexico_City'
    });
    
    let notificacion = `🔔 *NUEVO PEDIDO #${pedido.id}*\n\n`;
    notificacion += `👤 *Cliente:* ${nombre}\n`;
    notificacion += `📱 *Teléfono:* ${phoneNumber}\n\n`;
    notificacion += `🛒 *Productos:*\n`;
    
    let subtotalProductos = 0;
    carrito.forEach(item => {
      const subtotal = item.precio * item.cantidad;
      subtotalProductos += subtotal;
      const precioFormat = subtotal % 1 === 0 ? subtotal : subtotal.toFixed(2);
      notificacion += `• ${item.cantidad}x ${item.nombre} - $${precioFormat} MXN\n`;
    });
    
    // Mostrar desglose del envío
    if (costoEnvio) {
      const subtotalFormat = subtotalProductos % 1 === 0 ? subtotalProductos : subtotalProductos.toFixed(2);
      notificacion += `\n📦 *Subtotal productos:* $${subtotalFormat} MXN\n`;
      notificacion += `📦 *Envío a domicilio:* $${costoEnvio} MXN\n`;
    }
    
    const totalFormat = totalFinal % 1 === 0 ? totalFinal : totalFinal.toFixed(2);
    notificacion += `\n💰 *Total: $${totalFormat} MXN*\n`;
    
    if (tipoEntrega === 'Servicio a domicilio') {
      notificacion += `🏠 *Entrega:* ${tipoEntrega}\n`;
      notificacion += `📍 *Dirección:* ${session.data.direccion}\n`;
    } else {
      notificacion += `🏪 *Entrega:* ${tipoEntrega}\n`;
    }
    
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

/**
 * Menú de administrador
 */
async function handleAdminMenu(from) {
  try {
    const pedidosPendientes = await supabaseService.getPedidosPendientes();
    
    let mensaje = '🔐 *PANEL DE ADMINISTRADOR*\n\n';
    mensaje += `📊 Pedidos pendientes: *${pedidosPendientes.length}*\n\n`;
    mensaje += '*Comandos disponibles:*\n\n';
    mensaje += '1️⃣ Ver pedidos pendientes\n';
    mensaje += '2️⃣ Ver todos los pedidos de hoy\n';
    mensaje += '3️⃣ Cambiar estado de pedido\n\n';
    mensaje += '_Escribe el número de la opción_';

    await whatsappService.sendTextMessage(from, mensaje);
    updateSession(from, { step: 'admin_menu' });
  } catch (error) {
    console.error('Error en menú admin:', error);
    await whatsappService.sendTextMessage(from, '❌ Error al cargar el menú de administrador');
  }
}

/**
 * Manejar opción del menú de administrador
 */
async function handleAdminMenuOption(from, option) {
  try {
    switch (option) {
      case '1':
        await mostrarPedidosPendientes(from);
        break;
      case '2':
        await mostrarPedidosHoy(from);
        break;
      case '3':
        await iniciarCambioEstado(from);
        break;
      default:
        await whatsappService.sendTextMessage(from, 
          '❌ Opción inválida. Escribe *admin* para ver el menú nuevamente.');
        clearSession(from);
    }
  } catch (error) {
    console.error('Error al manejar opción admin:', error);
  }
}

/**
 * Mostrar pedidos pendientes
 */
async function mostrarPedidosPendientes(from) {
  try {
    const pedidos = await supabaseService.getPedidosPendientes();
    
    if (pedidos.length === 0) {
      await whatsappService.sendTextMessage(from, 
        '✅ No hay pedidos pendientes.\n\nEscribe *admin* para volver al menú.');
      clearSession(from);
      return;
    }

    let mensaje = '📋 *PEDIDOS PENDIENTES*\n\n';
    
    for (const pedido of pedidos) {
      const hora = new Date(pedido.created_at).toLocaleTimeString('es-MX', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'America/Mexico_City'
      });
      
      mensaje += `━━━━━━━━━━━━━━━━\n`;
      mensaje += `🆔 *Pedido #${pedido.id}*\n`;
      mensaje += `👤 ${pedido.nombre_cliente}\n`;
      mensaje += `📞 ${pedido.telefono}\n`;
      mensaje += `💰 $${pedido.total.toFixed(2)} MXN\n`;
      mensaje += `${pedido.tipo_entrega === 'delivery' ? '🚚 Delivery' : '🏪 Recoger'}\n`;
      mensaje += `⏰ ${hora}\n`;
    }
    
    mensaje += `\n━━━━━━━━━━━━━━━━\n\n`;
    mensaje += '_Para cambiar el estado de un pedido:_\n';
    mensaje += '*estado [ID] [nuevo_estado]*\n\n';
    mensaje += 'Ejemplo: estado 15 completado\n\n';
    mensaje += 'Estados: *completado*, *cancelado*, *pendiente*';

    await whatsappService.sendTextMessage(from, mensaje);
    clearSession(from);
  } catch (error) {
    console.error('Error al mostrar pedidos pendientes:', error);
    await whatsappService.sendTextMessage(from, '❌ Error al cargar pedidos pendientes');
  }
}

/**
 * Mostrar pedidos de hoy
 */
async function mostrarPedidosHoy(from) {
  try {
    const pedidos = await supabaseService.getPedidosHoy();
    
    if (pedidos.length === 0) {
      await whatsappService.sendTextMessage(from, 
        '📭 No hay pedidos hoy.\n\nEscribe *admin* para volver al menú.');
      clearSession(from);
      return;
    }

    // Contar por estado
    const pendientes = pedidos.filter(p => p.estado === 'pendiente').length;
    const completados = pedidos.filter(p => p.estado === 'completado').length;
    const cancelados = pedidos.filter(p => p.estado === 'cancelado').length;
    const totalVentas = pedidos
      .filter(p => p.estado === 'completado')
      .reduce((sum, p) => sum + p.total, 0);

    let mensaje = '📊 *RESUMEN DEL DÍA*\n\n';
    mensaje += `📦 Total de pedidos: *${pedidos.length}*\n\n`;
    mensaje += `⏳ Pendientes: ${pendientes}\n`;
    mensaje += `✅ Completados: ${completados}\n`;
    mensaje += `❌ Cancelados: ${cancelados}\n\n`;
    mensaje += `💰 Ventas: *$${totalVentas.toFixed(2)} MXN*\n\n`;
    mensaje += '━━━━━━━━━━━━━━━━\n';
    mensaje += '*ÚLTIMOS PEDIDOS:*\n\n';
    
    // Mostrar últimos 5 pedidos
    const ultimos = pedidos.slice(0, 5);
    for (const pedido of ultimos) {
      const hora = new Date(pedido.created_at).toLocaleTimeString('es-MX', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'America/Mexico_City'
      });
      
      const estadoEmoji = {
        'pendiente': '⏳',
        'completado': '✅',
        'cancelado': '❌'
      };
      
      mensaje += `${estadoEmoji[pedido.estado]} *#${pedido.id}* - ${pedido.nombre_cliente} - $${pedido.total.toFixed(2)} - ${hora}\n`;
    }
    
    mensaje += '\n_Escribe *admin* para volver al menú_';

    await whatsappService.sendTextMessage(from, mensaje);
    clearSession(from);
  } catch (error) {
    console.error('Error al mostrar pedidos de hoy:', error);
    await whatsappService.sendTextMessage(from, '❌ Error al cargar pedidos de hoy');
  }
}

/**
 * Iniciar cambio de estado
 */
async function iniciarCambioEstado(from) {
  await whatsappService.sendTextMessage(from, 
    '🔄 *CAMBIAR ESTADO DE PEDIDO*\n\n' +
    'Escribe: *estado [ID] [nuevo_estado]*\n\n' +
    '*Ejemplo:*\n' +
    'estado 15 completado\n\n' +
    '*Estados disponibles:*\n' +
    '• completado\n' +
    '• cancelado\n' +
    '• pendiente\n\n' +
    '_Escribe *cancelar* para salir_'
  );
  clearSession(from);
}

/**
 * Cambiar estado de pedido
 */
async function handleCambiarEstado(from, message) {
  try {
    // Formato: estado 15 completado
    const partes = message.split(' ');
    
    if (partes.length !== 3) {
      await whatsappService.sendTextMessage(from, 
        '❌ Formato incorrecto.\n\n' +
        'Usa: *estado [ID] [nuevo_estado]*\n' +
        'Ejemplo: estado 15 completado'
      );
      return;
    }

    const pedidoId = parseInt(partes[1]);
    const nuevoEstado = partes[2].toLowerCase();

    if (isNaN(pedidoId)) {
      await whatsappService.sendTextMessage(from, '❌ El ID del pedido debe ser un número');
      return;
    }

    if (!['completado', 'cancelado', 'pendiente'].includes(nuevoEstado)) {
      await whatsappService.sendTextMessage(from, 
        '❌ Estado inválido.\n\n' +
        '*Estados disponibles:*\n' +
        '• completado\n' +
        '• cancelado\n' +
        '• pendiente'
      );
      return;
    }

    // Obtener información del pedido
    const pedido = await supabaseService.getPedidoById(pedidoId);
    
    if (!pedido) {
      await whatsappService.sendTextMessage(from, `❌ No se encontró el pedido #${pedidoId}`);
      return;
    }

    // Mostrar confirmación
    const estadoEmoji = {
      'completado': '✅',
      'cancelado': '❌',
      'pendiente': '⏳'
    };

    let mensaje = '🔄 *CONFIRMAR CAMBIO DE ESTADO*\n\n';
    mensaje += `🆔 Pedido: *#${pedido.id}*\n`;
    mensaje += `👤 Cliente: ${pedido.nombre_cliente}\n`;
    mensaje += `💰 Total: $${pedido.total.toFixed(2)} MXN\n\n`;
    mensaje += `📊 Estado actual: ${pedido.estado}\n`;
    mensaje += `📊 Nuevo estado: ${estadoEmoji[nuevoEstado]} *${nuevoEstado}*\n\n`;
    mensaje += '¿Confirmar cambio?\n\n';
    mensaje += '1️⃣ Sí, cambiar\n';
    mensaje += '2️⃣ No, cancelar';

    await whatsappService.sendTextMessage(from, mensaje);
    
    updateSession(from, { 
      step: 'admin_cambiar_estado',
      data: { pedidoId, nuevoEstado, pedido }
    });

  } catch (error) {
    console.error('Error al cambiar estado:', error);
    await whatsappService.sendTextMessage(from, '❌ Error al procesar el cambio de estado');
  }
}

/**
 * Confirmar cambio de estado
 */
async function handleAdminConfirmarEstado(from, option) {
  const session = getSession(from);
  
  if (option === '1') {
    try {
      const { pedidoId, nuevoEstado, pedido } = session.data;
      
      // Actualizar estado en la base de datos
      const resultado = await supabaseService.actualizarEstadoPedido(pedidoId, nuevoEstado);
      
      if (resultado) {
        const estadoEmoji = {
          'completado': '✅',
          'cancelado': '❌',
          'pendiente': '⏳'
        };

        await whatsappService.sendTextMessage(from, 
          `${estadoEmoji[nuevoEstado]} *Estado actualizado*\n\n` +
          `Pedido #${pedidoId} ahora está: *${nuevoEstado}*\n\n` +
          '_Escribe *admin* para volver al menú_'
        );

        // Notificar al cliente
        let mensajeCliente = '';
        if (nuevoEstado === 'completado') {
          mensajeCliente = `✅ ¡Tu pedido #${pedidoId} ha sido completado!\n\n` +
            `Gracias por tu preferencia. ¡Esperamos que lo disfrutes! 😋`;
        } else if (nuevoEstado === 'cancelado') {
          mensajeCliente = `❌ Tu pedido #${pedidoId} ha sido cancelado.\n\n` +
            `Si tienes alguna duda, contáctanos.`;
        }

        if (mensajeCliente && pedido.telefono) {
          await whatsappService.sendTextMessage(pedido.telefono, mensajeCliente);
        }

      } else {
        await whatsappService.sendTextMessage(from, '❌ Error al actualizar el estado');
      }
      
    } catch (error) {
      console.error('Error al confirmar cambio de estado:', error);
      await whatsappService.sendTextMessage(from, '❌ Error al actualizar el estado');
    }
  } else {
    await whatsappService.sendTextMessage(from, 
      '❌ Cambio cancelado\n\n_Escribe *admin* para volver al menú_');
  }
  
  clearSession(from);
}

/**
 * Ver detalle de un pedido (función auxiliar)
 */
async function handleAdminVerPedido(from, pedidoId) {
  try {
    const id = parseInt(pedidoId);
    if (isNaN(id)) {
      await whatsappService.sendTextMessage(from, '❌ ID inválido');
      return;
    }

    const pedido = await supabaseService.getPedidoById(id);
    
    if (!pedido) {
      await whatsappService.sendTextMessage(from, `❌ No se encontró el pedido #${id}`);
      return;
    }

    let mensaje = `📦 *PEDIDO #${pedido.id}*\n\n`;
    mensaje += `👤 *Cliente:* ${pedido.nombre_cliente}\n`;
    mensaje += `📞 *Teléfono:* ${pedido.telefono}\n`;
    mensaje += `📊 *Estado:* ${pedido.estado}\n`;
    mensaje += `💰 *Total:* $${pedido.total.toFixed(2)} MXN\n`;
    mensaje += `${pedido.tipo_entrega === 'delivery' ? '🚚' : '🏪'} *Entrega:* ${pedido.tipo_entrega}\n`;
    
    if (pedido.direccion_entrega) {
      mensaje += `📍 *Dirección:* ${pedido.direccion_entrega}\n`;
    }
    
    if (pedido.notas) {
      mensaje += `📝 *Notas:* ${pedido.notas}\n`;
    }

    const hora = new Date(pedido.created_at).toLocaleString('es-MX', {
      timeZone: 'America/Mexico_City'
    });
    mensaje += `⏰ *Fecha:* ${hora}`;

    await whatsappService.sendTextMessage(from, mensaje);
    clearSession(from);

  } catch (error) {
    console.error('Error al ver pedido:', error);
    await whatsappService.sendTextMessage(from, '❌ Error al cargar el pedido');
  }
}

module.exports = {
  handleMessage,
  getSession,
  clearSession
};
