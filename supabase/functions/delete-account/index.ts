import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')!
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // 1. Pega o usuário que clicou no botão (quem está logado)
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) throw new Error('Não autorizado: Você precisa estar logado.')

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 2. Verifica se um ID de terceiro foi enviado no body da requisição
    let targetUserId = user.id
    try {
      const body = await req.json()
      if (body?.targetUserId) {
        targetUserId = body.targetUserId
      }
    } catch (_) {
      // Se o body estiver vazio, segue o fluxo mantendo o targetUserId como o do próprio usuário
    }

    // 3. Trava de Segurança: Se estiver tentando apagar outra pessoa, TEM que ser Admin
    if (targetUserId !== user.id) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('user_role')
        .eq('id', user.id)
        .single()

      if (profile?.user_role !== 'Admin') {
        throw new Error('Acesso negado: Somente o setor de RH pode excluir contas de terceiros.')
      }
    }

    console.log(`Excluindo usuário ID: ${targetUserId} (Solicitado por: ${user.id})`)

    // 4. Executa a exclusão com privilégios máximos
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId)
    if (deleteError) throw deleteError

    return new Response(JSON.stringify({ message: 'Conta excluída com sucesso.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Erro ao excluir conta:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400, 
    })
  }
})