// supabase/functions/get-all-notion-members/index.ts

import { Client } from '@notionhq/client'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS', // Mudei para GET
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

  try {
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      // Sem filtro! Queremos todos.
    })

    const members = response.results.map((page: unknown) => {
      // Confirme se a coluna de nome é "Nome"
      const typedPage = page as { properties: { Nome: { title: { plain_text: string }[] } } };
      return typedPage.properties.Nome.title[0].plain_text;
    })

    // Remove duplicados, se houver, e ordena
    const uniqueMembers = [...new Set(members)].sort()

    return new Response(JSON.stringify({ members: uniqueMembers }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: unknown) {
    console.error('Erro ao buscar todos os membros:', error) 
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})