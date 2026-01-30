# 🤖 WhatsApp Business Bot - Restaurante

Bot completo de WhatsApp Business usando Twilio API para gestionar pedidos de restaurante con base de datos Supabase.

## 📋 Tabla de Contenidos

- [Características](#características)
- [Stack Tecnológico](#stack-tecnológico)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Configuración Twilio WhatsApp](#configuración-twilio-whatsapp)
- [Configuración Variables de Entorno](#configuración-variables-de-entorno)
- [Uso Local](#uso-local)
- [Despliegue en Railway](#despliegue-en-railway)
- [Despliegue en Vercel](#despliegue-en-vercel)
- [API Endpoints](#api-endpoints)
- [Comandos del Bot](#comandos-del-bot)
- [Estructura de Conversación](#estructura-de-conversación)
- [Solución de Problemas](#solución-de-problemas)

## ✨ Características

- ✅ Recepción y envío de mensajes por WhatsApp
- ✅ Sistema de sesiones para mantener contexto de conversación
- ✅ Catálogo de productos desde Supabase
- ✅ Proceso completo de pedidos paso a paso
- ✅ Validación de webhooks de Meta
- ✅ API REST para gestión administrativa
- ✅ Logs detallados para debugging
- ✅ Rate limiting para seguridad
- ✅ Manejo robusto de errores

## 🛠 Stack Tecnológico

- **Backend:** Node.js + Express
- **Base de datos:** Supabase (PostgreSQL)
- **WhatsApp:** Twilio WhatsApp API
- **Hosting:** Railway / Vercel
- **Dependencias principales:**
  - `@supabase/supabase-js` - Cliente de Supabase
  - `twilio` - Cliente de Twilio
  - `express` - Framework web
  - `dotenv` - Variables de entorno

## 📁 Estructura del Proyecto

```
whatsapp-business-bot/
├── backend/
│   ├── server.js                 # Servidor Express principal
│   ├── config/
│   │   └── env.js               # Configuración de variables
│   ├── webhooks/
│   │   └── whatsapp.js          # Manejo de webhooks de Meta
│   ├── services/
│   │   ├── whatsappService.js   # Envío de mensajes
│   │   ├── messageHandler.js    # Lógica del bot
│   │   └── supabaseService.js   # Operaciones de BD
│   └── routes/
│       └── api.js               # Endpoints REST
├── .env.example                  # Plantilla de variables
├── .gitignore
├── package.json
├── Procfile                      # Para Railway
└── README.md
```

## 📋 Requisitos Previos

1. **Node.js 18+** instalado
2. **Cuenta Meta Business** (gratuita)
3. **Número de teléfono** para WhatsApp Business
4. **Cuenta Supabase** con base de datos configurada
5. **Git** (opcional para despliegue)

## 🚀 Instalación

### 1. Clonar o descargar el proyecto

```bash
cd whatsapp-business-bot
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia el archivo `.env.example` a `.env`:

```bash
cp .env.example .env
```

## 🔧 Configuración Twilio WhatsApp

### Paso 1: Crear Cuenta Twilio

1. Ve a [Twilio](https://www.twilio.com/try-twilio)
2. Regístrate con tu correo (obtienes $15 de crédito gratuito)
3. Verifica tu número de teléfono

### Paso 2: Activar WhatsApp Sandbox

1. En Twilio Console, ve a **Messaging** → **Try it out** → **Send a WhatsApp message**
2. Verás tu número de sandbox (ejemplo: +1 415 523 8886)
3. **Únete al sandbox:**
   - Desde tu WhatsApp, envía el código que te muestra (ejemplo: "join [palabra-clave]")
   - Recibirás confirmación "You are all set!"

### Paso 3: Obtener Credenciales

1. **Account SID y Auth Token:**
   - Ve a [Console Dashboard](https://console.twilio.com/)
   - Copia el "Account SID" (empieza con AC...)
   - Copia el "Auth Token" (click en "Show" para verlo)

2. **WhatsApp Number:**
   - En Messaging → Try it out → Send a WhatsApp message
   - Copia el número del sandbox (formato: +14155238886)

### Paso 4: Configurar Webhook

1. Ve a **Messaging** → **Settings** → **WhatsApp Sandbox Settings**
2. En "WHEN A MESSAGE COMES IN", ingresa tu webhook URL:
   - Local (con Cloudflare Tunnel): `https://tu-url.trycloudflare.com/webhook`
   - Railway: `https://tu-app.railway.app/webhook`
   - Vercel: `https://tu-app.vercel.app/webhook`
3. Método: **POST**
4. Click "Save"

### Paso 5: Producción (Opcional)

Para usar tu propio número de WhatsApp Business:

1. Ve a **Messaging** → **Senders** → **WhatsApp senders**
2. Click "New sender"
3. Sigue el proceso de verificación (1-2 días hábiles)
4. Una vez aprobado, actualiza `TWILIO_WHATSAPP_NUMBER` en tu `.env`

## ⚙️ Configuración Variables de Entorno

Edita tu archivo `.env`:

```env
# Puerto del servidor
PORT=3000

# Twilio WhatsApp API
TWILIO_ACCOUNT_SID=tu_account_sid_aqui
TWILIO_AUTH_TOKEN=tu_auth_token_aqui
TWILIO_WHATSAPP_NUMBER=+14155238886

# Supabase (ya configurado)
SUPABASE_URL=tu_supabase_url_aqui
SUPABASE_KEY=tu_supabase_anon_key_aqui

# Configuración adicional
NODE_ENV=production
```

### Obtener SUPABASE_KEY:

1. Ve a [Supabase Dashboard](https://app.supabase.com/)
2. Selecciona tu proyecto
3. Ve a Settings → API
4. Copia la "anon public" key

## 💻 Uso Local

### Opción 1: Usar ngrok (Recomendado para desarrollo)

1. **Instalar ngrok:**
   - Descarga desde [ngrok.com](https://ngrok.com/)
   - O instala con: `npm install -g ngrok`

2. **Iniciar servidor:**
   ```bash
   npm start
   ```

3. **En otra terminal, iniciar ngrok:**
   ```bash
   ngrok http 3000
   ```

4. **Configurar webhook en Meta:**
   - Copia la URL HTTPS de ngrok (ej: `https://abc123.ngrok.io`)
   - Úsala como Callback URL + `/webhook`
   - Ejemplo: `https://abc123.ngrok.io/webhook`

### Opción 2: Solo desarrollo sin webhooks

```bash
npm run dev
```

Esto inicia nodemon para recargar automáticamente. No recibirás mensajes de WhatsApp, pero puedes probar las APIs.

### Verificar que funciona:

1. **Navegador:** Abre `http://localhost:3000`
2. **API Health:** `http://localhost:3000/api/health`
3. **Webhook (solo si usas ngrok):** Envía "hola" desde WhatsApp

## 🚂 Despliegue en Railway

### Método 1: Desde GitHub

1. **Preparar repositorio:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin tu-repositorio.git
   git push -u origin main
   ```

2. **En Railway:**
   - Ve a [railway.app](https://railway.app/)
   - Click "New Project" → "Deploy from GitHub repo"
   - Selecciona tu repositorio
   - Railway detectará el `Procfile` automáticamente

3. **Configurar variables de entorno:**
   - En tu proyecto, ve a "Variables"
   - Agrega todas las variables del `.env`
   - **NO incluyas** `PORT` (Railway lo asigna automáticamente)

4. **Obtener URL:**
   - Ve a "Settings" → "Domains"
   - Click "Generate Domain"
   - Copia tu URL: `https://tu-app.up.railway.app`

5. **Actualizar webhook en Meta:**
   - Usa tu URL de Railway + `/webhook`
   - Ejemplo: `https://tu-app.up.railway.app/webhook`

### Método 2: Railway CLI

```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Login
railway login

# Inicializar proyecto
railway init

# Desplegar
railway up

# Agregar variables
railway variables set WHATSAPP_TOKEN=tu_token
railway variables set WHATSAPP_PHONE_NUMBER_ID=tu_id
# ... etc
```

## ▲ Despliegue en Vercel

⚠️ **Nota:** Vercel es serverless, por lo que las sesiones en memoria se perderán. Para producción en Vercel, considera usar Redis para sesiones.

### 1. Crear archivo `vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "backend/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "backend/server.js"
    }
  ]
}
```

### 2. Desplegar:

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Desplegar
vercel

# Agregar variables de entorno
vercel env add WHATSAPP_TOKEN
vercel env add WHATSAPP_PHONE_NUMBER_ID
# ... etc

# Desplegar a producción
vercel --prod
```

## 📡 API Endpoints

### GET /
Información del servicio
```bash
curl http://localhost:3000/
```

### GET /api/health
Estado del servicio
```bash
curl http://localhost:3000/api/health
```

### POST /api/send
Enviar mensaje manual
```bash
curl -X POST http://localhost:3000/api/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "521234567890",
    "message": "Hola desde la API!"
  }'
```

### GET /api/orders
Obtener pedidos
```bash
# Todos los pedidos
curl http://localhost:3000/api/orders

# De un cliente específico
curl http://localhost:3000/api/orders?cliente_id=123

# Limitar resultados
curl http://localhost:3000/api/orders?limite=10
```

### PATCH /api/orders/:id/status
Actualizar estado de pedido
```bash
curl -X PATCH http://localhost:3000/api/orders/1/status \
  -H "Content-Type: application/json" \
  -d '{"estado": "preparando"}'
```

Estados válidos:
- `pendiente`
- `preparando`
- `en_camino`
- `entregado`
- `cancelado`

### GET /api/products
Obtener productos
```bash
# Todos los productos
curl http://localhost:3000/api/products

# Por categoría
curl http://localhost:3000/api/products?categoria_id=1
```

### GET /api/categories
Obtener categorías
```bash
curl http://localhost:3000/api/categories
```

### DELETE /api/sessions/:phone
Limpiar sesión de usuario
```bash
curl -X DELETE http://localhost:3000/api/sessions/521234567890
```

## 💬 Comandos del Bot

### Comandos Globales (funcionan en cualquier momento):

| Comando | Descripción |
|---------|-------------|
| `hola` | Mostrar menú principal |
| `inicio` | Volver al inicio |
| `menu` / `menú` | Ver productos disponibles |
| `cancelar` | Cancelar operación actual |
| `salir` | Salir del flujo actual |

### Opciones del Menú Principal:

| Opción | Descripción |
|--------|-------------|
| `menú` | Ver catálogo de productos |
| `pedir` | Iniciar un pedido |
| `contacto` | Ver información de contacto |
| `ayuda` | Ver lista de comandos |

## 📱 Estructura de Conversación

### Flujo de Ver Menú:
```
Usuario: "menú"
  → Bot: Muestra categorías
Usuario: "1" (selecciona categoría)
  → Bot: Muestra productos de esa categoría
Usuario: "todo"
  → Bot: Muestra todos los productos
```

### Flujo de Pedido Completo:
```
Usuario: "pedir"
  → Bot: Muestra lista de productos numerados

Usuario: "3" (selecciona producto)
  → Bot: "¿Cuántas unidades?"

Usuario: "2"
  → Bot: "¿Agregar más productos? (si/no)"

Usuario: "no"
  → Bot: "Dime tu nombre completo"

Usuario: "Juan Pérez"
  → Bot: "Dime tu dirección de entrega"

Usuario: "Calle 123, Colonia Centro"
  → Bot: "¿Notas adicionales? (o escribe 'no')"

Usuario: "Sin cebolla"
  → Bot: Muestra resumen del pedido
       "¿Confirmar? (si/no)"

Usuario: "si"
  → Bot: "✅ Pedido #123 confirmado!"
       Guarda en Supabase
```

## 🐛 Solución de Problemas

### El bot no responde:

1. **Verificar webhook:**
   ```bash
   # Ver logs del servidor
   npm start
   ```
   Deberías ver: `📨 Webhook recibido`

2. **Verificar configuración Meta:**
   - Ve a WhatsApp → Configuration → Webhook
   - El estado debe ser ✅ verde
   - Si está ❌ rojo, verifica el Verify Token

3. **Verificar número registrado:**
   - En Meta → WhatsApp → API Setup
   - Tu número debe estar en la lista "To"

### Error "Webhook verification failed":

- El `WEBHOOK_VERIFY_TOKEN` en `.env` debe coincidir exactamente con el ingresado en Meta
- Reinicia el servidor después de cambiar `.env`

### Error "Invalid access token":

- El token expiró (si usas el temporal)
- Genera un token permanente (ver paso 3 de configuración Meta)
- Actualiza `WHATSAPP_TOKEN` en `.env` o en Railway/Vercel

### Error al conectar con Supabase:

1. **Verificar credenciales:**
   ```bash
   # En tu .env
   SUPABASE_URL=https://tuproyecto.supabase.co
   SUPABASE_KEY=eyJhbG...
   ```

2. **Verificar tablas:**
   - Abre Supabase Dashboard
   - Confirma que existan las tablas:
     - `categorias`
     - `productos`
     - `clientes`
     - `pedidos`
     - `pedido_detalles`

3. **Verificar permisos:**
   - En Supabase → Authentication → Policies
   - Asegúrate de tener políticas configuradas

### Sesiones se pierden en Vercel:

Vercel es serverless y reinicia entre peticiones. Soluciones:

1. **Opción A:** Usar Redis para sesiones
2. **Opción B:** Guardar sesiones en Supabase
3. **Opción C:** Usar Railway en lugar de Vercel

### Ver logs en Railway:

```bash
# Desde la web
railway.app → tu proyecto → Deployments → View Logs

# Desde CLI
railway logs
```

## 🔐 Seguridad

### Recomendaciones:

1. **Nunca subas `.env` a GitHub**
   - Está en `.gitignore` por defecto

2. **Rotar tokens regularmente**
   - Genera nuevos Access Tokens cada 3-6 meses

3. **Rate limiting**
   - Ya configurado: 100 req/15min por IP

4. **Validar entrada de usuario**
   - El bot valida números y opciones automáticamente

5. **HTTPS siempre**
   - Railway y Vercel usan HTTPS por defecto
   - Ngrok versión gratuita también

## 📊 Monitoreo

### Logs importantes:

```bash
✅ Mensaje enviado a 521234567890
📱 Mensaje de 521234567890: "hola" (Paso: menu_principal)
✅ Pedido #123 creado exitosamente para Juan Pérez
❌ Error al procesar mensaje: [detalle]
```

### Métricas sugeridas (implementar):

- Número de mensajes recibidos/día
- Pedidos completados vs abandonados
- Tiempo promedio de conversación
- Productos más pedidos

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -m 'Agregar nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Abre un Pull Request

## 📄 Licencia

MIT License - Libre para usar y modificar

## 🆘 Soporte

### Recursos oficiales:

- [WhatsApp Business API Docs](https://developers.facebook.com/docs/whatsapp)
- [Supabase Docs](https://supabase.com/docs)
- [Express Docs](https://expressjs.com/)
- [Railway Docs](https://docs.railway.app/)

### Contacto:

- Abre un Issue en GitHub
- Revisa la [sección de problemas comunes](#solución-de-problemas)

## 🎉 Próximas Características

- [ ] Mensajes multimedia (imágenes, PDFs)
- [ ] Integración con pasarelas de pago
- [ ] Panel administrativo web
- [ ] Notificaciones de estado de pedido
- [ ] Multi-idioma
- [ ] Analytics y reportes
- [ ] Integración con sistemas de delivery

---

**¡Listo para recibir pedidos! 🍽️📱**

Si tienes preguntas, revisa la documentación o abre un issue.
