/**
 * Rutas de API REST
 * Endpoints adicionales para gestión del bot
 */

const express = require('express');
const router = express.Router();
const whatsappService = require('../services/whatsappService');
const supabaseService = require('../services/supabaseService');
const messageHandler = require('../services/messageHandler');

/**
 * GET /api/health
 * Verificar estado del servicio
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'WhatsApp Business Bot',
    version: '1.0.0'
  });
});

/**
 * POST /api/send
 * Enviar mensaje manual a un número
 * Body: { to: "521234567890", message: "Hola!" }
 */
router.post('/send', async (req, res) => {
  try {
    const { to, message } = req.body;

    if (!to || !message) {
      return res.status(400).json({
        error: 'Faltan parámetros requeridos: to, message'
      });
    }

    const result = await whatsappService.sendTextMessage(to, message);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/orders
 * Obtener lista de pedidos
 * Query params: ?cliente_id=123&limite=50
 */
router.get('/orders', async (req, res) => {
  try {
    const clienteId = req.query.cliente_id || null;
    const limite = parseInt(req.query.limite) || 50;

    const pedidos = await supabaseService.getPedidos(clienteId, limite);

    res.json({
      success: true,
      count: pedidos.length,
      data: pedidos
    });

  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PATCH /api/orders/:id/status
 * Actualizar estado de un pedido
 * Body: { estado: "preparando" }
 */
router.patch('/orders/:id/status', async (req, res) => {
  try {
    const pedidoId = parseInt(req.params.id);
    const { estado } = req.body;

    if (!estado) {
      return res.status(400).json({
        error: 'Falta parámetro requerido: estado'
      });
    }

    const estadosValidos = ['pendiente', 'preparando', 'en_camino', 'entregado', 'cancelado'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        error: `Estado inválido. Valores válidos: ${estadosValidos.join(', ')}`
      });
    }

    const pedido = await supabaseService.updateEstadoPedido(pedidoId, estado);

    if (!pedido) {
      return res.status(404).json({
        error: 'Pedido no encontrado'
      });
    }

    res.json({
      success: true,
      data: pedido
    });

  } catch (error) {
    console.error('Error al actualizar pedido:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/products
 * Obtener lista de productos
 * Query params: ?categoria_id=1
 */
router.get('/products', async (req, res) => {
  try {
    const categoriaId = req.query.categoria_id || null;
    const productos = await supabaseService.getProductos(categoriaId);

    res.json({
      success: true,
      count: productos.length,
      data: productos
    });

  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/categories
 * Obtener lista de categorías
 */
router.get('/categories', async (req, res) => {
  try {
    const categorias = await supabaseService.getCategorias();

    res.json({
      success: true,
      count: categorias.length,
      data: categorias
    });

  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/sessions
 * Ver sesiones activas (útil para debugging)
 */
router.get('/sessions', (req, res) => {
  try {
    const sessions = messageHandler.getSession ? 'Sesiones activas' : 'No disponible';
    
    res.json({
      success: true,
      message: 'Las sesiones están en memoria. Esta información es temporal.'
    });

  } catch (error) {
    console.error('Error al obtener sesiones:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/sessions/:phone
 * Limpiar sesión de un usuario
 */
router.delete('/sessions/:phone', (req, res) => {
  try {
    const phone = req.params.phone;
    messageHandler.clearSession(phone);

    res.json({
      success: true,
      message: `Sesión limpiada para ${phone}`
    });

  } catch (error) {
    console.error('Error al limpiar sesión:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
