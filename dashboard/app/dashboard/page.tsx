'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format, startOfDay, startOfWeek, startOfMonth, subDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

interface Stats {
  today: number
  week: number
  month: number
  totalOrders: number
  pendingOrders: number
  averageTicket: number
}

interface DailySale {
  date: string
  total: number
}

interface ProductSale {
  name: string
  count: number
}

interface RecentOrder {
  id: number
  created_at: string
  nombre_cliente: string
  total: number
  estado: string
}

interface TopClient {
  nombre: string
  telefono: string
  pedidos: number
  total: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    today: 0,
    week: 0,
    month: 0,
    totalOrders: 0,
    pendingOrders: 0,
    averageTicket: 0,
  })
  const [dailySales, setDailySales] = useState<DailySale[]>([])
  const [topProducts, setTopProducts] = useState<ProductSale[]>([])
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [topClients, setTopClients] = useState<TopClient[]>([])
  const [previousPendingCount, setPreviousPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // Función para reproducir sonido de notificación
  const playNotificationSound = () => {
    if (typeof window !== 'undefined') {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 800
      oscillator.type = 'sine'
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
    }
  }

  useEffect(() => {
    fetchStats()
    fetchDailySales()
    fetchTopProducts()
    fetchRecentOrders()
    fetchTopClients()
    
    // Auto-refresh cada 30 segundos
    const interval = setInterval(() => {
      fetchStats()
      fetchDailySales()
      fetchTopProducts()
      fetchRecentOrders()
      fetchTopClients()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  async function fetchStats() {
    try {
      const now = new Date()
      const todayStart = startOfDay(now).toISOString()
      const weekStart = startOfWeek(now, { locale: es }).toISOString()
      const monthStart = startOfMonth(now).toISOString()

      // Ventas de hoy
      const { data: todayOrders } = await supabase
        .from('pedidos')
        .select('total')
        .gte('created_at', todayStart)
        .eq('estado', 'completado')

      const todayRevenue = todayOrders?.reduce((sum, order) => sum + order.total, 0) || 0

      // Ventas de la semana
      const { data: weekOrders } = await supabase
        .from('pedidos')
        .select('total')
        .gte('created_at', weekStart)
        .eq('estado', 'completado')

      const weekRevenue = weekOrders?.reduce((sum, order) => sum + order.total, 0) || 0

      // Ventas del mes
      const { data: monthOrders } = await supabase
        .from('pedidos')
        .select('total')
        .gte('created_at', monthStart)
        .eq('estado', 'completado')

      const monthRevenue = monthOrders?.reduce((sum, order) => sum + order.total, 0) || 0

      // Total de pedidos
      const { count: totalCount } = await supabase
        .from('pedidos')
        .select('*', { count: 'exact', head: true })

      // Pedidos pendientes
      const { count: pendingCount } = await supabase
        .from('pedidos')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'pendiente')

      // Detectar nuevos pedidos pendientes y reproducir sonido
      if (previousPendingCount > 0 && pendingCount && pendingCount > previousPendingCount) {
        playNotificationSound()
      }
      
      if (pendingCount !== null) {
        setPreviousPendingCount(pendingCount)
      }

      // Calcular ticket promedio (solo pedidos completados)
      const { data: completedOrders } = await supabase
        .from('pedidos')
        .select('total')
        .eq('estado', 'completado')

      const avgTicket = completedOrders && completedOrders.length > 0
        ? completedOrders.reduce((sum, order) => sum + order.total, 0) / completedOrders.length
        : 0

      setStats({
        today: todayRevenue,
        week: weekRevenue,
        month: monthRevenue,
        totalOrders: totalCount || 0,
        pendingOrders: pendingCount || 0,
        averageTicket: avgTicket,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchDailySales() {
    try {
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), 6 - i)
        return {
          date: format(date, 'yyyy-MM-dd'),
          displayDate: format(date, 'dd MMM', { locale: es })
        }
      })

      const salesData = await Promise.all(
        last7Days.map(async ({ date, displayDate }) => {
          const { data } = await supabase
            .from('pedidos')
            .select('total')
            .gte('created_at', `${date}T00:00:00`)
            .lt('created_at', `${date}T23:59:59`)
            .eq('estado', 'completado')

          const total = data?.reduce((sum, order) => sum + order.total, 0) || 0
          return { date: displayDate, total }
        })
      )

      setDailySales(salesData)
    } catch (error) {
      console.error('Error fetching daily sales:', error)
    }
  }

  async function fetchTopProducts() {
    try {
      const { data } = await supabase
        .from('pedido_detalles')
        .select('producto_nombre, cantidad, pedidos!inner(estado)')
        
      if (!data) return

      // Filtrar solo pedidos completados y agrupar por producto
      const productMap = new Map<string, number>()
      data.forEach((item: any) => {
        if (item.pedidos.estado === 'completado') {
          const current = productMap.get(item.producto_nombre) || 0
          productMap.set(item.producto_nombre, current + item.cantidad)
        }
      })

      // Convertir a array y ordenar
      const products = Array.from(productMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      setTopProducts(products)
    } catch (error) {
      console.error('Error fetching top products:', error)
    }
  }

  async function fetchRecentOrders() {
    try {
      const { data } = await supabase
        .from('pedidos')
        .select('id, created_at, nombre_cliente, total, estado')
        .order('created_at', { ascending: false })
        .limit(3)

      if (data) {
        setRecentOrders(data)
      }
    } catch (error) {
      console.error('Error fetching recent orders:', error)
    }
  }

  async function fetchTopClients() {
    try {
      const { data } = await supabase
        .from('pedidos')
        .select('nombre_cliente, telefono, total')
        .eq('estado', 'completado')

      if (!data) return

      // Agrupar por cliente
      const clientMap = new Map<string, { telefono: string; pedidos: number; total: number }>()
      data.forEach((pedido: any) => {
        const key = pedido.telefono
        const current = clientMap.get(key) || { telefono: pedido.telefono, pedidos: 0, total: 0 }
        clientMap.set(key, {
          telefono: pedido.telefono,
          pedidos: current.pedidos + 1,
          total: current.total + pedido.total
        })
      })

      // Convertir a array, agregar nombres y ordenar por número de pedidos
      const clients = Array.from(clientMap.entries())
        .map(([key, value]) => {
          const nombre = data.find(p => p.telefono === key)?.nombre_cliente || 'Cliente'
          return { nombre, telefono: value.telefono, pedidos: value.pedidos, total: value.total }
        })
        .sort((a, b) => b.pedidos - a.pedidos)
        .slice(0, 5)

      setTopClients(clients)
    } catch (error) {
      console.error('Error fetching top clients:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  const statCards = [
    { title: 'Ventas Hoy', value: `$${stats.today % 1 === 0 ? stats.today.toFixed(0) : stats.today.toFixed(2)}`, icon: '💰', color: 'bg-green-500', trend: '+12%', isPositive: true },
    { title: 'Ventas Semana', value: `$${stats.week % 1 === 0 ? stats.week.toFixed(0) : stats.week.toFixed(2)}`, icon: '📈', color: 'bg-blue-500', trend: '+8%', isPositive: true },
    { title: 'Ventas Mes', value: `$${stats.month % 1 === 0 ? stats.month.toFixed(0) : stats.month.toFixed(2)}`, icon: '📊', color: 'bg-purple-500', trend: '+15%', isPositive: true },
    { title: 'Ticket Promedio', value: `$${stats.averageTicket % 1 === 0 ? stats.averageTicket.toFixed(0) : stats.averageTicket.toFixed(2)}`, icon: '🎫', color: 'bg-pink-500', trend: '+5%', isPositive: true },
    { title: 'Total Pedidos', value: stats.totalOrders, icon: '📦', color: 'bg-orange-500', trend: null, isPositive: null },
    { title: 'Pedidos Pendientes', value: stats.pendingOrders, icon: '⏳', color: 'bg-yellow-500', trend: null, isPositive: null },
  ]

  const COLORS = ['#f97316', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b']

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Resumen de ventas y pedidos</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-6">
        {statCards.map((card, index) => (
          <div 
            key={card.title} 
            className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-100 hover:shadow-md transition-shadow duration-300"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs md:text-sm text-gray-600 mb-1">{card.title}</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">{card.value}</p>
                {card.trend && (
                  <div className="flex items-center mt-1">
                    <span className={`text-xs font-semibold ${card.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {card.isPositive ? '↑' : '↓'} {card.trend}
                    </span>
                    <span className="text-xs text-gray-500 ml-1">vs. anterior</span>
                  </div>
                )}
              </div>
              <div className={`${card.color} w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center text-xl md:text-2xl flex-shrink-0 ml-2`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventas últimos 7 días */}
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-100">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4">Ventas Últimos 7 Días</h2>
          <div className="h-64 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                  domain={[0, 'auto']}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  formatter={(value: number) => [`$${value % 1 === 0 ? value.toFixed(0) : value.toFixed(2)} MXN`, 'Ventas']}
                  labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                  cursor={{ stroke: '#f97316', strokeWidth: 2, strokeDasharray: '5 5' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#f97316" 
                  strokeWidth={3}
                  dot={{ fill: '#f97316', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 5 Productos */}
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-100">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4">Top 5 Productos Más Vendidos</h2>
          <div className="h-64 md:h-80">
            {topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    stroke="#6b7280"
                    style={{ fontSize: '11px' }}
                    width={100}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                    formatter={(value: number) => [`${value} unidades`, 'Vendidos']}
                    labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                    cursor={{ fill: 'rgba(249, 115, 22, 0.1)' }}
                  />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                    {topProducts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No hay datos suficientes
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Últimos Pedidos */}
      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-xl font-bold text-gray-900">Últimos 3 Pedidos</h2>
          <a href="/dashboard/pedidos" className="text-sm text-orange-600 hover:text-orange-700 font-medium">
            Ver todos →
          </a>
        </div>
        {recentOrders.length > 0 ? (
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900">#{order.id}</span>
                    <span className="text-sm text-gray-600">{order.nombre_cliente}</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {format(new Date(order.created_at), "d 'de' MMMM, HH:mm", { locale: es })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-gray-900">
                    ${order.total % 1 === 0 ? order.total.toFixed(0) : order.total.toFixed(2)} MXN
                  </span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    order.estado === 'completado' ? 'bg-green-100 text-green-700' :
                    order.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {order.estado === 'completado' ? '✓ Completado' :
                     order.estado === 'pendiente' ? '⏳ Pendiente' :
                     '✗ Cancelado'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No hay pedidos recientes
          </div>
        )}
      </div>

      {/* Top Clientes */}
      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-xl font-bold text-gray-900">🏆 Top 5 Clientes VIP</h2>
          <a href="/dashboard/clientes" className="text-sm text-orange-600 hover:text-orange-700 font-medium">
            Ver todos →
          </a>
        </div>
        {topClients.length > 0 ? (
          <div className="space-y-3">
            {topClients.map((client, index) => (
              <div key={client.telefono} className="flex items-center gap-3 p-3 bg-gradient-to-r from-orange-50 to-white rounded-lg border border-orange-100">
                <div className="flex-shrink-0 w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{client.nombre}</p>
                  <p className="text-xs text-gray-500">{client.telefono}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-orange-600">{client.pedidos} pedidos</p>
                  <p className="text-xs text-gray-600">
                    ${client.total % 1 === 0 ? client.total.toFixed(0) : client.total.toFixed(2)} MXN
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No hay datos de clientes
          </div>
        )}
      </div>

      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 md:p-8 text-white">
        <h2 className="text-xl md:text-2xl font-bold mb-3">¡Bienvenido al Panel de Administración! 👋</h2>
        <p className="text-orange-50 mb-6 text-sm md:text-base">
          Gestiona todos los pedidos de WhatsApp, controla el inventario y analiza tus ventas en tiempo real.
          El dashboard se actualiza automáticamente cada 30 segundos.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
          <a 
            href="/dashboard/pedidos" 
            className="px-6 py-3 bg-white text-orange-600 rounded-lg font-medium hover:bg-orange-50 transition text-center"
          >
            Ver Pedidos
          </a>
          <a 
            href="/dashboard/productos" 
            className="px-6 py-3 bg-orange-700 hover:bg-orange-800 text-white rounded-lg font-medium transition text-center"
          >
            Gestionar Productos
          </a>
        </div>
      </div>
    </div>
  )
}
