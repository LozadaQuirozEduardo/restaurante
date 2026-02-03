'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [pendingOrders, setPendingOrders] = useState(0)
  const [isOnline, setIsOnline] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)

  useEffect(() => {
    // Cargar preferencia de modo oscuro
    const savedDarkMode = localStorage.getItem('darkMode') === 'true'
    setDarkMode(savedDarkMode)
    if (savedDarkMode) {
      document.documentElement.classList.add('dark')
    }
    
    checkUser()
    fetchPendingOrders()
    checkConnection()
    
    // Auto-refresh pedidos pendientes cada 30 segundos
    const interval = setInterval(() => {
      fetchPendingOrders()
      checkConnection()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      router.push('/login')
    } else {
      setLoading(false)
    }
  }

  async function fetchPendingOrders() {
    const { count } = await supabase
      .from('pedidos')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'pendiente')
    
    setPendingOrders(count || 0)
  }

  async function checkConnection() {
    try {
      const { error } = await supabase.from('pedidos').select('count', { count: 'exact', head: true }).limit(1)
      setIsOnline(!error)
    } catch {
      setIsOnline(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  function toggleDarkMode() {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    localStorage.setItem('darkMode', String(newDarkMode))
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  async function handleSearch(term: string) {
    setSearchTerm(term)
    
    if (term.length < 2) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    try {
      const results: any[] = []

      // Buscar pedidos por ID o nombre de cliente
      const { data: pedidos } = await supabase
        .from('pedidos')
        .select('id, nombre_cliente, total, estado, created_at')
        .or(`id.eq.${parseInt(term) || 0},nombre_cliente.ilike.%${term}%`)
        .limit(5)

      if (pedidos) {
        pedidos.forEach(p => results.push({ type: 'pedido', data: p }))
      }

      // Buscar productos
      const { data: productos } = await supabase
        .from('productos')
        .select('id, nombre, precio, disponible')
        .ilike('nombre', `%${term}%`)
        .limit(5)

      if (productos) {
        productos.forEach(p => results.push({ type: 'producto', data: p }))
      }

      // Buscar clientes por teléfono o nombre
      const { data: clientes } = await supabase
        .from('pedidos')
        .select('nombre_cliente, telefono')
        .or(`nombre_cliente.ilike.%${term}%,telefono.ilike.%${term}%`)
        .limit(5)

      if (clientes) {
        // Eliminar duplicados
        const uniqueClients = Array.from(new Map(clientes.map(c => [c.telefono, c])).values())
        uniqueClients.forEach(c => results.push({ type: 'cliente', data: c }))
      }

      setSearchResults(results)
      setShowSearchResults(results.length > 0)
    } catch (error) {
      console.error('Error en búsqueda:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊', badge: null },
    { name: 'Pedidos', href: '/dashboard/pedidos', icon: '📦', badge: pendingOrders > 0 ? pendingOrders : null },
    { name: 'Productos', href: '/dashboard/productos', icon: '🍽️', badge: null },
    { name: 'Clientes', href: '/dashboard/clientes', icon: '👥', badge: null },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-orange-600 dark:text-orange-400">El Rinconcito</h1>
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
            <span className="text-xs text-gray-500 dark:text-gray-400">{isOnline ? 'En línea' : 'Desconectado'}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            title={darkMode ? 'Modo Claro' : 'Modo Oscuro'}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {sidebarOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Backdrop */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-50 transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-4 h-16 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-xl font-bold text-orange-600 dark:text-orange-400">El Rinconcito</h1>
            <div className="hidden lg:flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
              <span className="text-xs text-gray-500 dark:text-gray-400">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition ${
                  pathname === item.href
                    ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center">
                  <span className="mr-3 text-lg">{item.icon}</span>
                  {item.name}
                </div>
                {item.badge && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
            <button
              onClick={toggleDarkMode}
              className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition"
            >
              <span className="mr-3 text-lg">{darkMode ? '☀️' : '🌙'}</span>
              {darkMode ? 'Modo Claro' : 'Modo Oscuro'}
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
            >
              <span className="mr-3 text-lg">🚪</span>
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64 pt-16 lg:pt-0">
        {/* Barra de búsqueda global */}
        <div className="sticky top-16 lg:top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 md:px-8 py-4">
          <div className="relative max-w-2xl">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
                placeholder="Buscar pedidos, productos, clientes..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            {/* Resultados de búsqueda */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 max-h-96 overflow-y-auto z-50">
                {searchResults.map((result, index) => (
                  <div key={index} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-600 border-b border-gray-100 dark:border-gray-600 last:border-b-0">
                    {result.type === 'pedido' && (
                      <Link
                        href={`/dashboard/pedidos`}
                        onClick={() => { setShowSearchResults(false); setSearchTerm('') }}
                        className="block"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">📦</span>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">Pedido #{result.data.id}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{result.data.nombre_cliente} - ${result.data.total} MXN</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              result.data.estado === 'completado' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                              result.data.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                              'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                            }`}>
                              {result.data.estado}
                            </span>
                          </div>
                        </div>
                      </Link>
                    )}
                    {result.type === 'producto' && (
                      <Link
                        href={`/dashboard/productos`}
                        onClick={() => { setShowSearchResults(false); setSearchTerm('') }}
                        className="block"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🍽️</span>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{result.data.nombre}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">${result.data.precio} MXN</p>
                          </div>
                        </div>
                      </Link>
                    )}
                    {result.type === 'cliente' && (
                      <Link
                        href={`/dashboard/clientes`}
                        onClick={() => { setShowSearchResults(false); setSearchTerm('') }}
                        className="block"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">👤</span>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{result.data.nombre_cliente}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{result.data.telefono}</p>
                          </div>
                        </div>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="p-4 md:p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
