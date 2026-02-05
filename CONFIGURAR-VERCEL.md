# CONFIGURACIÓN DE VARIABLES DE ENTORNO EN VERCEL

## Pasos para configurar en Vercel:

1. Ve a https://vercel.com/tu-proyecto
2. Click en "Settings"
3. Click en "Environment Variables" en el menú lateral
4. Agrega estas DOS variables:

### Variable 1:
**Name:** `NEXT_PUBLIC_SUPABASE_URL`
**Value:** `https://anzeikjpudoimvwpwlac.supabase.co`
**Environments:** Marcar Production, Preview y Development

### Variable 2:
**Name:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
**Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuemVpa2pwdWRvaW12d3B3bGFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NzY1NDIsImV4cCI6MjA4NTE1MjU0Mn0.bUaFisBUMcZ3GZN9ohzwf3iMc0Aka7D_lrpxV3RTjiw`
**Environments:** Marcar Production, Preview y Development

## IMPORTANTE:
- Los nombres DEBEN tener el prefijo `NEXT_PUBLIC_`
- Después de agregar las variables, haz click en "Redeploy" en el deployment más reciente

## Verificación:
Si configuraste correctamente, la página debería mostrar los productos.
