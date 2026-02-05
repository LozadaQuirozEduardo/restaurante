import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}

// Para compatibilidad con código existente
export const supabase = {
  get auth() {
    return createClient().auth
  },
  get from() {
    return createClient().from.bind(createClient())
  }
}
