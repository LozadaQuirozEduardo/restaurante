/**
 * Servicio de Supabase
 * Maneja todas las operaciones con la base de datos
 */

const { createClient } = require('@supabase/supabase-js');
const config = require('../config/env');

// Inicializar cliente de Supabase
const supabase = createClient(config.supabase.url, config.supabase.key);

/**
 * Obtener todas las categorías activas
 */
async function getCategorias() {
  try {
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .order('id');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    return [];
  }
}

/**
 * Obtener productos de una categoría específica o todos
 */
async function getProductos(categoriaId = null) {
  try {
    let query = supabase
      .from('productos')
      .select(`
        *,
        categorias (
          id,
          nombre
        )
      `)
      .eq('disponible', true);

    if (categoriaId) {
      query = query.eq('categoria_id', categoriaId);
    }

    const { data, error } = await query.order('nombre');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error al obtener productos:', error);
    return [];
  }
}

/**
 * Obtener un producto por ID
 */
async function getProductoById(productoId) {
  try {
    const { data, error } = await supabase
      .from('productos')
      .select(`
        *,
        categorias (
          id,
          nombre
        )
      `)
      .eq('id', productoId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error al obtener producto:', error);
    return null;
  }
}

/**
 * Buscar o crear cliente por teléfono
 */
async function getOrCreateCliente(telefono, nombre = null) {
  try {
    // Buscar cliente existente
    let { data: cliente, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('telefono', telefono)
      .single();

    // Si no existe, crear uno nuevo
    if (error && error.code === 'PGRST116') {
      const { data: nuevoCliente, error: createError } = await supabase
        .from('clientes')
        .insert([
          {
            telefono: telefono,
            nombre: nombre || 'Cliente'
          }
        ])
        .select()
        .single();

      if (createError) throw createError;
      return nuevoCliente;
    }

    if (error) throw error;

    // Actualizar nombre si se proporciona uno nuevo
    if (nombre && cliente.nombre !== nombre) {
      const { data: clienteActualizado, error: updateError } = await supabase
        .from('clientes')
        .update({ nombre: nombre })
        .eq('id', cliente.id)
        .select()
        .single();

      if (updateError) throw updateError;
      return clienteActualizado;
    }

    return cliente;
  } catch (error) {
    console.error('Error en getOrCreateCliente:', error);
    return null;
  }
}

/**
 * Crear un nuevo pedido
 */
async function createPedido(clienteId, items, tipoEntrega = null, direccion = null, notas = null, telefono = null, nombreCliente = null) {
  try {
    // Calcular total del pedido
    let total = 0;
    const detallesConPrecios = [];

    for (const item of items) {
      const producto = await getProductoById(item.producto_id);
      if (producto) {
        const subtotal = producto.precio * item.cantidad;
        total += subtotal;
        detallesConPrecios.push({
          producto_id: item.producto_id,
          producto_nombre: producto.nombre,
          cantidad: item.cantidad,
          precio_unitario: producto.precio,
          subtotal: subtotal
        });
      }
    }

    // Determinar tipo de entrega para la base de datos
    let tipoDB = 'recoger'; // valor por defecto
    if (tipoEntrega) {
      if (tipoEntrega.toLowerCase().includes('domicilio') || tipoEntrega.toLowerCase().includes('delivery')) {
        tipoDB = 'delivery';
      } else if (tipoEntrega.toLowerCase().includes('recoger') || tipoEntrega.toLowerCase().includes('restaurante')) {
        tipoDB = 'recoger';
      }
    }

    // Crear el pedido
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .insert([
        {
          cliente_id: clienteId,
          telefono: telefono,
          nombre_cliente: nombreCliente,
          estado: 'pendiente',
          total: total,
          tipo_entrega: tipoDB,
          direccion_entrega: direccion,
          notas: notas
        }
      ])
      .select()
      .single();

    if (pedidoError) throw pedidoError;

    // Agregar los detalles del pedido
    const detallesParaInsertar = detallesConPrecios.map(detalle => ({
      ...detalle,
      pedido_id: pedido.id
    }));

    const { error: detallesError } = await supabase
      .from('pedido_detalles')
      .insert(detallesParaInsertar);

    if (detallesError) throw detallesError;

    return pedido;
  } catch (error) {
    console.error('Error al crear pedido:', error);
    return null;
  }
}

/**
 * Obtener todos los pedidos o de un cliente específico
 */
async function getPedidos(clienteId = null, limite = 50) {
  try {
    let query = supabase
      .from('pedidos')
      .select(`
        *,
        clientes (
          id,
          nombre,
          telefono
        ),
        pedido_detalles (
          *,
          productos (
            nombre,
            precio
          )
        )
      `)
      .order('fecha_pedido', { ascending: false })
      .limit(limite);

    if (clienteId) {
      query = query.eq('cliente_id', clienteId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    return [];
  }
}

/**
 * Actualizar estado de un pedido
 */
async function updateEstadoPedido(pedidoId, nuevoEstado) {
  try {
    const { data, error } = await supabase
      .from('pedidos')
      .update({ estado: nuevoEstado })
      .eq('id', pedidoId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error al actualizar estado del pedido:', error);
    return null;
  }
}

/**
 * Obtener pedidos pendientes
 */
async function getPedidosPendientes() {
  try {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .eq('estado', 'pendiente')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error al obtener pedidos pendientes:', error);
    return [];
  }
}

/**
 * Obtener pedidos de hoy
 */
async function getPedidosHoy() {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const hoyISO = hoy.toISOString();

    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .gte('created_at', hoyISO)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error al obtener pedidos de hoy:', error);
    return [];
  }
}

/**
 * Obtener un pedido por ID con todos sus detalles
 */
async function getPedidoById(pedidoId) {
  try {
    const { data, error } = await supabase
      .from('pedidos')
      .select(`
        *,
        pedido_detalles (
          *
        )
      `)
      .eq('id', pedidoId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error al obtener pedido por ID:', error);
    return null;
  }
}

/**
 * Actualizar estado de un pedido (alias para compatibilidad)
 */
async function actualizarEstadoPedido(pedidoId, nuevoEstado) {
  return updateEstadoPedido(pedidoId, nuevoEstado);
}

module.exports = {
  supabase,
  getCategorias,
  getProductos,
  getProductoById,
  getOrCreateCliente,
  createPedido,
  getPedidos,
  updateEstadoPedido,
  getPedidosPendientes,
  getPedidosHoy,
  getPedidoById,
  actualizarEstadoPedido
};
