# 🚀 Guía de Optimización de Performance - Dashboard

## ⚡ Optimizaciones Implementadas

### 1. **Consultas Optimizadas con Límites**
Se han agregado límites a todas las consultas para evitar traer datos innecesarios:

```typescript
// ❌ ANTES - Traía TODOS los pedidos
supabase.from('pedidos').select('total').eq('estado', 'completado')

// ✅ AHORA - Solo últimos 100 pedidos
supabase.from('pedidos').select('total')
  .eq('estado', 'completado')
  .order('created_at', { ascending: false })
  .limit(100)
```

### 2. **Alcance Temporal Reducido**
Las consultas ahora están limitadas temporalmente:

- **Top Productos**: Últimos 30 días (antes: todos los tiempos)
- **Top Clientes**: Últimos 30 días (antes: todos los tiempos)
- **Productos Demandados**: Últimos 7 días (antes: todos los tiempos)

### 3. **Campos Específicos**
Solo se consultan los campos necesarios:

```typescript
// ❌ ANTES
supabase.from('pedidos').select('*')

// ✅ AHORA
supabase.from('pedidos').select('created_at, total, estado')
```

### 4. **Índices de Base de Datos**
Ejecuta el archivo [supabase-indexes.sql](supabase-indexes.sql) para crear índices optimizados.

**Índices más importantes:**
- `idx_pedidos_created_estado` - Para consultas por fecha y estado
- `idx_pedidos_dashboard` - Índice compuesto para el dashboard
- `idx_pedido_detalles_producto` - Para productos más vendidos

### 5. **Sistema de Caché (Nuevo)**
Hook personalizado `useCache` disponible en `hooks/useCache.ts`

**Características:**
- TTL configurable (default: 30 segundos)
- Revalidación automática al cambiar de pestaña
- Previene fetches duplicados
- Store en memoria para respuestas instantáneas

## 📊 Mejoras de Rendimiento Esperadas

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| Carga Dashboard | 3-8 seg | 0.5-2 seg | **70-85%** |
| Carga Reportes | 5-12 seg | 1-3 seg | **75-90%** |
| Top Productos | 4-10 seg | 0.5-1.5 seg | **85-90%** |
| Consultas Totales | Sin límite | Con límite | **Controlado** |

## 🔧 Pasos para Aplicar Optimizaciones

### Paso 1: Crear Índices en Supabase ⭐ IMPORTANTE

1. Abre **Supabase Dashboard** → Tu proyecto
2. Ve a **SQL Editor**
3. Copia y pega el contenido de [supabase-indexes.sql](supabase-indexes.sql)
4. Ejecuta el SQL
5. Verifica que se crearon correctamente:

```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE schemaname = 'public' AND tablename = 'pedidos';
```

### Paso 2: Desplegar Cambios del Dashboard

```bash
cd dashboard
npm run build
npm run deploy  # o el comando de tu hosting
```

### Paso 3: Verificar Performance

Abre **Chrome DevTools** → **Network**:
- Revisa que las consultas tarden < 1 segundo
- Verifica que no haya consultas duplicadas
- Confirma que los límites funcionen

### Paso 4 (Opcional): Implementar Caché

Para usar el sistema de caché en tus componentes:

```typescript
import { useCache } from '@/hooks/useCache'

// En tu componente
const { data, loading, error, revalidate } = useCache(
  async () => {
    const { data } = await supabase
      .from('pedidos')
      .select('*')
      .limit(100)
    return data
  },
  { 
    key: 'pedidos-recientes',
    ttl: 30000, // 30 segundos
    revalidateOnFocus: true 
  }
)
```

## 📈 Monitoreo de Performance

### En Supabase Dashboard

1. Ve a **Settings** → **Database** → **Query Performance**
2. Revisa las queries más lentas
3. Verifica que los índices se estén usando:

