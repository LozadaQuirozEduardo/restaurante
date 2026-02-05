'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Cliente {
  id: number;
  telefono: string;
  nombre: string;
  created_at: string;
}

interface ClienteConEstadisticas extends Cliente {
  total_pedidos: number;
  total_gastado: number;
  ultimo_pedido: string | null;
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<ClienteConEstadisticas[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCliente, setSelectedCliente] = useState<ClienteConEstadisticas | null>(null);
  const [pedidosCliente, setPedidosCliente] = useState<any[]>([]);

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    setLoading(true);
    const supabase = createClient();

    // Cargar clientes
    const { data: clientesData, error: clientesError } = await supabase
      .from('clientes')
      .select('*')
      .order('created_at', { ascending: false });

    if (clientesError) {
      console.error('Error al cargar clientes:', clientesError);
      setLoading(false);
      return;
    }

    // Cargar estadísticas de cada cliente
    const clientesConEstadisticas: ClienteConEstadisticas[] = await Promise.all(
      (clientesData || []).map(async (cliente: Cliente) => {
        const { data: pedidos } = await supabase
          .from('pedidos')
          .select('total, created_at')
          .eq('cliente_id', cliente.id)
          .eq('estado', 'completado');

        const totalPedidos = pedidos?.length || 0;
        const totalGastado = pedidos?.reduce((sum: number, p: any) => sum + p.total, 0) || 0;
        const ultimoPedido = pedidos && pedidos.length > 0 
          ? pedidos.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
          : null;

        return {
          ...cliente,
          total_pedidos: totalPedidos,
          total_gastado: totalGastado,
          ultimo_pedido: ultimoPedido
        };
      })
    );

    setClientes(clientesConEstadisticas);
    setLoading(false);
  };

  const verDetalles = async (cliente: ClienteConEstadisticas) => {
    setSelectedCliente(cliente);
    
    const supabase = createClient();
    const { data: pedidos } = await supabase
      .from('pedidos')
      .select(`
        *,
        pedido_detalles (
          producto_nombre,
          cantidad,
          precio_unitario
        )
      `)
      .eq('cliente_id', cliente.id)
      .order('created_at', { ascending: false });

    setPedidosCliente(pedidos || []);
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Clientes</h1>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Total de clientes: <span className="font-bold text-gray-900 dark:text-white">{clientes.length}</span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
        </div>
      ) : clientes.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400 text-lg">No hay clientes registrados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clientes.map((cliente) => (
            <div
              key={cliente.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{cliente.nombre}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{cliente.telefono}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                  <span className="text-2xl">👤</span>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Pedidos completados:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{cliente.total_pedidos}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Total gastado:</span>
                  <span className="font-semibold text-orange-600 dark:text-orange-400">
                    ${cliente.total_gastado.toFixed(2)} MXN
                  </span>
                </div>
                {cliente.ultimo_pedido && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Último pedido:</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {format(new Date(cliente.ultimo_pedido), 'd MMM', { locale: es })}
                    </span>
                  </div>
                )}
              </div>

              <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Cliente desde {format(new Date(cliente.created_at), "d 'de' MMMM 'de' yyyy", { locale: es })}
              </div>

              <button
                onClick={() => verDetalles(cliente)}
                className="w-full px-4 py-2 bg-orange-500 dark:bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-600 dark:hover:bg-orange-700 transition-colors"
              >
                Ver historial
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal de detalles del cliente */}
      {selectedCliente && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedCliente.nombre}</h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">{selectedCliente.telefono}</p>
                </div>
                <button
                  onClick={() => setSelectedCliente(null)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Estadísticas del cliente */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-100 dark:border-orange-800">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total de Pedidos</p>
                  <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{selectedCliente.total_pedidos}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-800">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Gastado</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    ${selectedCliente.total_gastado.toFixed(2)}
                  </p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Cliente desde</p>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {format(new Date(selectedCliente.created_at), 'MMM yyyy', { locale: es })}
                  </p>
                </div>
              </div>

              {/* Historial de pedidos */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Historial de Pedidos</h3>
                {pedidosCliente.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">No hay pedidos registrados</p>
                ) : (
                  <div className="space-y-4">
                    {pedidosCliente.map((pedido) => (
                      <div key={pedido.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">Pedido #{pedido.id}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {format(new Date(pedido.created_at), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              pedido.estado === 'completado' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                              pedido.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                              'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {pedido.estado.charAt(0).toUpperCase() + pedido.estado.slice(1)}
                            </span>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2">
                              {pedido.tipo_entrega === 'delivery' ? '🚚 Delivery' : '🏪 Recoger'}
                            </p>
                          </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 mb-3 border border-gray-200 dark:border-gray-600">
                          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Productos:</p>
                          <ul className="space-y-1">
                            {pedido.pedido_detalles.map((detalle: any, idx: number) => (
                              <li key={idx} className="text-sm text-gray-700 dark:text-gray-300 flex justify-between">
                                <span>{detalle.cantidad}x {detalle.producto_nombre}</span>
                                <span className="font-medium">
                                  ${(detalle.cantidad * detalle.precio_unitario).toFixed(2)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {pedido.notas && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <span className="font-medium">Notas:</span> {pedido.notas}
                          </p>
                        )}

                        <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-600">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Total:</span>
                          <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                            ${pedido.total.toFixed(2)} MXN
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedCliente(null)}
                className="w-full mt-6 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
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
