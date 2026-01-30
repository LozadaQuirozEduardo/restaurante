/**
 * Servidor Express - Bot de WhatsApp Business
 * Punto de entrada principal de la aplicación
 */

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const config = require('./config/env');
const whatsappWebhook = require('./webhooks/whatsapp');
const apiRoutes = require('./routes/api');

// Inicializar Express
const app = express();

// ============================================================================
// MIDDLEWARES
// ============================================================================

// CORS - Permitir peticiones desde cualquier origen
app.use(cors());

// Body parser para JSON
app.use(bodyParser.json());

// Body parser para formularios
app.use(bodyParser.urlencoded({ extended: true }));

// Rate limiting para prevenir abuso
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Máximo 100 peticiones por ventana
  message: 'Demasiadas peticiones desde esta IP, por favor intenta más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Aplicar rate limiting a todas las rutas excepto webhook
app.use('/api', limiter);

// Logging de peticiones
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ============================================================================
// RUTAS
// ============================================================================

/**
 * Ruta raíz - Información del servicio
 */
app.get('/', (req, res) => {
  res.json({
    service: 'WhatsApp Business Bot',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      webhook_verify: 'GET /webhook',
      webhook_receive: 'POST /webhook',
      health: 'GET /api/health',
      send_message: 'POST /api/send',
      orders: 'GET /api/orders',
      products: 'GET /api/products',
      categories: 'GET /api/categories'
    }
  });
});

/**
 * Webhook de WhatsApp
 * GET - Verificación del webhook (requerido por Meta)
 * POST - Recibir mensajes y notificaciones
 */
app.get('/webhook', whatsappWebhook.verifyWebhook);
app.post('/webhook', whatsappWebhook.receiveWebhook);

/**
 * Rutas de API REST
 */
app.use('/api', apiRoutes);

/**
 * Ruta 404 - No encontrada
 */
app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.path,
    method: req.method
  });
});

// ============================================================================
// MANEJO DE ERRORES
// ============================================================================

/**
 * Middleware de manejo de errores global
 */
app.use((err, req, res, next) => {
  console.error('❌ Error no manejado:', err);

  res.status(err.status || 500).json({
    error: 'Error interno del servidor',
    message: config.nodeEnv === 'development' ? err.message : 'Algo salió mal',
    timestamp: new Date().toISOString()
  });
});

/**
 * Manejo de errores no capturados
 */
process.on('uncaughtException', (error) => {
  console.error('❌ Excepción no capturada:', error);
  // En producción, podrías querer reiniciar el proceso
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rechazada no manejada:', reason);
});

// ============================================================================
// INICIAR SERVIDOR
// ============================================================================

const PORT = config.port;

app.listen(PORT, () => {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║                                                           ║');
  console.log('║        🤖 WhatsApp Business Bot - Restaurante 🍽️         ║');
  console.log('║                   Powered by Twilio                       ║');
  console.log('║                                                           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`✅ Servidor corriendo en puerto ${PORT}`);
  console.log(`🌍 Entorno: ${config.nodeEnv}`);
  console.log(`📱 WhatsApp Number: ${config.twilio.whatsappNumber}`);
  console.log(`🔗 Webhook URL: http://localhost:${PORT}/webhook`);
  console.log(`🗄️  Supabase: ${config.supabase.url}`);
  console.log('');
  console.log('📋 Endpoints disponibles:');
  console.log(`   GET  /              - Información del servicio`);
  console.log(`   GET  /webhook       - Verificación de webhook`);
  console.log(`   POST /webhook       - Recibir mensajes de WhatsApp`);
  console.log(`   GET  /api/health    - Estado del servicio`);
  console.log(`   POST /api/send      - Enviar mensaje manual`);
  console.log(`   GET  /api/orders    - Ver pedidos`);
  console.log(`   GET  /api/products  - Ver productos`);
  console.log('');
  console.log('🚀 Bot listo para recibir mensajes!');
  console.log('');
});

// Exportar app para testing
module.exports = app;
