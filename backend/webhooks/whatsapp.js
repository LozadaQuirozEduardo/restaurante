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
    
    // NÚMERO ADMINISTRATIVO: 5519060013
    const ADMIN_NUMBER = '5519060013';
    
    // Si el mensaje viene del número administrativo, verificar comandos especiales
    if (phoneNumber === ADMIN_NUMBER) {
      const handled = await handleAdminCommand(phoneNumber, message);
      if (handled) {
        console.log('✅ Comando administrativo procesado');
        return;
      }
    }
    
    // Llamar al manejador de mensajes normal
    await messageHandler.handleMessage(phoneNumber, message, messageId);

  } catch (error) {
    console.error('❌ Error al procesar mensaje entrante:', error);
  }
}

/**
 * Manejar comandos administrativos desde el número de gestión
 */
async function handleAdminCommand(phoneNumber, message) {
  const { createClient } = require('@supabase/supabase-js');
  const twilioService = require('../services/twilio');
  
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
  );
  
  const messageLower = message.toLowerCase().trim();
  
  // COMANDO: Completar pedido
  // Formatos aceptados:
  // - "completar #6" 
  // - "pedido 6 listo"
  // - "completar 6"
  // - "listo #6"
  // - "terminado 6"
  
  const completarMatch = messageLower.match(/(?:completar|listo|terminado|completo)[\s#]*(\d+)/);
  
  if (completarMatch) {
    const pedidoId = completarMatch[1];
    
    try {
      // Buscar el pedido
      const { data: pedido, error: fetchError } = await supabase
        .from('pedidos')
        .select('*')
        .eq('id', pedidoId)
        .single();
      
      if (fetchError || !pedido) {
        await twilioService.sendMessage(
          phoneNumber,
          `❌ No se encontró el pedido #${pedidoId}`
        );
        return true;
      }
      
      // Verificar si ya está completado
      if (pedido.estado === 'completado') {
        await twilioService.sendMessage(
          phoneNumber,
          `ℹ️ El pedido #${pedidoId} ya estaba completado`
        );
        return true;
      }
      
      // Actualizar el pedido a completado
      const { error: updateError } = await supabase
        .from('pedidos')
        .update({ estado: 'completado' })
        .eq('id', pedidoId);
      
      if (updateError) {
        console.error('Error al actualizar pedido:', updateError);
        await twilioService.sendMessage(
          phoneNumber,
          `❌ Error al completar el pedido #${pedidoId}`
        );
        return true;
      }
      
      // Enviar confirmación al admin
      await twilioService.sendMessage(
        phoneNumber,
        `✅ *Pedido #${pedidoId} completado*\n\n` +
        `Cliente: ${pedido.nombre_cliente}\n` +
        `Total: $${pedido.total} MXN\n\n` +
        `El pedido ha sido marcado como completado en el sistema.`
      );
      
      console.log(`✅ Pedido #${pedidoId} marcado como completado por admin`);
      return true;
      
    } catch (error) {
      console.error('Error al procesar comando completar:', error);
      await twilioService.sendMessage(
        phoneNumber,
        `❌ Error al procesar el comando: ${error.message}`
      );
      return true;
    }
  }
  
  // COMANDO: Ver pedidos pendientes
  if (messageLower.includes('pendientes') || messageLower.includes('pedidos')) {
    try {
      const { data: pedidos, error } = await supabase
        .from('pedidos')
        .select('*')
        .eq('estado', 'pendiente')
        .order('id', { ascending: false })
        .limit(10);
      
      if (error || !pedidos || pedidos.length === 0) {
        await twilioService.sendMessage(
          phoneNumber,
          '✅ No hay pedidos pendientes en este momento'
        );
        return true;
      }
      
      let mensaje = `📋 *Pedidos Pendientes (${pedidos.length})*\n\n`;
      
      pedidos.forEach(p => {
        mensaje += `🔸 *Pedido #${p.id}*\n`;
        mensaje += `   Cliente: ${p.nombre_cliente}\n`;
        mensaje += `   Total: $${p.total} MXN\n`;
        mensaje += `   Hora: ${new Date(p.created_at).toLocaleTimeString('es-MX')}\n\n`;
      });
      
      mensaje += `\n💡 Para completar un pedido escribe:\n"completar #6"`;
      
      await twilioService.sendMessage(phoneNumber, mensaje);
      return true;
      
    } catch (error) {
      console.error('Error al obtener pedidos pendientes:', error);
      return false;
    }
  }
  
  // No es un comando administrativo reconocido
  return false;
}

module.exports = {
  verifyWebhook,
  receiveWebhook
};
