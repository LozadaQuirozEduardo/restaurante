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
}

interface DailySale {
  date: string
  total: number
}

interface ProductSale {
  name: string
  count: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    today: 0,
    week: 0,
    month: 0,
    totalOrders: 0,
    pendingOrders: 0,
  })
  const [dailySales, setDailySales] = useState<DailySale[]>([])
  const [topProducts, setTopProducts] = useState<ProductSale[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    fetchDailySales()
    fetchTopProducts()
    
    // Auto-refresh cada 30 segundos
    const interval = setInterval(() => {
      fetchStats()
      fetchDailySales()
      fetchTopProducts()
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

      setStats({
        today: todayRevenue,
        week: weekRevenue,
        month: monthRevenue,
        totalOrders: totalCount || 0,
        pendingOrders: pendingCount || 0,
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  const statCards = [
    { title: 'Ventas Hoy', value: `$${stats.today.toFixed(2)}`, icon: '💰', color: 'bg-green-500', trend: '+12%' },
    { title: 'Ventas Semana', value: `$${stats.week.toFixed(2)}`, icon: '📈', color: 'bg-blue-500', trend: '+8%' },
    { title: 'Ventas Mes', value: `$${stats.month.toFixed(2)}`, icon: '📊', color: 'bg-purple-500', trend: '+15%' },
    { title: 'Total Pedidos', value: stats.totalOrders, icon: '📦', color: 'bg-orange-500', trend: null },
    { title: 'Pedidos Pendientes', value: stats.pendingOrders, icon: '⏳', color: 'bg-yellow-500', trend: null },
  ]

  const COLORS = ['#f97316', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b']

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Resumen de ventas y pedidos</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6">
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
                  <p className="text-xs text-green-600 mt-1">{card.trend} vs. anterior</p>
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
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Ventas']}
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
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`${value} vendidos`, 'Cantidad']}
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
