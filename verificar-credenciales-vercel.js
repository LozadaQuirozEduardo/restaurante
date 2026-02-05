require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://anzeikjpudoimvwpwlac.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuemVpa2pwdWRvaW12d3B3bGFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NzY1NDIsImV4cCI6MjA4NTE1MjU0Mn0.bUaFisBUMcZ3GZN9ohzwf3iMc0Aka7D_lrpxV3RTjiw'

console.log('🔍 Verificando credenciales de Supabase...')
console.log('URL:', supabaseUrl)
console.log('Key:', supabaseAnonKey.substring(0, 20) + '...')

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function verificar() {
  try {
    console.log('\n📦 Consultando productos...')
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('disponible', true)
      .limit(5)

    if (error) {
      console.error('❌ Error:', error)
      return
    }

    console.log(`✅ Productos encontrados: ${data.length}`)
    data.forEach(p => {
      console.log(`   - ${p.nombre} ($${p.precio})`)
    })

    console.log('\n🏷️ Consultando categorías...')
    const { data: categorias, error: catError } = await supabase
      .from('categorias')
      .select('*')
      .limit(5)

    if (catError) {
      console.error('❌ Error:', catError)
      return
    }

    console.log(`✅ Categorías encontradas: ${categorias.length}`)
    categorias.forEach(c => {
      console.log(`   - ${c.nombre}`)
    })

  } catch (err) {
    console.error('❌ Error general:', err)
  }
}

verificar()
