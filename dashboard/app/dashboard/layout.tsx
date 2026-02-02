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

  useEffect(() => {
    checkUser()
    fetchPendingOrders()
    
    // Auto-refresh pedidos pendientes cada 30 segundos
    const interval = setInterval(() => {
      fetchPendingOrders()
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

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
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
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-orange-600">El Rinconcito</h1>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-gray-100 transition"
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

      {/* Backdrop */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center h-16 border-b border-gray-200">
            <h1 className="text-xl font-bold text-orange-600">El Rinconcito</h1>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition ${
                  pathname === item.href
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-gray-700 hover:bg-gray-50'
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

          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              <span className="mr-3 text-lg">🚪</span>
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64 pt-16 lg:pt-0">
        <div className="p-4 md:p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
