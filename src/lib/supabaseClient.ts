import { createClient } from '@supabase/supabase-js'

console.log("supabaseClient: Lendo .env...")
console.log("supabaseClient: VITE_SUPABASE_URL lido:", import.meta.env.VITE_SUPABASE_URL)
console.log("supabaseClient: VITE_SUPABASE_ANON_KEY lido:", import.meta.env.VITE_SUPABASE_ANON_KEY ? "****** (Chave Encontrada)" : undefined)

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("ERRO CRÍTICO: Variáveis VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não estão definidas no .env. Você reiniciou o servidor (npm run dev)?")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false 
  }
})