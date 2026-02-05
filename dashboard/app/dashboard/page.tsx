'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { format, startOfDay, startOfWeek, startOfMonth, subDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import DatePicker from 'react-datepicker'

export const dynamic = 'force-dynamic';
import 'react-datepicker/dist/react-datepicker.css'

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

interface LowStockProduct {
  nombre: string
  vendidos: number
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
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([])
  const [previousPendingCount, setPreviousPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null])
  const [startDate, endDate] = dateRange
  const [showDatePicker, setShowDatePicker] = useState(false)

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
    loadAllData()
    
    // Auto-refresh cada 30 segundos
    const interval = setInterval(() => {
      loadAllData()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  // Cargar todos los datos en paralelo para máxima velocidad
  async function loadAllData() {
    try {
      const supabase = createClient()
      const now = new Date()
      const todayStart = startOfDay(now).toISOString()
      const weekStart = startOfWeek(now, { locale: es }).toISOString()
      const monthStart = startOfMonth(now).toISOString()
      const sevenDaysAgo = subDays(new Date(), 7).toISOString()

      // EJECUTAR TODAS LAS CONSULTAS EN PARALELO
      const [
        todayOrdersResult,
        weekOrdersResult,
        monthOrdersResult,
        totalCountResult,
        pendingCountResult,
        completedOrdersResult,
        dailySalesResult,
        topProductsResult,
        recentOrdersResult,
        topClientsResult,
        lowStockResult
      ] = await Promise.all([
        // Stats
        supabase.from('pedidos').select('total').gte('created_at', todayStart).eq('estado', 'completado'),
        supabase.from('pedidos').select('total').gte('created_at', weekStart).eq('estado', 'completado'),
        supabase.from('pedidos').select('total').gte('created_at', monthStart).eq('estado', 'completado'),
        supabase.from('pedidos').select('*', { count: 'exact', head: true }),
        supabase.from('pedidos').select('*', { count: 'exact', head: true }).eq('estado', 'pendiente'),
        supabase.from('pedidos').select('total').eq('estado', 'completado'),
        
        // Daily sales - una sola query para todos los días
        supabase.from('pedidos').select('created_at, total').gte('created_at', sevenDaysAgo).eq('estado', 'completado'),
        
        // Top products
        supabase.from('pedido_detalles').select('producto_nombre, cantidad, pedidos!inner(estado)'),
        
        // Recent orders
        supabase.from('pedidos').select('id, created_at, nombre_cliente, total, estado').order('created_at', { ascending: false }).limit(3),
        
        // Top clients
        supabase.from('pedidos').select('nombre_cliente, telefono, total').eq('estado', 'completado'),
        
        // Low stock / high demand products
        supabase.from('pedido_detalles').select('producto_nombre, cantidad, pedidos!inner(estado, created_at)').gte('pedidos.created_at', sevenDaysAgo)
      ])

      // PROCESAR STATS
      const todayRevenue = todayOrdersResult.data?.reduce((sum, order) => sum + order.total, 0) || 0
      const weekRevenue = weekOrdersResult.data?.reduce((sum, order) => sum + order.total, 0) || 0
      const monthRevenue = monthOrdersResult.data?.reduce((sum, order) => sum + order.total, 0) || 0
      const totalCount = totalCountResult.count || 0
      const pendingCount = pendingCountResult.count || 0
      
      // Detectar nuevos pedidos pendientes y reproducir sonido
      if (previousPendingCount > 0 && pendingCount > previousPendingCount) {
        playNotificationSound()
      }
      if (pendingCount !== null) {
        setPreviousPendingCount(pendingCount)
      }

      const avgTicket = completedOrdersResult.data && completedOrdersResult.data.length > 0
        ? completedOrdersResult.data.reduce((sum, order) => sum + order.total, 0) / completedOrdersResult.data.length
        : 0

      setStats({
        today: todayRevenue,
        week: weekRevenue,
        month: monthRevenue,
        totalOrders: totalCount,
        pendingOrders: pendingCount,
        averageTicket: avgTicket,
      })

      // PROCESAR DAILY SALES
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), 6 - i)
        return {
          date: format(date, 'yyyy-MM-dd'),
          displayDate: format(date, 'dd MMM', { locale: es })
        }
      })

      const salesByDay = new Map<string, number>()
      dailySalesResult.data?.forEach(order => {
        const orderDate = format(new Date(order.created_at), 'yyyy-MM-dd')
        salesByDay.set(orderDate, (salesByDay.get(orderDate) || 0) + order.total)
      })

      const salesData = last7Days.map(({ date, displayDate }) => ({
        date: displayDate,
        total: salesByDay.get(date) || 0
      }))
      setDailySales(salesData)

      // PROCESAR TOP PRODUCTS
      const productMap = new Map<string, number>()
      topProductsResult.data?.forEach((item: any) => {
        if (item.pedidos.estado === 'completado') {
          productMap.set(item.producto_nombre, (productMap.get(item.producto_nombre) || 0) + item.cantidad)
        }
      })

      const products = Array.from(productMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
      setTopProducts(products)

      // PROCESAR RECENT ORDERS
      if (recentOrdersResult.data) {
        setRecentOrders(recentOrdersResult.data)
      }

      // PROCESAR TOP CLIENTS
      const clientMap = new Map<string, { telefono: string; pedidos: number; total: number }>()
      topClientsResult.data?.forEach((pedido: any) => {
        const key = pedido.telefono
        const current = clientMap.get(key) || { telefono: pedido.telefono, pedidos: 0, total: 0 }
        clientMap.set(key, {
          telefono: pedido.telefono,
          pedidos: current.pedidos + 1,
          total: current.total + pedido.total
        })
      })

      const clients = Array.from(clientMap.entries())
        .map(([key, value]) => {
          const nombre = topClientsResult.data?.find(p => p.telefono === key)?.nombre_cliente || 'Cliente'
          return { nombre, telefono: value.telefono, pedidos: value.pedidos, total: value.total }
        })
        .sort((a, b) => b.pedidos - a.pedidos)
        .slice(0, 5)
      setTopClients(clients)

      // PROCESAR LOW STOCK
      const lowStockMap = new Map<string, number>()
      lowStockResult.data?.forEach((item: any) => {
        if (item.pedidos.estado === 'completado') {
          lowStockMap.set(item.producto_nombre, (lowStockMap.get(item.producto_nombre) || 0) + item.cantidad)
        }
      })

      const highDemandProducts = Array.from(lowStockMap.entries())
        .filter(([_, count]) => count >= 10)
        .map(([name, count]) => ({ nombre: name, vendidos: count }))
        .sort((a, b) => b.vendidos - a.vendidos)
        .slice(0, 5)
      setLowStockProducts(highDemandProducts)

      setLoading(false)
    } catch (error) {
      console.error('Error loading data:', error)
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    if (value === undefined || value === null || isNaN(value)) return '$0'
    return `$${value % 1 === 0 ? value.toFixed(0) : value.toFixed(2)}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  const statCards = [
    { title: 'Ventas de Hoy', value: formatCurrency(stats.today), icon: '💰', color: 'text-orange-600', bgColor: 'bg-orange-50 dark:bg-orange-900/10' },
    { title: 'Ventas del Mes', value: formatCurrency(stats.month), icon: '📊', color: 'text-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-900/10' },
    { title: 'Total Pedidos', value: stats.totalOrders, icon: '📦', color: 'text-slate-600', bgColor: 'bg-slate-50 dark:bg-slate-900/10' },
    { title: 'Pedidos Pendientes', value: stats.pendingOrders, icon: '⏳', color: 'text-amber-600', bgColor: 'bg-amber-50 dark:bg-amber-900/10' },
  ]

  const COLORS = ['#f97316', '#3b82f6', '#10b981']

  // Función para exportar a PDF
  const exportToPDF = async () => {
    try {
      const doc = new jsPDF()
      
      // Título
      doc.setFontSize(20)
      doc.setTextColor(249, 115, 22) // Orange
      doc.text('El Rinconcito - Reporte de Ventas', 14, 20)
      
      // Fecha del reporte
      doc.setFontSize(10)
      doc.setTextColor(100)
      doc.text(`Generado: ${format(new Date(), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}`, 14, 28)
      
      // Resumen de ventas
      doc.setFontSize(14)
      doc.setTextColor(0)
      doc.text('Resumen de Ventas', 14, 40)
      
      const summaryData = [
        ['Periodo', 'Monto'],
        ['Hoy', `${formatCurrency(stats.today)} MXN`],
        ['Esta Semana', `${formatCurrency(stats.week)} MXN`],
        ['Este Mes', `${formatCurrency(stats.month)} MXN`],
        ['Ticket Promedio', `${formatCurrency(stats.averageTicket)} MXN`],
      ]
      
      autoTable(doc, {
        startY: 45,
        head: [summaryData[0]],
        body: summaryData.slice(1),
        theme: 'grid',
        headStyles: { fillColor: [249, 115, 22] }
      })
      
      // Ventas últimos 7 días
      doc.setFontSize(14)
      const lastY1 = (doc as any).lastAutoTable?.finalY || 45
      doc.text('Ventas Últimos 7 Días', 14, lastY1 + 15)
      
      const salesData = dailySales.map(sale => [
        sale.date,
        `${formatCurrency(sale.total)} MXN`
      ])
      
      autoTable(doc, {
        startY: lastY1 + 20,
        head: [['Fecha', 'Total']],
        body: salesData,
        theme: 'striped',
        headStyles: { fillColor: [249, 115, 22] }
      })
      
      // Top productos
      doc.setFontSize(14)
      const lastY2 = (doc as any).lastAutoTable?.finalY || lastY1 + 20
      doc.text('Top 5 Productos Más Vendidos', 14, lastY2 + 15)
      
      const productsData = topProducts.map((product, index) => [
        `${index + 1}`,
        product.name,
        `${product.count} unidades`
      ])
      
      autoTable(doc, {
        startY: lastY2 + 20,
        head: [['#', 'Producto', 'Cantidad']],
        body: productsData,
        theme: 'striped',
        headStyles: { fillColor: [249, 115, 22] }
      })
    
      // Top clientes
      if (topClients.length > 0) {
        doc.addPage()
        doc.setFontSize(14)
        doc.text('Top 5 Clientes VIP', 14, 20)
        
        const clientsData = topClients.map((client, index) => [
          `${index + 1}`,
          client.nombre,
          client.telefono,
          `${client.pedidos} pedidos`,
          `${formatCurrency(client.total)} MXN`
        ])
        
        autoTable(doc, {
          startY: 25,
          head: [['#', 'Cliente', 'Teléfono', 'Pedidos', 'Total Gastado']],
          body: clientsData,
          theme: 'striped',
          headStyles: { fillColor: [249, 115, 22] }
        })
      }
      
      // Estadísticas generales
      doc.setFontSize(14)
      const lastY3 = (doc as any).lastAutoTable?.finalY || 25
      doc.text('Estadísticas Generales', 14, lastY3 + 15)
      
      const statsData = [
        ['Total de Pedidos', stats.totalOrders.toString()],
        ['Pedidos Pendientes', stats.pendingOrders.toString()],
      ]
      
      autoTable(doc, {
        startY: lastY3 + 20,
        head: [['Métrica', 'Valor']],
        body: statsData,
        theme: 'grid',
        headStyles: { fillColor: [249, 115, 22] }
      })
      
      // Guardar PDF
      doc.save(`Reporte_Ventas_${format(new Date(), 'yyyy-MM-dd')}.pdf`)
      
      // Mostrar mensaje de éxito
      alert('✅ Reporte PDF generado exitosamente')
    } catch (error) {
      console.error('Error al generar PDF:', error)
      alert('❌ Error al generar el PDF. Por favor intenta nuevamente.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Resumen de ventas y pedidos</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Filtrar Fechas
          </button>
          <button
            onClick={exportToPDF}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Seleccionar Periodo</h3>
            <button
              onClick={() => setShowDatePicker(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div>
              <DatePicker
                selectsRange={true}
                startDate={startDate}
                endDate={endDate}
                onChange={(update: [Date | null, Date | null]) => {
                  setDateRange(update)
                }}
                locale={es}
                dateFormat="dd/MM/yyyy"
                placeholderText="Selecciona rango de fechas"
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                isClearable={true}
              />
            </div>
            {startDate && endDate && (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    // Aquí puedes agregar lógica para filtrar los datos
                    setShowDatePicker(false)
                  }}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium"
                >
                  Aplicar
                </button>
                <button
                  onClick={() => {
                    setDateRange([null, null])
                  }}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium"
                >
                  Limpiar
                </button>
              </div>
            )}
          </div>
          {startDate && endDate && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Periodo seleccionado: {format(startDate, 'dd/MM/yyyy')} - {format(endDate, 'dd/MM/yyyy')}
            </p>
          )}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 md:gap-8">
        {statCards.map((card, index) => (
          <div 
            key={card.title} 
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-8 border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:border-orange-300 dark:hover:border-orange-600 transition-all duration-300 transform hover:-translate-y-1"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{card.title}</span>
                <div className={`w-12 h-12 rounded-xl ${card.bgColor} flex items-center justify-center`}>
                  <span className={`text-2xl ${card.color}`}>{card.icon}</span>
                </div>
              </div>
              <div>
                <p className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Alertas de Stock Bajo / Alta Demanda */}
        {lowStockProducts.length > 0 && (
          <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl shadow-sm p-4 md:p-6 border-2 border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">⚠️</span>
              <h2 className="text-lg md:text-xl font-bold text-red-700 dark:text-red-400">Productos de Alta Demanda</h2>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
              Estos productos se vendieron mucho esta semana. Verifica el inventario:
            </p>
            <div className="space-y-3">
              {lowStockProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🔥</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{product.nombre}</span>
                  </div>
                  <span className="px-3 py-1 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-full text-sm font-bold">
                    {product.vendidos} vendidos
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ventas últimos 7 días */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 md:p-8 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-6">Ventas Últimos 7 Días</h2>
          <div className="h-72 md:h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailySales} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="0" stroke="#e5e7eb" className="dark:stroke-gray-700" opacity={0.5} />
                <XAxis 
                  dataKey="date" 
                  stroke="#9ca3af"
                  style={{ fontSize: '13px', fontWeight: '500' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#9ca3af"
                  style={{ fontSize: '13px', fontWeight: '500' }}
                  domain={[0, 'auto']}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    padding: '12px'
                  }}
                  formatter={(value: number) => [`$${value % 1 === 0 ? value.toFixed(0) : value.toFixed(2)} MXN`, 'Ventas']}
                  labelStyle={{ fontWeight: '600', marginBottom: '6px', color: '#111827' }}
                  cursor={{ stroke: '#f97316', strokeWidth: 1, opacity: 0.1, fill: '#f97316' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#f97316" 
                  strokeWidth={4}
                  dot={{ fill: '#f97316', r: 5, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 7, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 5 Productos */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 md:p-8 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-6">Top 5 Productos Más Vendidos</h2>
          <div className="h-72 md:h-96">
            {topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="0" stroke="#e5e7eb" className="dark:stroke-gray-700" opacity={0.5} horizontal={true} vertical={false} />
                  <XAxis 
                    type="number" 
                    stroke="#9ca3af" 
                    style={{ fontSize: '13px', fontWeight: '500' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    stroke="#9ca3af"
                    style={{ fontSize: '13px', fontWeight: '500' }}
                    width={120}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      padding: '12px'
                    }}
                    formatter={(value: number) => [`${value} unidades`, 'Vendidos']}
                    labelStyle={{ fontWeight: '600', marginBottom: '6px', color: '#111827' }}
                    cursor={{ fill: '#f9731620' }}
                  />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={30}>
                    {topProducts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                No hay datos suficientes
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Últimos Pedidos */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 md:p-8 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Últimos 3 Pedidos</h2>
          <a href="/dashboard/pedidos" className="text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-semibold transition-colors">
            Ver todos →
          </a>
        </div>
        {recentOrders.length > 0 ? (
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-600">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-base text-gray-900 dark:text-white">#{order.id}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">{order.nombre_cliente}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    {format(new Date(order.created_at), "d 'de' MMMM, HH:mm", { locale: es })}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-lg text-gray-900 dark:text-white">
                    ${order.total % 1 === 0 ? order.total.toFixed(0) : order.total.toFixed(2)}
                  </span>
                  <span className={`px-3 py-1.5 text-xs font-bold rounded-full ${
                    order.estado === 'completado' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    order.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
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
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No hay pedidos recientes
          </div>
        )}
      </div>

      {/* Top Clientes */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 md:p-8 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>🏆</span> Top 5 Clientes VIP
          </h2>
          <a href="/dashboard/clientes" className="text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-semibold transition-colors">
            Ver todos →
          </a>
        </div>
        {topClients.length > 0 ? (
          <div className="space-y-4">
            {topClients.map((client, index) => (
              <div key={client.telefono} className="flex items-center gap-4 p-4 bg-gradient-to-r from-orange-50 dark:from-orange-900/10 to-transparent rounded-xl border border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-700 transition-all">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-md">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-base text-gray-900 dark:text-white truncate mb-1">{client.nombre}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{client.telefono}</p>
                </div>
                <div className="text-right flex flex-col gap-1">
                  <p className="text-sm font-bold text-orange-600 dark:text-orange-400">{client.pedidos} pedidos</p>
                  <p className="text-base font-bold text-gray-900 dark:text-white">
                    ${client.total % 1 === 0 ? client.total.toFixed(0) : client.total.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
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
