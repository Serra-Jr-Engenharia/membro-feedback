// supabase/functions/get-notion-members/index.ts

import { Client } from '@notionhq/client'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const notion = new Client({
  auth: Deno.env.get('NOTION_SECRET_KEY'),
})
const DATABASE_ID = Deno.env.get('NOTION_DATABASE_ID')!

Deno.serve(async (req) => {
  // 1. Lidar com CORS (Preflight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. Pegar os dados novos do corpo da requisição
    const { filter_type, filter_value, exclude_name, user_name } = await req.json()

    console.log(`Request: Tipo=${filter_type}, Valor=${filter_value}, User=${user_name}`)

    let notionFilter: any;

    // --- CENÁRIO 1: DIRETOR (Filtra por Assessoria) ---
    if (filter_type === 'Diretor') {
      if (!filter_value) throw new Error('Assessoria é obrigatória para Diretor')
      
      notionFilter = {
        property: 'Assessoria', // Confirme se o nome da coluna no Notion é esse
        multi_select: { contains: filter_value },
      }
    } 
    // --- CENÁRIO 2: GESTOR (Filtra por Projeto) ---
    else if (filter_type === 'Gestor') {
      if (!filter_value) throw new Error('Projeto é obrigatório para Gestor')

      notionFilter = {
        property: 'Projetos', // Confirme se criou essa coluna no Notion
        multi_select: { contains: filter_value },
      }
    } 
    // --- CENÁRIO 3: MEMBRO (Descobre projetos automaticamente) ---
    else if (filter_type === 'Membro') {
      if (!user_name) throw new Error('Nome do usuário é obrigatório para Membro')

      // A. Busca o próprio membro no Notion para ver seus projetos
      console.log(`Buscando projetos de: ${user_name}`)
      const memberQuery = await notion.databases.query({
        database_id: DATABASE_ID,
        filter: {
          property: 'Nome', // Confirme se o nome da coluna é "Nome"
          title: { equals: user_name }
        }
      });

      if (memberQuery.results.length === 0) {
        // Se não achou o membro, retorna lista vazia (sem erro)
        console.log('Membro não encontrado no Notion')
        return new Response(JSON.stringify({ members: [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // B. Extrai a lista de projetos dele
      const memberPage: any = memberQuery.results[0];
      // Atenção: A coluna deve ser 'Projetos' e do tipo Multi-Select
      const projects = memberPage.properties.Projetos?.multi_select.map((p: any) => p.name) || [];

      if (projects.length === 0) {
        return new Response(JSON.stringify({ members: [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      console.log(`Projetos encontrados: ${projects.join(', ')}`)

      // C. Busca TODOS os membros que participam de QUALQUER um desses projetos
      const orFilter = projects.map((proj: string) => ({
        property: 'Projetos',
        multi_select: { contains: proj }
      }));

      notionFilter = { or: orFilter };
    } 
    else {
      // Tipo desconhecido
      return new Response(JSON.stringify({ error: 'Tipo de usuário inválido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // --- 3. EXECUTAR A BUSCA FINAL ---
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      filter: notionFilter,
    })

    const allMembers = response.results.map((page: any) => {
      return page.properties.Nome.title[0]?.plain_text || "Sem Nome"
    })

    // Remove duplicatas e o próprio nome
    const uniqueMembers = [...new Set(allMembers)].filter(name => name !== exclude_name);

    return new Response(JSON.stringify({ members: uniqueMembers }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Erro na Edge Function:', error)
    return new Response(JSON.stringify({ error: error.message || 'Erro interno' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})