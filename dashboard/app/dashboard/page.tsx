'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format, startOfDay, startOfWeek, startOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'

interface Stats {
  today: number
  week: number
  month: number
  totalOrders: number
  pendingOrders: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    today: 0,
    week: 0,
    month: 0,
    totalOrders: 0,
    pendingOrders: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
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

  if (loading) {
    return <div className="text-center py-12">Cargando estadísticas...</div>
  }

  const statCards = [
    { title: 'Ventas Hoy', value: `$${stats.today.toFixed(2)}`, icon: '💰', color: 'bg-green-500' },
    { title: 'Ventas Semana', value: `$${stats.week.toFixed(2)}`, icon: '📈', color: 'bg-blue-500' },
    { title: 'Ventas Mes', value: `$${stats.month.toFixed(2)}`, icon: '📊', color: 'bg-purple-500' },
    { title: 'Total Pedidos', value: stats.totalOrders, icon: '📦', color: 'bg-orange-500' },
    { title: 'Pedidos Pendientes', value: stats.pendingOrders, icon: '⏳', color: 'bg-yellow-500' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Resumen de ventas y pedidos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card) => (
          <div key={card.title} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
              <div className={`${card.color} w-12 h-12 rounded-lg flex items-center justify-center text-2xl`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Bienvenido al Panel de Administración</h2>
        <p className="text-gray-600">
          Aquí puedes gestionar todos los pedidos que llegan por WhatsApp, controlar el inventario de productos,
          ver las estadísticas de ventas y administrar la información de tus clientes.
        </p>
        <div className="mt-4 flex gap-4">
          <a href="/dashboard/pedidos" className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition">
            Ver Pedidos
          </a>
          <a href="/dashboard/productos" className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition">
            Gestionar Productos
          </a>
        </div>
      </div>
    </div>
  )
}
