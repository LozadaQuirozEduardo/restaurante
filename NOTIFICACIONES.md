# 📱 Configuración de Notificaciones al Restaurante

## ⚠️ Problema: No llegan notificaciones al WhatsApp del restaurante

Si los clientes completan pedidos pero tú no recibes notificaciones en tu WhatsApp, sigue esta guía.

---

## 🔍 Diagnóstico del Problema

### 1. **Twilio Sandbox Mode**
El problema más común es que estás usando Twilio en **modo Sandbox**, que solo permite enviar mensajes a números que han enviado un mensaje de activación.

#### ✅ Solución:
Debes unir tu número de restaurante (5519060013) al sandbox de Twilio:

1. Desde tu WhatsApp personal (5519060013), envía un mensaje a:
   ```
   whatsapp:+14155238886
   ```

2. Envía el código de activación:
   ```
   join [tu-codigo-sandbox]
   ```
   
3. El código lo encuentras en:
   - Twilio Console → Messaging → Try it out → Send a WhatsApp message

#### Ejemplo:
```
join happy-dog
```

---

### 2. **Verificar Formato del Número**

El número debe estar en formato internacional correcto:
- ✅ Correcto: `+5215519060013`
- ❌ Incorrecto: `5519060013`
- ❌ Incorrecto: `+525519060013`

El código usa: `+5215519060013`

---

### 3. **Configurar Variable de Entorno (Opcional)**

Puedes configurar el número del restaurante como variable de entorno:

**En tu archivo `.env`:**
```env
RESTAURANT_PHONE=+5215519060013
```

Si no configuras esta variable, usa el valor por defecto.

---

## 🔧 Cómo Verificar si Funciona

### Prueba Manual:

1. **Ver los logs del servidor:**
   ```bash
   # Busca estas líneas en los logs
   📤 Enviando notificación del pedido #X a +5215519060013
   ✅ Notificación enviada exitosamente al restaurante
   ```

2. **Si ves errores:**
   ```bash
   ❌ Error al enviar notificación al restaurante: [Error details]
   ```
   
   Los errores comunes son:
   - `21606` - Número no verificado en sandbox
   - `21408` - Número no registrado en WhatsApp
   - `21211` - Número inválido

---

## 🚀 Soluciones por Tipo de Error

### Error 21606: "The number is not verified"
**Causa:** Tu número (5519060013) no está en el sandbox de Twilio.

**Solución:**
1. Envía `join [codigo]` desde tu WhatsApp al número de Twilio
2. Espera confirmación
3. Prueba hacer un pedido de nuevo

---

### Error 21408: "Number not registered"
**Causa:** El número no tiene WhatsApp activo.

**Solución:**
1. Verifica que 5519060013 tenga WhatsApp instalado
2. Confirma que el número esté activo

---

### Error 21211: "Invalid phone number"
**Causa:** Formato incorrecto del número.

**Solución:**
El formato debe ser: `+[código país][código área][número]`
- México: `+52` + `1` (para móviles) + número
- Ejemplo: `+5215519060013`

---

## 📝 Configuración Recomendada

### Opción 1: Usar Twilio Production (RECOMENDADO)
Para evitar el sandbox:

1. **Upgrade a cuenta de pago en Twilio**
   - Agrega método de pago
   - Costo: ~$1-2 USD por 1000 mensajes

2. **Solicita un número de WhatsApp propio**
   - Twilio Console → Phone Numbers → Buy a number
   - Activa WhatsApp para ese número
   - Costo: ~$1-2 USD/mes

3. **Ventajas:**
   - ✅ Envía a cualquier número sin activación
   - ✅ Número propio del restaurante
   - ✅ Sin límites de mensajes
   - ✅ Más profesional

---

### Opción 2: Usar Sandbox (GRATIS pero limitado)
Si quieres seguir usando sandbox:

**Requisitos:**
- Todos los números (clientes + restaurante) deben activarse con `join codigo`
- Límite de 50 números
- Solo para pruebas

---

## 🧪 Prueba Rápida

Ejecuta este test para verificar que todo funciona:

```bash
# Desde la terminal del servidor
node test-notification.js
```

Si ves este error y necesitas el archivo de test, puedo crearlo.

---

## 📊 Monitoreo de Notificaciones

Los logs del servidor mostrarán:

```
✅ Pedido #123 creado exitosamente para Juan Pérez
📤 Enviando notificación del pedido #123 a +5215519060013
✅ Notificación enviada exitosamente al restaurante
```

Si no ves el segundo mensaje, la notificación no se envió.

---

## 🆘 Checklist de Solución

- [ ] Mi número (5519060013) tiene WhatsApp instalado
- [ ] Envié `join [codigo]` al número de Twilio desde mi WhatsApp
- [ ] Recibí mensaje de confirmación del sandbox
- [ ] El formato del número es `+5215519060013`
- [ ] Los logs muestran "Notificación enviada exitosamente"
- [ ] No hay errores en los logs del servidor

---

## 💡 Tip Pro

Para producción, considera:

1. **Twilio Production** ($1-2/mes)
2. **Número verificado de WhatsApp Business API**
3. **Webhook de confirmación de entrega**
4. **Reintentos automáticos si falla**

---

## 🔄 Cambios Aplicados en el Código

Se agregaron mejoras:

1. ✅ Logging detallado de notificaciones
2. ✅ Manejo de errores sin afectar al cliente
3. ✅ Variable de entorno configurable
4. ✅ Formato correcto del número

---

## 📞 Necesitas Ayuda?

Si después de estos pasos no funciona:

1. Revisa los logs del servidor
2. Copia el error exacto
3. Verifica en Twilio Console → Monitor → Logs → Errors

El error te dirá exactamente qué está fallando.
