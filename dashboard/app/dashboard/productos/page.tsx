'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

interface Categoria {
  id: number;
  nombre: string;
}

interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria_id: number;
  disponible: boolean;
  categorias: {
    nombre: string;
  };
}

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [filtroCategoria, setFiltroCategoria] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState<Producto | null>(null);
  const [formulario, setFormulario] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    categoria_id: '',
    disponible: true
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    const supabase = createClient();

    // Cargar categorías
    const { data: categoriasData } = await supabase
      .from('categorias')
      .select('*')
      .order('nombre');

    if (categoriasData) {
      setCategorias(categoriasData);
    }

    // Cargar productos
    cargarProductos();
  };

  const cargarProductos = async () => {
    const supabase = createClient();
    
    let query = supabase
      .from('productos')
      .select('*, categorias(nombre)')
      .order('categoria_id')
      .order('nombre');

    if (filtroCategoria) {
      query = query.eq('categoria_id', filtroCategoria);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error al cargar productos:', error);
    } else {
      setProductos(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!loading) {
      cargarProductos();
    }
  }, [filtroCategoria]);

  const toggleDisponibilidad = async (producto: Producto) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('productos')
      .update({ disponible: !producto.disponible })
      .eq('id', producto.id);

    if (error) {
      console.error('Error al cambiar disponibilidad:', error);
      alert('Error al cambiar la disponibilidad');
    } else {
      cargarProductos();
    }
  };

  const abrirEdicion = (producto: Producto) => {
    setEditando(producto);
    setFormulario({
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: producto.precio.toString(),
      categoria_id: producto.categoria_id.toString(),
      disponible: producto.disponible
    });
  };

  const guardarCambios = async () => {
    if (!editando) return;

    const supabase = createClient();
    const { error } = await supabase
      .from('productos')
      .update({
        nombre: formulario.nombre,
        descripcion: formulario.descripcion,
        precio: parseFloat(formulario.precio),
        categoria_id: parseInt(formulario.categoria_id),
        disponible: formulario.disponible
      })
      .eq('id', editando.id);

    if (error) {
      console.error('Error al actualizar producto:', error);
      alert('Error al guardar los cambios');
    } else {
      setEditando(null);
      cargarProductos();
    }
  };

  const productosPorCategoria = categorias.map(categoria => ({
    categoria,
    productos: productos.filter(p => p.categoria_id === categoria.id)
  })).filter(grupo => grupo.productos.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Productos</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setFiltroCategoria(null)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filtroCategoria === null
                ? 'bg-orange-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Todas
          </button>
          {categorias.map((categoria) => (
            <button
              key={categoria.id}
              onClick={() => setFiltroCategoria(categoria.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filtroCategoria === categoria.id
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {categoria.nombre}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
        </div>
      ) : productos.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 text-lg">No hay productos para mostrar</p>
        </div>
      ) : (
        <div className="space-y-8">
          {filtroCategoria ? (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-orange-500 px-6 py-3">
                <h2 className="text-xl font-bold text-white">
                  {categorias.find(c => c.id === filtroCategoria)?.nombre}
                </h2>
              </div>
              <div className="divide-y divide-gray-200">
                {productos.map((producto) => (
                  <div key={producto.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{producto.nombre}</h3>
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            producto.disponible
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {producto.disponible ? 'Disponible' : 'No disponible'}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{producto.descripcion}</p>
                        <p className="text-2xl font-bold text-orange-600">
                          ${producto.precio % 1 === 0 ? producto.precio.toFixed(0) : producto.precio.toFixed(2)} MXN
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleDisponibilidad(producto)}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            producto.disponible
                              ? 'bg-red-500 text-white hover:bg-red-600'
                              : 'bg-green-500 text-white hover:bg-green-600'
                          }`}
                        >
                          {producto.disponible ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                          onClick={() => abrirEdicion(producto)}
                          className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
                        >
                          Editar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            productosPorCategoria.map(({ categoria, productos }) => (
              <div key={categoria.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="bg-orange-500 px-6 py-3">
                  <h2 className="text-xl font-bold text-white">{categoria.nombre}</h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {productos.map((producto) => (
                    <div key={producto.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{producto.nombre}</h3>
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                              producto.disponible
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {producto.disponible ? 'Disponible' : 'No disponible'}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm mb-2">{producto.descripcion}</p>
                          <p className="text-2xl font-bold text-orange-600">
                            ${producto.precio % 1 === 0 ? producto.precio.toFixed(0) : producto.precio.toFixed(2)} MXN
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleDisponibilidad(producto)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                              producto.disponible
                                ? 'bg-red-500 text-white hover:bg-red-600'
                                : 'bg-green-500 text-white hover:bg-green-600'
                            }`}
                          >
                            {producto.disponible ? 'Desactivar' : 'Activar'}
                          </button>
                          <button
                            onClick={() => abrirEdicion(producto)}
                            className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
                          >
                            Editar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal de edición */}
      {editando && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Editar Producto</h2>
                <button
                  onClick={() => setEditando(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={formulario.nombre}
                    onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={formulario.descripcion}
                    onChange={(e) => setFormulario({ ...formulario, descripcion: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio (MXN)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formulario.precio}
                    onChange={(e) => setFormulario({ ...formulario, precio: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría
                  </label>
                  <select
                    value={formulario.categoria_id}
                    onChange={(e) => setFormulario({ ...formulario, categoria_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {categorias.map((categoria) => (
                      <option key={categoria.id} value={categoria.id}>
                        {categoria.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="disponible"
                    checked={formulario.disponible}
                    onChange={(e) => setFormulario({ ...formulario, disponible: e.target.checked })}
                    className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <label htmlFor="disponible" className="ml-2 text-sm font-medium text-gray-700">
                    Disponible
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setEditando(null)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={guardarCambios}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
