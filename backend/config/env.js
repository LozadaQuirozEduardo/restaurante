/**
 * Configuración de variables de entorno
 * Carga y valida todas las variables necesarias para el bot
 */

require('dotenv').config();

// Validar que existan las variables críticas
const requiredEnvVars = [
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_WHATSAPP_NUMBER',
  'SUPABASE_URL',
  'SUPABASE_KEY'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Variables de entorno faltantes:', missingVars.join(', '));
  console.error('Por favor configura el archivo .env correctamente');
  process.exit(1);
}

const config = {
  // Servidor
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Twilio WhatsApp
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER
  },
  
  // Número del restaurante/admin para notificaciones
  restaurant: {
    phone: process.env.RESTAURANT_PHONE || '+5215519060013'
  },
  
  // Supabase
  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY
  }
};

module.exports = config;
