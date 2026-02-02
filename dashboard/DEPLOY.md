# 🚀 Guía de Deployment a Netlify

## Pasos para subir el Dashboard a producción en Netlify

### 1️⃣ Preparar el proyecto

Ya hicimos el commit y push a GitHub. El código está listo en: 
`https://github.com/tachinloaa/whatsapp`

### 2️⃣ Crear usuario administrador en Supabase

1. Ve a tu proyecto Supabase: https://supabase.com/dashboard
2. Navega a **Authentication** → **Users**
3. Haz clic en **Add user** → **Create new user**
4. Ingresa:
   - Email: `admin@elrinconcito.com` (o el que prefieras)
   - Password: `tu-contraseña-segura`
5. Confirma el usuario automáticamente (marca la opción si está disponible)

### 3️⃣ Conectar proyecto a Netlify

#### Opción A: Desde el sitio web de Netlify

1. Ve a https://netlify.com y haz login
2. Haz clic en **Add new site** → **Import an existing project**
3. Selecciona **GitHub** y autoriza el acceso
4. Busca y selecciona el repositorio: `tachinloaa/whatsapp`
5. Configura el build:
   ```
   Base directory: dashboard
   Build command: npm run build
   Publish directory: dashboard/out
   ```

#### Opción B: Usando Netlify CLI (Recomendado para mayor control)

```bash
# 1. Instalar Netlify CLI globalmente
npm install -g netlify-cli

# 2. Navegar al directorio del dashboard
cd dashboard

# 3. Login en Netlify
netlify login

# 4. Inicializar el proyecto
netlify init

# Selecciona:
# - Create & configure a new site
# - Tu team/cuenta
# - Site name: el-rinconcito-dashboard (o el que prefieras)
# - Build command: npm run build
# - Directory to deploy: out

# 5. Configurar variables de entorno
netlify env:set NEXT_PUBLIC_SUPABASE_URL "https://anzeikjpudoimvwpwlac.supabase.co"
netlify env:set NEXT_PUBLIC_SUPABASE_ANON_KEY "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuemVpa2pwdWRvaW12d3B3bGFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NzY1NDIsImV4cCI6MjA4NTE1MjU0Mn0.bUaFisBUMcZ3GZN9ohzwf3iMc0Aka7D_lrpxV3RTjiw"

# 6. Deploy
netlify deploy --prod
```

### 4️⃣ Configurar variables de entorno en Netlify (Opción A)

Si usaste la Opción A, necesitas configurar las variables de entorno manualmente:

1. En tu sitio de Netlify, ve a **Site configuration** → **Environment variables**
2. Agrega las siguientes variables:

```
NEXT_PUBLIC_SUPABASE_URL = https://anzeikjpudoimvwpwlac.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuemVpa2pwdWRvaW12d3B3bGFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NzY1NDIsImV4cCI6MjA4NTE1MjU0Mn0.bUaFisBUMcZ3GZN9ohzwf3iMc0Aka7D_lrpxV3RTjiw
```

3. Guarda los cambios

### 5️⃣ Hacer deploy manual (Opción A)

1. Ve a **Deploys** en el panel de Netlify
2. Haz clic en **Trigger deploy** → **Deploy site**
3. Espera a que termine el build (2-3 minutos)

### 6️⃣ Verificar el deployment

Una vez completado, tu dashboard estará disponible en:
```
https://nombre-de-tu-sitio.netlify.app
```

O puedes configurar un dominio personalizado en:
**Site configuration** → **Domain management** → **Add custom domain**

### 7️⃣ Probar el dashboard

1. Ve a tu URL de Netlify
2. Inicia sesión con las credenciales del usuario admin que creaste
3. Verifica que puedas ver:
   - Estadísticas de ventas en el Dashboard principal
   - Lista de pedidos en la sección Pedidos
   - Productos con posibilidad de editar en Productos
   - Clientes con sus estadísticas en Clientes

## 🔧 Solución de problemas comunes

### Build falla con error de dependencias
```bash
# Localmente, prueba el build
cd dashboard
npm run build

# Si funciona, asegúrate de que las variables de entorno estén configuradas en Netlify
```

### Error "Invalid Supabase URL"
- Verifica que las variables de entorno estén bien escritas en Netlify
- Asegúrate de que NO tengan espacios al inicio o final
- Redeploy después de cambiar las variables

### No puedo iniciar sesión
- Verifica que hayas creado el usuario en Supabase Authentication
- Confirma que el email y contraseña sean correctos
- Revisa la consola del navegador (F12) para ver errores específicos

### Los pedidos no se muestran
- Verifica que tu Supabase tenga pedidos en la tabla `pedidos`
- Confirma que las variables de entorno estén correctas
- Revisa que el usuario tenga permisos de lectura en las tablas

## 📱 Acceso desde celular

Una vez desplegado, puedes acceder al dashboard desde tu celular:
1. Abre el navegador en tu teléfono
2. Ve a tu URL de Netlify
3. Inicia sesión
4. Agrega un acceso directo a la pantalla de inicio para acceso rápido

## 🔄 Actualizaciones futuras

Cada vez que hagas cambios en el código y hagas push a GitHub:
1. Netlify detectará automáticamente los cambios
2. Hará un nuevo build automáticamente
3. Desplegará la nueva versión

O puedes configurar deployments manuales si prefieres control total.

## ✅ URLs importantes

- **Dashboard en Netlify**: Pendiente (se generará después del deploy)
- **Bot WhatsApp**: https://web-production-82196.up.railway.app
- **Supabase**: https://anzeikjpudoimvwpwlac.supabase.co
- **Repositorio GitHub**: https://github.com/tachinloaa/whatsapp

## 🎯 Resumen rápido

```bash
# En una terminal, ejecuta:
cd dashboard
netlify login
netlify init
netlify env:set NEXT_PUBLIC_SUPABASE_URL "https://anzeikjpudoimvwpwlac.supabase.co"
netlify env:set NEXT_PUBLIC_SUPABASE_ANON_KEY "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuemVpa2pwdWRvaW12d3B3bGFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NzY1NDIsImV4cCI6MjA4NTE1MjU0Mn0.bUaFisBUMcZ3GZN9ohzwf3iMc0Aka7D_lrpxV3RTjiw"
netlify deploy --prod
```

¡Y listo! Tu dashboard estará en producción. 🎉
