'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

interface Categoria {
  id: number;
  nombre: string;
  categoria_padre_id: number | null;
}

interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria_id: number;
  subcategoria_id: number | null;
  disponible: boolean;
}

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [filtroCategoria, setFiltroCategoria] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState<Producto | null>(null);
  const [agregando, setAgregando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<number | null>(null);
  const [formulario, setFormulario] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    categoria_id: '',
    subcategoria_id: '',
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
    
    // Query optimizado sin JOIN para evitar conflictos con múltiples FK
    let query = supabase
      .from('productos')
      .select('*')
      .eq('disponible', true)
      .order('categoria_id')
      .order('nombre');

    if (filtroCategoria) {
      // Verificar si la categoría seleccionada es una subcategoría
      const categoriaSeleccionada = categorias.find(c => c.id === filtroCategoria);
      
      if (categoriaSeleccionada?.categoria_padre_id) {
        // Es una subcategoría, buscar por subcategoria_id
        query = query.eq('subcategoria_id', filtroCategoria);
      } else {
        // Es categoría principal, buscar por categoria_id O subcategoria_id
        // Para mostrar productos que pertenecen a esta categoría y sus subcategorías
        query = query.or(`categoria_id.eq.${filtroCategoria},subcategoria_id.eq.${filtroCategoria}`);
      }
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

  // Obtener subcategorías de una categoría padre
  const obtenerSubcategorias = (categoriaId: string) => {
    if (!categoriaId) return [];
    return categorias.filter(c => c.categoria_padre_id === parseInt(categoriaId));
  };

  // Verificar si una categoría tiene subcategorías
  const tieneSubcategorias = (categoriaId: string) => {
    return obtenerSubcategorias(categoriaId).length > 0;
  };

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
      subcategoria_id: producto.subcategoria_id ? producto.subcategoria_id.toString() : '',
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
        subcategoria_id: formulario.subcategoria_id ? parseInt(formulario.subcategoria_id) : null,
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

  const abrirNuevoProducto = () => {
    setAgregando(true);
    setFormulario({
      nombre: '',
      descripcion: '',
      precio: '',
      categoria_id: categorias.length > 0 ? categorias[0].id.toString() : '',
      subcategoria_id: '',
      disponible: true
    });
  };

  const guardarNuevoProducto = async () => {
    if (!formulario.nombre || !formulario.precio || !formulario.categoria_id) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    const supabase = createClient();
    const { error } = await supabase
      .from('productos')
      .insert({
        nombre: formulario.nombre,
        descripcion: formulario.descripcion,
        precio: parseFloat(formulario.precio),
        categoria_id: parseInt(formulario.categoria_id),
        subcategoria_id: formulario.subcategoria_id ? parseInt(formulario.subcategoria_id) : null,
        disponible: formulario.disponible
      });

    if (error) {
      console.error('Error al crear producto:', error);
      alert('Error al crear el producto');
    } else {
      setAgregando(false);
      cargarProductos();
      alert('✅ Producto creado exitosamente');
    }
  };

  const productosPorCategoria = categorias.map(categoria => ({
    categoria,
    productos: productos.filter(p => {
      // Si es una subcategoría, buscar por subcategoria_id
      if (categoria.categoria_padre_id) {
        return p.subcategoria_id === categoria.id;
      }
      // Si es categoría principal, buscar por categoria_id
      return p.categoria_id === categoria.id && !p.subcategoria_id;
    })
  })).filter(grupo => grupo.productos.length > 0);

  // Filtrar productos según búsqueda
  const productosFiltrados = productos.filter(p => 
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.descripcion.toLowerCase().includes(busqueda.toLowerCase())
  );

  const seleccionarProducto = (producto: Producto) => {
    setProductoSeleccionado(producto.id);
    setBusqueda('');
    setMostrarResultados(false);
    setFiltroCategoria(null); // Mostrar todas las categorías
    
    // Scroll al producto después de un pequeño delay
    setTimeout(() => {
      const elemento = document.getElementById(`producto-${producto.id}`);
      if (elemento) {
        elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);

    // Quitar el highlight después de 3 segundos
    setTimeout(() => {
      setProductoSeleccionado(null);
    }, 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Productos</h1>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          {/* Buscador */}
          <div className="relative flex-1 sm:w-80 z-20">
            <input
              type="text"
              placeholder="Buscar producto..."
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setMostrarResultados(e.target.value.length > 0);
              }}
              onFocus={() => setMostrarResultados(busqueda.length > 0)}
              className="w-full px-4 py-2 pr-10 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-orange-500 dark:focus:border-orange-500 text-gray-900 dark:text-white"
            />
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            
            {/* Dropdown de resultados */}
            {mostrarResultados && productosFiltrados.length > 0 && (
              <div className="absolute z-30 w-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto">
                {productosFiltrados.slice(0, 10).map((producto) => (
                  <button
                    key={producto.id}
                    onClick={() => seleccionarProducto(producto)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🍽️</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white truncate">{producto.nombre}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{producto.descripcion}</p>
                      </div>
                      <p className="font-bold text-orange-600 dark:text-orange-400 whitespace-nowrap">
                        ${producto.precio % 1 === 0 ? producto.precio.toFixed(0) : producto.precio.toFixed(2)} <span className="text-xs">MXN</span>
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <button
            onClick={abrirNuevoProducto}
            className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-colors shadow-lg whitespace-nowrap"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Agregar Producto
          </button>
        </div>
      </div>

      {/* Cerrar dropdown si se hace clic fuera */}
      {mostrarResultados && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => setMostrarResultados(false)}
        />
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFiltroCategoria(null)}
          className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
            filtroCategoria === null
              ? 'bg-orange-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          Todas
        </button>
        {categorias.map((categoria) => (
          <button
            key={categoria.id}
            onClick={() => setFiltroCategoria(categoria.id)}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
              filtroCategoria === categoria.id
                ? 'bg-orange-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {categoria.nombre}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
        </div>
      ) : productos.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400 text-lg">No hay productos para mostrar</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filtroCategoria ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="bg-orange-500 dark:bg-orange-600 px-4 py-2">
                <h2 className="text-lg font-bold text-white">
                  {categorias.find(c => c.id === filtroCategoria)?.nombre}
                </h2>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {productos.map((producto) => (
                  <div 
                    key={producto.id} 
                    id={`producto-${producto.id}`}
                    className={`p-4 transition-all duration-300 ${
                      productoSeleccionado === producto.id
                        ? 'bg-orange-100 dark:bg-orange-900/30 ring-2 ring-orange-500'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">{producto.nombre}</h3>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${
                            producto.disponible
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {producto.disponible ? 'Disponible' : 'No disponible'}
                          </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-1.5">{producto.descripcion}</p>
                        <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                          ${producto.precio % 1 === 0 ? producto.precio.toFixed(0) : producto.precio.toFixed(2)} <span className="text-sm">MXN</span>
                        </p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => toggleDisponibilidad(producto)}
                          className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                            producto.disponible
                              ? 'bg-red-500 hover:bg-red-600 text-white'
                              : 'bg-green-500 hover:bg-green-600 text-white'
                          }`}
                        >
                          {producto.disponible ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                          onClick={() => abrirEdicion(producto)}
                          className="px-3 py-1.5 text-sm bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
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
              <div key={categoria.id} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="bg-orange-500 dark:bg-orange-600 px-4 py-2">
                  <h2 className="text-lg font-bold text-white">{categoria.nombre}</h2>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {productos.map((producto) => (
                    <div 
                      key={producto.id} 
                      id={`producto-${producto.id}`}
                      className={`p-4 transition-all duration-300 ${
                        productoSeleccionado === producto.id
                          ? 'bg-orange-100 dark:bg-orange-900/30 ring-2 ring-orange-500'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">{producto.nombre}</h3>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${
                              producto.disponible
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {producto.disponible ? 'Disponible' : 'No disponible'}
                            </span>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 text-sm mb-1.5">{producto.descripcion}</p>
                          <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                            ${producto.precio % 1 === 0 ? producto.precio.toFixed(0) : producto.precio.toFixed(2)} <span className="text-sm">MXN</span>
                          </p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => toggleDisponibilidad(producto)}
                            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                              producto.disponible
                                ? 'bg-red-500 hover:bg-red-600 text-white'
                                : 'bg-green-500 hover:bg-green-600 text-white'
                            }`}
                          >
                            {producto.disponible ? 'Desactivar' : 'Activar'}
                          </button>
                          <button
                            onClick={() => abrirEdicion(producto)}
                            className="px-3 py-1.5 text-sm bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Editar Producto</h2>
                <button
                  onClick={() => setEditando(null)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={formulario.nombre}
                    onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={formulario.descripcion}
                    onChange={(e) => setFormulario({ ...formulario, descripcion: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Precio (MXN)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formulario.precio}
                    onChange={(e) => setFormulario({ ...formulario, precio: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Categoría
                  </label>
                  <select
                    value={formulario.categoria_id}
                    onChange={(e) => {
                      setFormulario({ ...formulario, categoria_id: e.target.value, subcategoria_id: '' });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {categorias.filter(c => !c.categoria_padre_id).map((categoria) => (
                      <option key={categoria.id} value={categoria.id}>
                        {categoria.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selector de subcategoría si la categoría seleccionada tiene subcategorías */}
                {tieneSubcategorias(formulario.categoria_id) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Subcategoría
                    </label>
                    <select
                      value={formulario.subcategoria_id}
                      onChange={(e) => setFormulario({ ...formulario, subcategoria_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Sin subcategoría</option>
                      {obtenerSubcategorias(formulario.categoria_id).map((subcategoria) => (
                        <option key={subcategoria.id} value={subcategoria.id}>
                          {subcategoria.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="disponible"
                    checked={formulario.disponible}
                    onChange={(e) => setFormulario({ ...formulario, disponible: e.target.checked })}
                    className="w-4 h-4 text-orange-600 border-gray-300 dark:border-gray-600 rounded focus:ring-orange-500"
                  />
                  <label htmlFor="disponible" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Disponible
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setEditando(null)}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={guardarCambios}
                  className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para agregar producto */}
      {agregando && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">🆕 Nuevo Producto</h2>
                <button
                  onClick={() => setAgregando(false)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={formulario.nombre}
                    onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })}
                    placeholder="Ej: Tacos de Asada"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={formulario.descripcion}
                    onChange={(e) => setFormulario({ ...formulario, descripcion: e.target.value })}
                    placeholder="Descripción del producto"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Precio (MXN) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formulario.precio}
                    onChange={(e) => setFormulario({ ...formulario, precio: e.target.value })}
                    placeholder="95.00"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Categoría *
                  </label>
                  <select
                    value={formulario.categoria_id}
                    onChange={(e) => {
                      setFormulario({ ...formulario, categoria_id: e.target.value, subcategoria_id: '' });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Selecciona una categoría</option>
                    {categorias.filter(c => !c.categoria_padre_id).map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selector de subcategoría si la categoría seleccionada tiene subcategorías */}
                {tieneSubcategorias(formulario.categoria_id) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Subcategoría
                    </label>
                    <select
                      value={formulario.subcategoria_id}
                      onChange={(e) => setFormulario({ ...formulario, subcategoria_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Sin subcategoría</option>
                      {obtenerSubcategorias(formulario.categoria_id).map((subcategoria) => (
                        <option key={subcategoria.id} value={subcategoria.id}>
                          {subcategoria.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="disponible-nuevo"
                    checked={formulario.disponible}
                    onChange={(e) => setFormulario({ ...formulario, disponible: e.target.checked })}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <label htmlFor="disponible-nuevo" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Producto disponible
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setAgregando(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={guardarNuevoProducto}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium transition-colors"
                >
                  ✅ Crear Producto
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
