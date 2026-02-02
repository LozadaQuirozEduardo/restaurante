'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PedidoDetalle {
  id: number;
  producto_nombre: string;
  cantidad: number;
  precio_unitario: number;
}

interface Pedido {
  id: number;
  cliente_id: number;
  total: number;
  estado: string;
  tipo_entrega: string;
  direccion_entrega: string | null;
  notas: string | null;
  telefono: string;
  nombre_cliente: string;
  created_at: string;
  pedido_detalles: PedidoDetalle[];
}

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [filtro, setFiltro] = useState<string>('todos');
  const [loading, setLoading] = useState(true);
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);

  useEffect(() => {
    cargarPedidos();
  }, []);

  const cargarPedidos = async () => {
    setLoading(true);
    const supabase = createClient();
    
    let query = supabase
      .from('pedidos')
      .select(`
        *,
        pedido_detalles (
          id,
          producto_nombre,
          cantidad,
          precio_unitario
        )
      `)
      .order('created_at', { ascending: false });

    if (filtro !== 'todos') {
      query = query.eq('estado', filtro);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error al cargar pedidos:', error);
    } else {
      setPedidos(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    cargarPedidos();
  }, [filtro]);

  const cambiarEstado = async (pedidoId: number, nuevoEstado: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('pedidos')
      .update({ estado: nuevoEstado })
      .eq('id', pedidoId);

    if (error) {
      console.error('Error al cambiar estado:', error);
      alert('Error al cambiar el estado del pedido');
    } else {
      cargarPedidos();
      setSelectedPedido(null);
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'completado':
        return 'bg-green-100 text-green-800';
      case 'cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Pedidos</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setFiltro('todos')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filtro === 'todos'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFiltro('pendiente')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filtro === 'pendiente'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Pendientes
          </button>
          <button
            onClick={() => setFiltro('completado')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filtro === 'completado'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Completados
          </button>
          <button
            onClick={() => setFiltro('cancelado')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filtro === 'cancelado'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Cancelados
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
        </div>
      ) : pedidos.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 text-lg">No hay pedidos para mostrar</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pedidos.map((pedido) => (
                <tr key={pedido.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{pedido.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{pedido.nombre_cliente}</div>
                    <div className="text-sm text-gray-500">{pedido.telefono}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(pedido.created_at), "d 'de' MMMM, HH:mm", { locale: es })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {pedido.tipo_entrega === 'delivery' ? '🚚 Delivery' : '🏪 Recoger'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    ${pedido.total.toFixed(2)} MXN
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getEstadoColor(pedido.estado)}`}>
                      {pedido.estado.charAt(0).toUpperCase() + pedido.estado.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setSelectedPedido(pedido)}
                      className="text-orange-600 hover:text-orange-900"
                    >
                      Ver detalles
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de detalles */}
      {selectedPedido && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Pedido #{selectedPedido.id}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {format(new Date(selectedPedido.created_at), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedPedido(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Información del cliente */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Cliente</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm"><span className="font-medium">Nombre:</span> {selectedPedido.nombre_cliente}</p>
                  <p className="text-sm"><span className="font-medium">Teléfono:</span> {selectedPedido.telefono}</p>
                </div>
              </div>

              {/* Tipo de entrega */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Entrega</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm mb-2">
                    <span className="font-medium">Tipo:</span>{' '}
                    {selectedPedido.tipo_entrega === 'delivery' ? '🚚 Delivery' : '🏪 Recoger en restaurante'}
                  </p>
                  {selectedPedido.tipo_entrega === 'delivery' && selectedPedido.direccion_entrega && (
                    <p className="text-sm">
                      <span className="font-medium">Dirección:</span> {selectedPedido.direccion_entrega}
                    </p>
                  )}
                  {selectedPedido.notas && (
                    <p className="text-sm mt-2">
                      <span className="font-medium">Notas:</span> {selectedPedido.notas}
                    </p>
                  )}
                </div>
              </div>

              {/* Productos */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Productos</h3>
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  <table className="min-w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Producto</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-600">Cantidad</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">Precio</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedPedido.pedido_detalles.map((detalle) => (
                        <tr key={detalle.id}>
                          <td className="px-4 py-3 text-sm text-gray-900">{detalle.producto_nombre}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-center">{detalle.cantidad}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">
                            ${detalle.precio_unitario.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                            ${(detalle.cantidad * detalle.precio_unitario).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                      {selectedPedido.tipo_entrega === 'delivery' && (
                        <tr className="bg-gray-50">
                          <td colSpan={3} className="px-4 py-3 text-sm text-gray-700 text-right">
                            Costo de envío:
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                            $15.00
                          </td>
                        </tr>
                      )}
                      <tr className="bg-gray-100">
                        <td colSpan={3} className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                          Total:
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                          ${selectedPedido.total.toFixed(2)} MXN
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Cambiar estado */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Estado del pedido</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => cambiarEstado(selectedPedido.id, 'pendiente')}
                    disabled={selectedPedido.estado === 'pendiente'}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedPedido.estado === 'pendiente'
                        ? 'bg-yellow-100 text-yellow-800 cursor-not-allowed'
                        : 'bg-yellow-500 text-white hover:bg-yellow-600'
                    }`}
                  >
                    Pendiente
                  </button>
                  <button
                    onClick={() => cambiarEstado(selectedPedido.id, 'completado')}
                    disabled={selectedPedido.estado === 'completado'}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedPedido.estado === 'completado'
                        ? 'bg-green-100 text-green-800 cursor-not-allowed'
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                  >
                    Completado
                  </button>
                  <button
                    onClick={() => cambiarEstado(selectedPedido.id, 'cancelado')}
                    disabled={selectedPedido.estado === 'cancelado'}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedPedido.estado === 'cancelado'
                        ? 'bg-red-100 text-red-800 cursor-not-allowed'
                        : 'bg-red-500 text-white hover:bg-red-600'
                    }`}
                  >
                    Cancelado
                  </button>
                </div>
              </div>

              <button
                onClick={() => setSelectedPedido(null)}
                className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
