/**
 * Webhook de WhatsApp (Twilio)
 * Maneja los eventos recibidos desde Twilio WhatsApp API
 */

const messageHandler = require('../services/messageHandler');

/**
 * GET - No es necesario para Twilio
 */
function verifyWebhook(req, res) {
  res.status(200).send('Webhook de Twilio WhatsApp activo');
}

/**
 * POST - Recibir mensajes de Twilio WhatsApp
 */
async function receiveWebhook(req, res) {
  try {
    const body = req.body;

    // Log de evento recibido
    console.log('📨 Webhook de Twilio recibido:', JSON.stringify(body, null, 2));

    // Responder rápidamente a Twilio
    res.status(200).send('OK');

    // Obtener datos del mensaje
    const from = body.From; // Formato: whatsapp:+5213349420820
    const message = body.Body;
    const messageId = body.MessageSid;

    if (from && message) {
      // Limpiar el número (quitar whatsapp: prefix)
      const phoneNumber = from.replace('whatsapp:', '').replace('+', '');
      
      console.log(`📱 Mensaje de ${phoneNumber}: "${message}"`);
      
      // Procesar el mensaje
      await processIncomingMessage(phoneNumber, message, messageId);
    }

  } catch (error) {
    console.error('❌ Error al procesar webhook:', error);
    // Ya respondimos 200, no podemos cambiar la respuesta
  }
}

/**
 * Procesar mensaje entrante de Twilio
 */
async function processIncomingMessage(phoneNumber, message, messageId) {
  try {
    console.log(`📱 Procesando mensaje de ${phoneNumber}: "${message}"`);
    
    // Llamar al manejador de mensajes
    await messageHandler.handleMessage(phoneNumber, message, messageId);

  } catch (error) {
    console.error('❌ Error al procesar mensaje entrante:', error);
  }
}

module.exports = {
  verifyWebhook,
  receiveWebhook
};