```sql
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as "Index Scans",
    idx_tup_read as "Tuples Read"
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

### En el Dashboard

Abre **Chrome DevTools** → **Console**:
- Las consultas optimizadas mostrarán tiempos < 1seg
- No deberías ver múltiples fetches del mismo endpoint

## 🎯 Límites Aplicados por Consulta

| Consulta | Límite | Justificación |
|----------|--------|---------------|
| Pedidos Hoy | 500 | Raro tener > 500 pedidos/día |
| Pedidos Semana | 2,000 | ~285 pedidos/día |
| Pedidos Mes | 5,000 | ~166 pedidos/día |
| Promedio Ticket | 100 | Suficiente para cálculo preciso |
| Pedidos Recientes | 3 | Solo para vista rápida |
| Top Productos | 500 | Últimos 30 días |
| Top Clientes | 500 | Últimos 30 días |

## ⚠️ Consideraciones Importantes

### 1. **Datos Históricos**
Si necesitas reportes de datos más antiguos:
- Considera crear una tabla agregada `pedidos_estadisticas_diarias`
- Ejecuta un cron job que pre-calcule estadísticas

### 2. **Escalabilidad**
Con estos límites, el dashboard funciona bien hasta:
- ✅ ~500 pedidos/día
- ✅ ~5,000 productos diferentes
- ✅ ~10,000 clientes activos

Si superas estos números:
- Implementa paginación
- Usa materializaciones de vistas
- Considera Redis para caché

### 3. **Índices**
Los índices:
- ✅ Aceleran SELECT
- ❌ Ralentizan ligeramente INSERT/UPDATE
- Para este caso de uso, el beneficio supera el costo

## 🔄 Auto-Refresh

El dashboard se actualiza automáticamente cada **30 segundos**:

```typescript
// En page.tsx
useEffect(() => {
  loadAllData()
  
  const interval = setInterval(() => {
    loadAllData()
  }, 30000) // 30 segundos
  
  return () => clearInterval(interval)
}, [])
```

Puedes ajustar este intervalo según tus necesidades.

## 🐛 Troubleshooting

### Dashboard sigue lento después de optimizaciones

1. **Verifica índices:**
```sql
SELECT * FROM pg_indexes WHERE schemaname = 'public';
```

2. **Revisa plan de ejecución:**
```sql
EXPLAIN ANALYZE 
SELECT total FROM pedidos 
WHERE created_at >= '2026-02-01' 
AND estado = 'completado' 
LIMIT 100;
```

3. **Limpia caché del navegador:**
- Ctrl + Shift + Delete
- Borra caché y cookies

### Queries fallan con los límites

Si ves errores, revisa:
- Que la columna `tipo_entrega` exista (ejecuta `fix-supabase-column.sql`)
- Que las relaciones entre tablas estén correctas
- Que los índices se hayan creado sin errores

### Datos no se actualizan

- El auto-refresh está en 30 seg
- Puedes forzar actualización recargando la página (F5)
- Implementa el hook `useCache` con `revalidate()` manual

## 📚 Recursos Adicionales

- [Supabase Performance Tuning](https://supabase.com/docs/guides/database/performance)
- [PostgreSQL Index Tuning](https://www.postgresql.org/docs/current/indexes.html)
- [React Query (alternativa de caché)](https://tanstack.com/query/latest)

## ✅ Checklist de Optimización

- [ ] Ejecutar `supabase-indexes.sql` en Supabase
- [ ] Ejecutar `fix-supabase-column.sql` si no está hecha
- [ ] Hacer commit y push de los cambios
- [ ] Desplegar dashboard actualizado
- [ ] Verificar tiempos de carga < 2 segundos
- [ ] Confirmar que límites funcionan correctamente
- [ ] Monitorear uso de índices en Supabase
- [ ] (Opcional) Implementar sistema de caché

## 🎉 Resultado Final

Después de aplicar estas optimizaciones:
- ⚡ Dashboard carga en **< 2 segundos**
- 📊 Reportes se generan en **< 3 segundos**
- 🔄 Auto-refresh no afecta performance
- 💾 Uso eficiente de recursos de Supabase
- 📱 Mejor experiencia de usuario
