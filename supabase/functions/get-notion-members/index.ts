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

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  
  const { sector } = await req.json()
  if (!sector) {
    return new Response(JSON.stringify({ error: 'Setor é obrigatório' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  console.log(`Buscando membros para o setor: ${sector}`)

  try {
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      
      filter: {
        property: 'Assessoria', 
        multi_select: {
          contains: sector, 
        },
      },
    })

    const members = response.results.map((page: any) => {
      return page.properties.Nome.title[0].plain_text 
    })

    console.log(`Encontrados ${members.length} membros.`)

    return new Response(JSON.stringify({ members }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Erro ao buscar Notion:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})