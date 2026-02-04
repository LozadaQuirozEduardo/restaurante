/**
 * Hook personalizado para caché de datos con revalidación
 * Reduce llamadas innecesarias a Supabase y mejora performance
 */

import { useState, useEffect, useRef } from 'react'

interface CacheOptions {
  key: string
  ttl?: number // Time to live en milisegundos (default: 30 segundos)
  revalidateOnFocus?: boolean
}

interface CacheData<T> {
  data: T | null
  timestamp: number
}

// Store de caché en memoria
const cacheStore = new Map<string, CacheData<any>>()

export function useCache<T>(
  fetchFn: () => Promise<T>,
  options: CacheOptions
) {
  const { key, ttl = 30000, revalidateOnFocus = true } = options
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const fetchingRef = useRef(false)

  const fetchData = async (force = false) => {
    // Evitar fetches duplicados
    if (fetchingRef.current && !force) return

    // Verificar caché si no es forzado
    if (!force) {
      const cached = cacheStore.get(key)
      if (cached && Date.now() - cached.timestamp < ttl) {
        setData(cached.data)
        setLoading(false)
        return
      }
    }

    try {
      fetchingRef.current = true
      setLoading(true)
      const result = await fetchFn()
      
      // Guardar en caché
      cacheStore.set(key, {
        data: result,
        timestamp: Date.now()
      })
      
      setData(result)
      setError(null)
    } catch (err) {
      setError(err as Error)
      console.error(`Error fetching ${key}:`, err)
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }

  useEffect(() => {
    fetchData()

    // Revalidar cuando la ventana recupera el foco
    const handleFocus = () => {
      if (revalidateOnFocus) {
        fetchData()
      }
    }

    if (revalidateOnFocus) {
      window.addEventListener('focus', handleFocus)
      return () => window.removeEventListener('focus', handleFocus)
    }
  }, [key])

  const revalidate = () => fetchData(true)
  const clearCache = () => cacheStore.delete(key)

  return { data, loading, error, revalidate, clearCache }
}

/**
 * Hook para invalidar caché de múltiples keys
 */
export function useCacheCleaner() {
  const clearAll = () => cacheStore.clear()
  
  const clearByPattern = (pattern: string) => {
    const keys = Array.from(cacheStore.keys())
    keys.forEach(key => {
      if (key.includes(pattern)) {
        cacheStore.delete(key)
      }
    })
  }

  return { clearAll, clearByPattern }
}

/**
 * Limpiar caché manualmente
 */
export const clearCache = (key: string) => cacheStore.delete(key)
export const clearAllCache = () => cacheStore.clear()
