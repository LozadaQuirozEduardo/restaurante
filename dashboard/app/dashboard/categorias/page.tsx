'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic';

interface Categoria {
  id: number
  nombre: string
  descripcion: string | null
  icono: string | null
  orden: number
  categoria_padre_id: number | null
  subcategorias?: Categoria[]
}

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState<Categoria | null>(null)
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    icono: '',
    orden: 0,
    categoria_padre_id: null as number | null
  })

  useEffect(() => {
    cargarCategorias()
  }, [])

  async function cargarCategorias() {
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .order('orden', { ascending: true })

    if (data) {
      // Organizar en jerarquía
      const principales = data.filter(cat => !cat.categoria_padre_id)
      const conSubcategorias = principales.map(cat => ({
        ...cat,
        subcategorias: data.filter(sub => sub.categoria_padre_id === cat.id)
      }))
      setCategorias(conSubcategorias)
    }
    setLoading(false)
  }

  async function guardarCategoria() {
    const datos = {
      ...formData,
      categoria_padre_id: formData.categoria_padre_id === 0 ? null : formData.categoria_padre_id
    }

    if (editando) {
      await supabase
        .from('categorias')
        .update(datos)
        .eq('id', editando.id)
    } else {
      await supabase
        .from('categorias')
        .insert(datos)
    }

    setShowModal(false)
    setEditando(null)
    setFormData({ nombre: '', descripcion: '', icono: '', orden: 0, categoria_padre_id: null })
    cargarCategorias()
  }

  async function eliminarCategoria(id: number) {
    if (confirm('¿Estás seguro de eliminar esta categoría? Los productos quedarán sin categoría.')) {
      await supabase
        .from('categorias')
        .delete()
        .eq('id', id)
      
      cargarCategorias()
    }
  }

  function abrirModal(categoria?: Categoria) {
    if (categoria) {
      setEditando(categoria)
      setFormData({
        nombre: categoria.nombre,
        descripcion: categoria.descripcion || '',
        icono: categoria.icono || '',
        orden: categoria.orden,
        categoria_padre_id: categoria.categoria_padre_id
      })
    } else {
      setEditando(null)
      setFormData({ nombre: '', descripcion: '', icono: '', orden: 0, categoria_padre_id: null })
    }
    setShowModal(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Categorías</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Gestiona categorías y subcategorías del menú</p>
        </div>
        <button
          onClick={() => abrirModal()}
          className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors"
        >
          + Nueva Categoría
        </button>
      </div>

      {/* Lista de categorías */}
      <div className="space-y-4">
        {categorias.map((cat) => (
          <div key={cat.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Categoría Principal */}
            <div className="p-6 flex items-center justify-between bg-gradient-to-r from-orange-50 to-transparent dark:from-orange-900/20">
              <div className="flex items-center gap-4">
                <span className="text-4xl">{cat.icono || '📁'}</span>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{cat.nombre}</h3>
                  {cat.descripcion && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{cat.descripcion}</p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Orden: {cat.orden}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setFormData({
                      nombre: '',
                      descripcion: '',
                      icono: '',
                      orden: (cat.subcategorias?.length || 0) + 1,
                      categoria_padre_id: cat.id
                    })
                    setShowModal(true)
                  }}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium"
                >
                  + Subcategoría
                </button>
                <button
                  onClick={() => abrirModal(cat)}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-medium"
                >
                  Editar
                </button>
                <button
                  onClick={() => eliminarCategoria(cat.id)}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium"
                >
                  Eliminar
                </button>
              </div>
            </div>

            {/* Subcategorías */}
            {cat.subcategorias && cat.subcategorias.length > 0 && (
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Subcategorías:</p>
                <div className="space-y-2">
                  {cat.subcategorias.map((subcat) => (
                    <div key={subcat.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{subcat.icono || '📂'}</span>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{subcat.nombre}</p>
                          {subcat.descripcion && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">{subcat.descripcion}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => abrirModal(subcat)}
                          className="px-3 py-1 bg-gray-400 hover:bg-gray-500 text-white rounded text-sm"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => eliminarCategoria(subcat.id)}
                          className="px-3 py-1 bg-red-400 hover:bg-red-500 text-white rounded text-sm"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {editando ? 'Editar Categoría' : 'Nueva Categoría'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  placeholder="ej: Bebidas"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descripción
                </label>
                <input
                  type="text"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  placeholder="ej: Bebidas variadas"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Icono (emoji)
                </label>
                <input
                  type="text"
                  value={formData.icono}
                  onChange={(e) => setFormData({ ...formData, icono: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  placeholder="ej: 🥤"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Orden
                </label>
                <input
                  type="number"
                  value={formData.orden}
                  onChange={(e) => setFormData({ ...formData, orden: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Categoría Padre (para subcategorías)
                </label>
                <select
                  value={formData.categoria_padre_id || 0}
                  onChange={(e) => setFormData({ ...formData, categoria_padre_id: parseInt(e.target.value) || null })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  <option value={0}>Ninguna (Categoría Principal)</option>
                  {categorias.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={guardarCategoria}
                className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium"
              >
                Guardar
              </button>
              <button
                onClick={() => {
                  setShowModal(false)
                  setEditando(null)
                }}
                className="flex-1 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
