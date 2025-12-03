// supabase/functions/delete-account/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // 1. Lidar com CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. Criar um cliente Supabase "Normal" para ver QUEM está chamando
    const authHeader = req.headers.get('Authorization')!
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Pega o usuário logado (token JWT)
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      throw new Error('Não autorizado: Você precisa estar logado para excluir sua conta.')
    }

    // 3. Criar um cliente Supabase "Admin" (Service Role) para DELETAR
    // A chave SERVICE_ROLE_KEY tem poder total (cuidado!)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log(`Excluindo usuário: ${user.id} (${user.email})`)

    // Deleta o usuário da tabela auth.users
    // (Isso deve apagar o perfil em cascata se sua FK estiver configurada com ON DELETE CASCADE,
    // mas mesmo se não estiver, o login será removido).
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
      user.id
    )

    if (deleteError) throw deleteError

    return new Response(JSON.stringify({ message: 'Conta excluída com sucesso.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Erro ao excluir conta:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400, // Bad Request
    })
  }
})