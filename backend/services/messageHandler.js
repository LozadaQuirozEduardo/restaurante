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

    // BLOQUEAR PEDIDOS DESDE EL NÚMERO ADMINISTRATIVO
    const ADMIN_NUMBER = '5519060013';
    
    if (from === ADMIN_NUMBER) {
      // Solo permitir comandos administrativos
      if (textLower === 'admin' || textLower === 'gestionar' || textLower === 'pedidos' || 
          textLower === 'pendientes' || textLower.includes('completar') || 
          textLower.includes('cancelar') || textLower.startsWith('estado ')) {
        // Permitir estos comandos
      } else {
        await whatsappService.sendTextMessage(from,
          '⚠️ Este número es administrativo.\n\n' +
          'Solo puedes:\n' +
          '• Ver pedidos pendientes\n' +
          '• Completar pedidos (completar #6)\n' +
          '• Cancelar pedidos (cancelar #6)\n\n' +
          'Para hacer pedidos, usa otro número de WhatsApp.');
        return;
      }
    }

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

    // Detectar si el cliente quiere cancelar un pedido
    const cancelPedidoMatch = textLower.match(/cancelar[\s]*(pedido)?[\s]*#?(\d+)/);
    if (cancelPedidoMatch && from !== ADMIN_PHONE) {
      const pedidoId = cancelPedidoMatch[2];
      await cancelarPedidoCliente(from, pedidoId);
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
� *mis pedidos* - Ver mis pedidos recientes
�📞 *contacto* - Información de contacto
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
  const session = getSession(phoneNumber);
  const categoriaSeleccionada = session?.data?.categoriaSeleccionada || null;
  
  if (message.includes('menu') || message.includes('menú') || message.includes('producto') || message === '1') {
    await showCategorias(phoneNumber);
  } else if (message.includes('pedir') || message.includes('pedido') || message.includes('comprar') || message === '2') {
    // Si hay una categoría seleccionada, iniciar pedido con esa categoría
    await iniciarPedido(phoneNumber, 1, categoriaSeleccionada);
  } else if (message.includes('mis pedidos') || message.includes('pedidos recientes')) {
    await mostrarPedidosCliente(phoneNumber);
  } else if (message.includes('contacto')) {
    await whatsappService.sendTextMessage(phoneNumber, 
      `📞 *Información de Contacto*\n\n` +
      `📱 WhatsApp: Este número\n` +
      `⏰ Horario: Lunes a Domingo 10:00 - 22:00\n` +
      `📍 Ubicación: Unidad Habitacional los Héroes Chalco\n` +
      `   Mz 17 Lt 17 planta baja el cupido C.P 56644\n` +
      `   (enfrente glorieta el oasis)\n\n` +
      `¿Necesitas algo más? Escribe *hola* para ver el menú.`
    );
  } else if (message.includes('ayuda') || message.includes('help')) {
    await whatsappService.sendTextMessage(phoneNumber, 
      `ℹ️ *Comandos Disponibles:*\n\n` +
      `📋 *menú* - Ver todos los productos\n` +
      `🛒 *pedir* - Hacer un pedido\n` +
      `📦 *mis pedidos* - Ver pedidos recientes\n` +
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
async function showAllProductos(phoneNumber, pagina = 1) {
  const productos = await supabaseService.getProductos();

  if (productos.length === 0) {
    await whatsappService.sendTextMessage(phoneNumber, 
      '😔 No hay productos disponibles en este momento.\n\nEscribe *hola* para volver al inicio.');
    clearSession(phoneNumber);
    return;
  }

  // Agrupar productos por categoría
  const categorias = {};
  productos.forEach(prod => {
    const catNombre = prod.categorias?.nombre || 'Otros';
    if (!categorias[catNombre]) {
      categorias[catNombre] = [];
    }
    categorias[catNombre].push(prod);
  });

  // Dividir en páginas (máximo 800 caracteres por mensaje aprox)
  const mensajes = [];
  let mensajeActual = '🍽️ *Nuestro Menú Completo:*\n\n';
  let caracteresActuales = mensajeActual.length;
  
  Object.keys(categorias).forEach(catNombre => {
    let seccionCategoria = `📂 *${catNombre}*\n`;
    
    categorias[catNombre].forEach(prod => {
      const precio = prod.precio % 1 === 0 ? prod.precio : prod.precio.toFixed(2);
      seccionCategoria += `  • ${prod.nombre} - $${precio} MXN\n`;
      if (prod.descripcion) {
        seccionCategoria += `    _${prod.descripcion}_\n`;
      }
    });
    seccionCategoria += '\n';

    // Si agregar esta categoría excede el límite, crear un nuevo mensaje
    if (caracteresActuales + seccionCategoria.length > 1400) {
      mensajes.push(mensajeActual);
      mensajeActual = seccionCategoria;
      caracteresActuales = seccionCategoria.length;
    } else {
      mensajeActual += seccionCategoria;
      caracteresActuales += seccionCategoria.length;
    }
  });

  // Agregar el último mensaje
  if (mensajeActual.length > 0) {
    mensajes.push(mensajeActual);
  }

  // Enviar todos los mensajes
  for (let i = 0; i < mensajes.length; i++) {
    let mensaje = mensajes[i];
    
    // Solo agregar la opción de pedido en el último mensaje
    if (i === mensajes.length - 1) {
      mensaje += '\n🛒 ¿Deseas hacer un pedido? Escribe *pedir*';
    }
    
    await whatsappService.sendTextMessage(phoneNumber, mensaje);
    
    // Pequeña pausa entre mensajes para evitar problemas
    if (i < mensajes.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

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

  // Dividir productos en páginas si exceden el límite
  const PRODUCTOS_POR_PAGINA = 20;
  const mensajes = [];
  
  for (let i = 0; i < productos.length; i += PRODUCTOS_POR_PAGINA) {
    let message = `🍽️ *${categoria.nombre}*\n\n`;
    const productosPagina = productos.slice(i, i + PRODUCTOS_POR_PAGINA);
    
    productosPagina.forEach((prod, index) => {
      const numeroReal = i + index + 1;
      const precio = prod.precio % 1 === 0 ? prod.precio : prod.precio.toFixed(2);
      message += `${numeroReal}. *${prod.nombre}* - $${precio} MXN\n`;
      if (prod.descripcion) {
        message += `   _${prod.descripcion}_\n`;
      }
    });
    
    mensajes.push(message);
  }

  // Enviar todos los mensajes
  for (let i = 0; i < mensajes.length; i++) {
    let mensaje = mensajes[i];
    
    // Solo agregar la opción de pedido en el último mensaje
    if (i === mensajes.length - 1) {
      mensaje += '\n🛒 ¿Deseas hacer un pedido? Escribe *pedir*';
    }
    
    await whatsappService.sendTextMessage(phoneNumber, mensaje);
    
    // Pequeña pausa entre mensajes
    if (i < mensajes.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // Guardar la categoría en la sesión para usar al pedir
  updateSession(phoneNumber, { step: 'menu_principal', data: { categoriaSeleccionada: categoria.id } });
}

/**
 * Iniciar proceso de pedido
 */
async function iniciarPedido(phoneNumber, pagina = 1, categoriaId = null) {
  // Si hay categoría específica, obtener solo productos de esa categoría
  const productos = categoriaId 
    ? await supabaseService.getProductos(categoriaId)
    : await supabaseService.getProductos();

  if (productos.length === 0) {
    await whatsappService.sendTextMessage(phoneNumber, 
      '😔 Lo sentimos, no hay productos disponibles para ordenar en este momento.');
    clearSession(phoneNumber);
    return;
  }

  // Dividir productos en páginas de 15 elementos
  const PRODUCTOS_POR_PAGINA = 15;
  const totalPaginas = Math.ceil(productos.length / PRODUCTOS_POR_PAGINA);
  const inicio = (pagina - 1) * PRODUCTOS_POR_PAGINA;
  const fin = inicio + PRODUCTOS_POR_PAGINA;
  const productosPagina = productos.slice(inicio, fin);

  let message = `🛒 *Iniciar Pedido* (Página ${pagina}/${totalPaginas})\n\nPerfecto! Estos son nuestros productos:\n\n`;
  
  productosPagina.forEach((prod, index) => {
    const numeroReal = inicio + index + 1;
    const precio = prod.precio % 1 === 0 ? prod.precio : prod.precio.toFixed(2);
    message += `${numeroReal}. ${prod.nombre} - $${precio} MXN\n`;
  });

  message += '\n━━━━━━━━━━━━━━━━━━━━━━\n';
  message += '📝 *¿Cómo ordenar?*\n\n';
  message += `⚠️ *IMPORTANTE:* Usa los números *${inicio + 1}* al *${Math.min(fin, productos.length)}* de esta página\n\n`;
  message += '✅ Un producto: Escribe *1*\n';
  message += '✅ Varios: Separa con comas *1, 3, 5*\n';
  message += '✅ Máximo: 5 productos a la vez\n';
  
  if (totalPaginas > 1) {
    message += `\n📄 Página ${pagina} de ${totalPaginas}\n`;
    if (pagina < totalPaginas) {
      message += '➡️ Escribe *siguiente* para ver más\n';
    }
    if (pagina > 1) {
      message += '⬅️ Escribe *anterior* para regresar\n';
    }
  }
  
  message += '\n❌ Escribe *cancelar* para salir';

  await whatsappService.sendTextMessage(phoneNumber, message);
  updateSession(phoneNumber, { 
    step: 'pedir_producto', 
    data: { productos, carrito: [], paginaActual: pagina, categoriaId: categoriaId } 
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
  const { productos, paginaActual = 1, categoriaId = null } = session.data;
  const messageLower = message.toLowerCase().trim();

  // Manejar navegación entre páginas
  if (messageLower === 'siguiente' || messageLower === 'sig') {
    const PRODUCTOS_POR_PAGINA = 15;
    const totalPaginas = Math.ceil(productos.length / PRODUCTOS_POR_PAGINA);
    
    if (paginaActual < totalPaginas) {
      await iniciarPedido(phoneNumber, paginaActual + 1, categoriaId);
    } else {
      await whatsappService.sendTextMessage(phoneNumber, 
        '❌ Ya estás en la última página.');
    }
    return;
  }

  if (messageLower === 'anterior' || messageLower === 'ant') {
    if (paginaActual > 1) {
      await iniciarPedido(phoneNumber, paginaActual - 1, categoriaId);
    } else {
      await whatsappService.sendTextMessage(phoneNumber, 
        '❌ Ya estás en la primera página.');
    }
    return;
  }

  // Permitir múltiples productos separados por comas
  const numeros = message.split(',').map(n => n.trim());
  const productosSeleccionados = [];

  // Validar límite de productos
  if (numeros.length > 5) {
    await whatsappService.sendTextMessage(phoneNumber, 
      '⚠️ *Solo puedes seleccionar hasta 5 productos a la vez.*\n\n' +
      'Escribe los números separados por comas (ej: 1, 2, 3)');
    return;
  }

  // Calcular rango de productos en esta página
  const PRODUCTOS_POR_PAGINA = 15;
  const paginaActualNum = paginaActual || 1;
  const inicioIndex = (paginaActualNum - 1) * PRODUCTOS_POR_PAGINA;
  const finIndex = Math.min(inicioIndex + PRODUCTOS_POR_PAGINA, productos.length);
  const productosEnPagina = productos.slice(inicioIndex, finIndex);

  for (const num of numeros) {
    const numeroProducto = parseInt(num);
    
    // Validar que sea un número
    if (isNaN(numeroProducto)) {
      await whatsappService.sendTextMessage(phoneNumber, 
        `❌ "${num}" no es un número válido.\n\n` +
        'Escribe solo números (ej: 1, 2, 3)');
      return;
    }

    // Validar rango en la página actual
    const numeroRelativo = numeroProducto - inicioIndex;
    if (numeroRelativo < 1 || numeroRelativo > productosEnPagina.length) {
      const totalPaginas = Math.ceil(productos.length / PRODUCTOS_POR_PAGINA);
      await whatsappService.sendTextMessage(phoneNumber, 
        `❌ *El número ${numeroProducto} no está en esta página.*\n\n` +
        `⚠️ En esta página solo hay productos del *${inicioIndex + 1}* al *${finIndex}*\n\n` +
        (totalPaginas > 1 ? 
          `💡 Usa *siguiente* o *anterior* para navegar entre páginas.` : 
          `💡 Elige un número entre ${inicioIndex + 1} y ${finIndex}.`));
      return;
    }
    
    const productoIndex = numeroRelativo - 1;
    const producto = productosEnPagina[productoIndex];
    
    // Verificar que el producto existe
    if (!producto) {
      await whatsappService.sendTextMessage(phoneNumber, 
        `❌ Error al obtener el producto #${numeroProducto}.\n\n` +
        'Por favor intenta nuevamente.');
      return;
    }
    
    productosSeleccionados.push(producto);
  }

  // Confirmar productos seleccionados si son múltiples
  if (productosSeleccionados.length > 1) {
    let confirmacion = '✅ *Productos seleccionados:*\n\n';
    productosSeleccionados.forEach((p, i) => {
      confirmacion += `${i + 1}. ${p.nombre} - $${p.precio.toFixed(2)}\n`;
    });
    confirmacion += '\n📦 Ahora indica la cantidad para cada uno.';
    await whatsappService.sendTextMessage(phoneNumber, confirmacion);
  }

  // Guardar todos los productos seleccionados y empezar con el primero
  session.data.productosSeleccionados = productosSeleccionados;
  session.data.indiceProdActual = 0;
  
  const producto = productosSeleccionados[0];
  
  await whatsappService.sendTextMessage(phoneNumber, 
    `✅ *Producto seleccionado:*\n\n` +
    `🍽️ ${producto.nombre}\n` +
    `💰 Precio: $${producto.precio.toFixed(2)}\n` +
    (producto.categorias?.nombre ? `📂 Categoría: ${producto.categorias.nombre}\n` : '') +
    `\n📦 *¿Cuántas unidades deseas?*\n` +
    `💡 Escribe un número (ej: 1, 2, 3...)`
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

  // Validaciones de cantidad
  if (isNaN(cantidad)) {
    await whatsappService.sendTextMessage(phoneNumber, 
      '❌ Eso no es un número válido.\n\n' +
      '💡 Escribe solo números (ej: 1, 2, 3...)');
    return;
  }

  if (cantidad <= 0) {
    await whatsappService.sendTextMessage(phoneNumber, 
      '❌ La cantidad debe ser mayor a 0.\n\n' +
      '💡 Escribe cuántas unidades deseas.');
    return;
  }

  if (cantidad > 50) {
    await whatsappService.sendTextMessage(phoneNumber, 
      '⚠️ *Cantidad muy alta*\n\n' +
      'Por pedidos mayores a 50 unidades, por favor llámanos al [TU_TELEFONO] para atenderte mejor.');
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
  const totalCarrito = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

  await whatsappService.sendTextMessage(phoneNumber, 
    `✅ *Agregado al carrito:*\n\n` +
    `${cantidad}x ${productoSeleccionado.nombre}\n` +
    `💰 Subtotal: $${subtotal.toFixed(2)}\n\n` +
    `🛒 Total en carrito: $${totalCarrito.toFixed(2)}\n` +
    `📦 Productos: ${carrito.length}`
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
  const categoriaId = session?.data?.categoriaId || null;

  if (message.includes('si') || message.includes('sí') || message.includes('mas') || message.includes('más')) {
    await iniciarPedido(phoneNumber, 1, categoriaId);
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

  // Validaciones del nombre
  if (nombre.length < 3) {
    await whatsappService.sendTextMessage(phoneNumber, 
      '❌ El nombre es muy corto.\n\n' +
      '💡 Por favor escribe tu nombre completo.');
    return;
  }

  if (nombre.length > 50) {
    await whatsappService.sendTextMessage(phoneNumber, 
      '❌ El nombre es muy largo.\n\n' +
      '💡 Por favor escribe solo tu nombre.');
    return;
  }

  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombre)) {
    await whatsappService.sendTextMessage(phoneNumber, 
      '❌ El nombre solo debe contener letras.\n\n' +
      '💡 Por favor escribe tu nombre sin números ni símbolos.');
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

  // Validaciones de dirección
  if (direccion.length < 15) {
    await whatsappService.sendTextMessage(phoneNumber, 
      '❌ La dirección es muy corta.\n\n' +
      '💡 Por favor incluye:\n' +
      '• Calle\n' +
      '• Número\n' +
      '• Colonia\n' +
      '• Referencias');
    return;
  }

  if (direccion.length > 200) {
    await whatsappService.sendTextMessage(phoneNumber, 
      '❌ La dirección es muy larga.\n\n' +
      '💡 Por favor escribe una dirección más concisa.');
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

/**
 * Mostrar pedidos recientes del cliente y permitir cancelar (dentro de 20 min)
 */
async function mostrarPedidosCliente(phoneNumber) {
  try {
    // Obtener pedidos recientes del cliente
    const { data: pedidos, error } = await supabase
      .from('pedidos')
      .select('*')
      .eq('telefono', phoneNumber)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error || !pedidos || pedidos.length === 0) {
      await whatsappService.sendTextMessage(phoneNumber,
        '📦 No tienes pedidos registrados.\n\n' +
        'Escribe *pedir* para hacer tu primer pedido.');
      return;
    }

    let mensaje = `📋 *Tus Últimos Pedidos*\n\n`;

    pedidos.forEach(pedido => {
      const fecha = new Date(pedido.created_at);
      const ahora = new Date();
      const minutosTranscurridos = Math.floor((ahora - fecha) / 60000);
      const puedeCancel = pedido.estado === 'pendiente' && minutosTranscurridos <= 20;

      mensaje += `🔸 *Pedido #${pedido.id}*\n`;
      mensaje += `   Estado: ${pedido.estado === 'pendiente' ? '⏳ Pendiente' : 
                              pedido.estado === 'completado' ? '✅ Completado' : 
                              '❌ Cancelado'}\n`;
      mensaje += `   Total: $${pedido.total} MXN\n`;
      mensaje += `   Hace ${minutosTranscurridos} min\n`;
      
      if (puedeCancel) {
        mensaje += `   ⚠️ Puedes cancelar (${20 - minutosTranscurridos} min restantes)\n`;
      }
      
      mensaje += `\n`;
    });

    mensaje += `\n💡 Para cancelar un pedido pendiente escribe:\n`;
    mensaje += `"cancelar pedido #6"\n\n`;
    mensaje += `⚠️ Solo puedes cancelar pedidos pendientes dentro de los primeros 20 minutos.`;

    await whatsappService.sendTextMessage(phoneNumber, mensaje);

  } catch (error) {
    console.error('Error al mostrar pedidos del cliente:', error);
    await whatsappService.sendTextMessage(phoneNumber,
      '❌ Error al cargar tus pedidos. Intenta nuevamente.');
  }
}

/**
 * Cancelar pedido por parte del cliente (solo dentro de 20 minutos)
 */
async function cancelarPedidoCliente(phoneNumber, pedidoId) {
  try {
    // Buscar el pedido
    const { data: pedido, error: fetchError } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id', pedidoId)
      .eq('telefono', phoneNumber)
      .single();

    if (fetchError || !pedido) {
      await whatsappService.sendTextMessage(phoneNumber,
        `❌ No se encontró el pedido #${pedidoId} o no te pertenece.`);
      return;
    }

    // Verificar si ya está cancelado o completado
    if (pedido.estado === 'cancelado') {
      await whatsappService.sendTextMessage(phoneNumber,
        `ℹ️ El pedido #${pedidoId} ya está cancelado.`);
      return;
    }

    if (pedido.estado === 'completado') {
      await whatsappService.sendTextMessage(phoneNumber,
        `❌ No puedes cancelar el pedido #${pedidoId} porque ya está completado.`);
      return;
    }

    // Verificar el tiempo transcurrido (20 minutos = 1200000 ms)
    const fechaPedido = new Date(pedido.created_at);
    const ahora = new Date();
    const minutosTranscurridos = Math.floor((ahora - fechaPedido) / 60000);

    if (minutosTranscurridos > 20) {
      await whatsappService.sendTextMessage(phoneNumber,
        `⏰ Lo siento, ya pasaron ${minutosTranscurridos} minutos desde que hiciste el pedido #${pedidoId}.\n\n` +
        `Solo puedes cancelar pedidos dentro de los primeros 20 minutos.\n\n` +
        `Si tienes algún problema, por favor contacta al restaurante.`);
      return;
    }

    // Cancelar el pedido
    const { error: updateError } = await supabase
      .from('pedidos')
      .update({ estado: 'cancelado' })
      .eq('id', pedidoId);

    if (updateError) {
      console.error('Error al cancelar pedido del cliente:', updateError);
      await whatsappService.sendTextMessage(phoneNumber,
        `❌ Error al cancelar el pedido #${pedidoId}. Intenta nuevamente.`);
      return;
    }

    // Enviar confirmación
    await whatsappService.sendTextMessage(phoneNumber,
      `✅ *Pedido #${pedidoId} cancelado exitosamente*\n\n` +
      `Cliente: ${pedido.nombre_cliente}\n` +
      `Total: $${pedido.total} MXN\n\n` +
      `Tu pedido ha sido cancelado. Esperamos verte pronto! 😊`);

    console.log(`✅ Pedido #${pedidoId} cancelado por el cliente ${phoneNumber} (${minutosTranscurridos} min)`);

  } catch (error) {
    console.error('Error al procesar cancelación del cliente:', error);
    await whatsappService.sendTextMessage(phoneNumber,
      `❌ Error al procesar la cancelación. Por favor intenta nuevamente.`);
  }
}

module.exports = {
  handleMessage,
  getSession,
  clearSession
};
