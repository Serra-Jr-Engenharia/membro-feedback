// supabaseClient.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let supabase: SupabaseClient

// If the Supabase URL and key are provided, create a real client
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
} else {
  // If keys are missing, create a mock client for development 🔌
  console.warn('Supabase keys not found. Using mock client for offline development.')
  
  const mockSupabase = {
    from: () => ({
      select: async () => ({ data: [], error: null }),
      insert: async () => ({ data: [], error: null }),
      update: async () => ({ data: [], error: null }),
      delete: async () => ({ data: [], error: null }),
      // Add any other methods you use here, like .rpc() or .auth
    }),
    // Mock other top-level properties if your app uses them
    auth: {
        // Mock auth methods if needed
    },
  }
  
  // Cast the mock object to the SupabaseClient type to satisfy TypeScript
  supabase = mockSupabase as unknown as SupabaseClient
}

export { supabase }