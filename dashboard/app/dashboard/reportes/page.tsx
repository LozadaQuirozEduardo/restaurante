'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format, startOfDay, startOfWeek, startOfMonth, subDays, subWeeks, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area } from 'recharts'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface Stats {
  today: number
  yesterday: number
  week: number
  lastWeek: number
  month: number
  lastMonth: number
  totalOrders: number
  pendingOrders: number
  completedOrders: number
  canceledOrders: number
  averageTicket: number
  totalRevenue: number
  deliveryOrders: number
  pickupOrders: number
}

interface HourlyData {
  hour: string
  pedidos: number
  ventas: number
}

interface CategorySales {
  categoria: string
  total: number
  pedidos: number
}

export default function ReportesPage() {
  const [stats, setStats] = useState<Stats>({
    today: 0,
    yesterday: 0,
    week: 0,
    lastWeek: 0,
    month: 0,
    lastMonth: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    canceledOrders: 0,
    averageTicket: 0,
    totalRevenue: 0,
    deliveryOrders: 0,
    pickupOrders: 0,
  })
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([])
  const [categorySales, setCategorySales] = useState<CategorySales[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReportesOptimizado()
  }, [])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? '+100%' : '0%'
    const change = ((current - previous) / previous) * 100
    return change >= 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`
  }

  async function fetchReportesOptimizado() {
    try {
      const now = new Date()
      const todayStart = startOfDay(now).toISOString()
      const yesterdayStart = startOfDay(subDays(now, 1)).toISOString()
      const weekStart = startOfWeek(now, { locale: es }).toISOString()
      const lastWeekStart = startOfWeek(subWeeks(now, 1), { locale: es }).toISOString()
      const monthStart = startOfMonth(now).toISOString()
      const lastMonthStart = startOfMonth(subMonths(now, 1)).toISOString()

      // PARALELIZAR TODAS LAS CONSULTAS CON OPTIMIZACIONES
      const [
        todayOrdersResult,
        yesterdayOrdersResult,
        weekOrdersResult,
        lastWeekOrdersResult,
        monthOrdersResult,
        lastMonthOrdersResult,
        totalCountResult,
        pendingCountResult,
        completedCountResult,
        canceledCountResult,
        deliveryCountResult,
        pickupCountResult,
        completedOrdersResult,
        todayOrdersDetailedResult
      ] = await Promise.all([
        supabase.from('pedidos').select('total').gte('created_at', todayStart).eq('estado', 'completado').limit(500),
        supabase.from('pedidos').select('total').gte('created_at', yesterdayStart).lt('created_at', todayStart).eq('estado', 'completado').limit(500),
        supabase.from('pedidos').select('total').gte('created_at', weekStart).eq('estado', 'completado').limit(1000),
        supabase.from('pedidos').select('total').gte('created_at', lastWeekStart).lt('created_at', weekStart).eq('estado', 'completado').limit(1000),
        supabase.from('pedidos').select('total').gte('created_at', monthStart).eq('estado', 'completado').limit(3000),
        supabase.from('pedidos').select('total').gte('created_at', lastMonthStart).lt('created_at', monthStart).eq('estado', 'completado').limit(3000),
        supabase.from('pedidos').select('*', { count: 'exact', head: true }),
        supabase.from('pedidos').select('*', { count: 'exact', head: true }).eq('estado', 'pendiente'),
        supabase.from('pedidos').select('*', { count: 'exact', head: true }).eq('estado', 'completado'),
        supabase.from('pedidos').select('*', { count: 'exact', head: true }).eq('estado', 'cancelado'),
        supabase.from('pedidos').select('*', { count: 'exact', head: true }).eq('tipo_entrega', 'delivery'),
        supabase.from('pedidos').select('*', { count: 'exact', head: true }).eq('tipo_entrega', 'recoger'),
        // Solo últimos 100 pedidos completados para calcular promedio
        supabase.from('pedidos').select('total').eq('estado', 'completado').order('created_at', { ascending: false }).limit(100),
        supabase.from('pedidos').select('created_at, total, estado').gte('created_at', todayStart).limit(200)
      ])

      // PROCESAR RESULTADOS
      const todayRevenue = todayOrdersResult.data?.reduce((sum, order) => sum + order.total, 0) || 0
      const yesterdayRevenue = yesterdayOrdersResult.data?.reduce((sum, order) => sum + order.total, 0) || 0
      const weekRevenue = weekOrdersResult.data?.reduce((sum, order) => sum + order.total, 0) || 0
      const lastWeekRevenue = lastWeekOrdersResult.data?.reduce((sum, order) => sum + order.total, 0) || 0
      const monthRevenue = monthOrdersResult.data?.reduce((sum, order) => sum + order.total, 0) || 0
      const lastMonthRevenue = lastMonthOrdersResult.data?.reduce((sum, order) => sum + order.total, 0) || 0

      const avgTicket = completedOrdersResult.data && completedOrdersResult.data.length > 0
        ? completedOrdersResult.data.reduce((sum, order) => sum + order.total, 0) / completedOrdersResult.data.length
        : 0

      const totalRevenue = completedOrdersResult.data?.reduce((sum, order) => sum + order.total, 0) || 0

      setStats({
        today: todayRevenue,
        yesterday: yesterdayRevenue,
        week: weekRevenue,
        lastWeek: lastWeekRevenue,
        month: monthRevenue,
        lastMonth: lastMonthRevenue,
        totalOrders: totalCountResult.count || 0,
        pendingOrders: pendingCountResult.count || 0,
        completedOrders: completedCountResult.count || 0,
        canceledOrders: canceledCountResult.count || 0,
        averageTicket: avgTicket,
        totalRevenue: totalRevenue,
        deliveryOrders: deliveryCountResult.count || 0,
        pickupOrders: pickupCountResult.count || 0,
      })

      // Datos por hora del día de hoy
      const hourlyMap = new Map()
      for (let i = 0; i < 24; i++) {
        hourlyMap.set(i, { hour: `${i}:00`, pedidos: 0, ventas: 0 })
      }

      todayOrdersDetailedResult.data?.forEach(order => {
        const hour = new Date(order.created_at).getHours()
        const data = hourlyMap.get(hour)
        if (data) {
          data.pedidos++
          if (order.estado === 'completado') {
            data.ventas += order.total
          }
        }
      })

      setHourlyData(Array.from(hourlyMap.values()))
      setLoading(false)
    } catch (error) {
      console.error('Error fetching reportes:', error)
      setLoading(false)
    }
  }

  const exportToPDF = () => {
    const doc = new jsPDF()
    
    doc.setFontSize(20)
    doc.setTextColor(249, 115, 22)
    doc.text('El Rinconcito - Reporte Completo', 14, 20)
    
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Generado: ${format(new Date(), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}`, 14, 28)
    
    const statsData = [
      ['Ventas Hoy', formatCurrency(stats.today)],
      ['Ventas Semana', formatCurrency(stats.week)],
      ['Ventas Mes', formatCurrency(stats.month)],
      ['Ticket Promedio', formatCurrency(stats.averageTicket)],
      ['Total Ingresos', formatCurrency(stats.totalRevenue)],
      ['Pedidos Completados', stats.completedOrders.toString()],
      ['Pedidos Pendientes', stats.pendingOrders.toString()],
      ['Pedidos Cancelados', stats.canceledOrders.toString()],
      ['Pedidos Delivery', stats.deliveryOrders.toString()],
      ['Pedidos Recoger', stats.pickupOrders.toString()],
    ]
    
    autoTable(doc, {
      startY: 35,
      head: [['Métrica', 'Valor']],
      body: statsData,
      theme: 'grid',
      headStyles: { fillColor: [249, 115, 22] }
    })
    
    doc.save(`Reporte_Completo_${format(new Date(), 'yyyy-MM-dd')}.pdf`)
    alert('✅ Reporte PDF generado exitosamente')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  const COLORS = ['#f97316', '#3b82f6', '#10b981', '#ef4444']

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">📊 Reportes y Análisis</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Estadísticas detalladas y métricas avanzadas</p>
        </div>
        <button
          onClick={exportToPDF}
          className="flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors shadow-lg"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Exportar PDF
        </button>
      </div>

      {/* Comparativas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Hoy vs Ayer */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-2xl p-6 border-2 border-orange-200 dark:border-orange-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-orange-700 dark:text-orange-400">Hoy vs Ayer</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(stats.today)}</p>
            </div>
            <div className="text-right">
              <span className={`text-2xl font-bold ${stats.today >= stats.yesterday ? 'text-green-600' : 'text-red-600'}`}>
                {calculatePercentageChange(stats.today, stats.yesterday)}
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Ayer: {formatCurrency(stats.yesterday)}</p>
        </div>

        {/* Semana Actual vs Anterior */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-6 border-2 border-blue-200 dark:border-blue-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-blue-700 dark:text-blue-400">Semana Actual vs Anterior</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(stats.week)}</p>
            </div>
            <div className="text-right">
              <span className={`text-2xl font-bold ${stats.week >= stats.lastWeek ? 'text-green-600' : 'text-red-600'}`}>
                {calculatePercentageChange(stats.week, stats.lastWeek)}
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Semana pasada: {formatCurrency(stats.lastWeek)}</p>
        </div>

        {/* Mes Actual vs Anterior */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl p-6 border-2 border-purple-200 dark:border-purple-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-purple-700 dark:text-purple-400">Mes Actual vs Anterior</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(stats.month)}</p>
            </div>
            <div className="text-right">
              <span className={`text-2xl font-bold ${stats.month >= stats.lastMonth ? 'text-green-600' : 'text-red-600'}`}>
                {calculatePercentageChange(stats.month, stats.lastMonth)}
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Mes pasado: {formatCurrency(stats.lastMonth)}</p>
        </div>
      </div>

      {/* Métricas Clave */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
              <span className="text-3xl">🎯</span>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Ticket Promedio</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.averageTicket)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
              <span className="text-3xl">💰</span>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Ingresos Totales</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.totalRevenue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <span className="text-3xl">✅</span>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Completados</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completedOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
              <span className="text-3xl">❌</span>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Cancelados</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.canceledOrders}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pedidos por hora */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">📈 Pedidos por Hora (Hoy)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={hourlyData}>
              <defs>
                <linearGradient id="colorPedidos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis dataKey="hour" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: 'none', 
                  borderRadius: '8px',
                  color: '#fff'
                }} 
              />
              <Area type="monotone" dataKey="pedidos" stroke="#f97316" fillOpacity={1} fill="url(#colorPedidos)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Distribución de pedidos */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">📊 Distribución de Pedidos</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Completados', value: stats.completedOrders },
                  { name: 'Pendientes', value: stats.pendingOrders },
                  { name: 'Cancelados', value: stats.canceledOrders },
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {COLORS.map((color, index) => (
                  <Cell key={`cell-${index}`} fill={color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Tipo de entrega */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700 lg:col-span-2">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">🚚 Tipo de Entrega</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={[
                { name: 'Delivery', pedidos: stats.deliveryOrders },
                { name: 'Recoger', pedidos: stats.pickupOrders },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: 'none', 
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Bar dataKey="pedidos" fill="#f97316" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
