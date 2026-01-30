/**
 * Servicio de WhatsApp
 * Maneja el envío de mensajes a través de Twilio WhatsApp API
 */

const twilio = require('twilio');
const config = require('../config/env');

// Inicializar cliente de Twilio
const client = twilio(config.twilio.accountSid, config.twilio.authToken);

/**
 * Enviar un mensaje de texto simple
 */
async function sendTextMessage(to, message) {
  try {
    // Twilio requiere formato whatsapp:+número
    const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:+${to}`;
    
    const response = await client.messages.create({
      body: message,
      from: config.twilio.whatsappNumber,
      to: formattedTo
    });

    console.log(`✅ Mensaje enviado a ${to} - SID: ${response.sid}`);
    return response;
  } catch (error) {
    console.error('❌ Error al enviar mensaje:', error.message);
    throw error;
  }
}

/**
 * Enviar un mensaje con botones interactivos
 * Nota: Twilio no soporta botones nativos en WhatsApp aún
 * Se envía como mensaje de texto formateado
 */
async function sendButtonMessage(to, bodyText, buttons) {
  try {
    let message = bodyText + '\n\n';
    buttons.slice(0, 3).forEach((btn, index) => {
      message += `${index + 1}. ${btn.title}\n`;
    });
    message += '\nResponde con el número de tu opción.';
    
    return await sendTextMessage(to, message);
  } catch (error) {
    console.error('❌ Error al enviar mensaje con botones:', error.message);
    throw error;
  }
}

/**
 * Enviar un mensaje con lista interactiva
 * Nota: Twilio no soporta listas nativas en WhatsApp aún
 * Se envía como mensaje de texto formateado
 */
async function sendListMessage(to, bodyText, buttonText, sections) {
  try {
    let message = bodyText + '\n\n';
    sections.forEach(section => {
      if (section.title) {
        message += `📋 ${section.title}\n`;
      }
      section.rows.forEach((row, index) => {
        message += `  ${index + 1}. ${row.title}\n`;
        if (row.description) {
          message += `     ${row.description}\n`;
        }
      });
      message += '\n';
    });
    message += `\n💡 ${buttonText}`;
    
    return await sendTextMessage(to, message);
  } catch (error) {
    console.error('❌ Error al enviar mensaje con lista:', error.message);
    throw error;
  }
}

/**
 * Marcar mensaje como leído
 * Nota: Twilio no tiene esta funcionalidad
 */
async function markAsRead(messageId) {
  // No implementado en Twilio
  console.log(`ℹ️ markAsRead no disponible en Twilio`);
}

/**
 * Enviar reacción a un mensaje
 * Nota: Twilio no soporta reacciones
 */
async function sendReaction(to, messageId, emoji) {
  // No implementado en Twilio
  console.log(`ℹ️ sendReaction no disponible en Twilio`);
}

module.exports = {
  sendTextMessage,
  sendButtonMessage,
  sendListMessage,
  markAsRead,
  sendReaction
};
