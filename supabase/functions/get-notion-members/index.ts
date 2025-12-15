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

  try {
    const { filter_type, filter_value, exclude_name, user_name } = await req.json()

    console.log(`Request: Tipo=${filter_type}, Valor=${filter_value}, User=${user_name}`)

    let notionFilter: any;
    let detectedProject: string | null = null; 

    if (filter_type === 'Diretor') {
      if (!filter_value) throw new Error('Assessoria é obrigatória para Diretor')
      notionFilter = {
        property: 'Assessoria',
        multi_select: { contains: filter_value },
      }
    } 
    else if (filter_type === 'Gestor') {
      if (!filter_value) throw new Error('Projeto é obrigatório para Gestor')
      notionFilter = {
        property: 'Projetos',
        multi_select: { contains: filter_value },
      }
    } 
    else if (filter_type === 'Membro') {
      if (!user_name) throw new Error('Nome do usuário é obrigatório para Membro')

      const memberQuery = await notion.databases.query({
        database_id: DATABASE_ID,
        filter: {
          property: 'Nome',
          title: { equals: user_name }
        }
      });

      if (memberQuery.results.length === 0) {
        return new Response(JSON.stringify({ members: [], project: null }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const memberPage: any = memberQuery.results[0];
      const projects = memberPage.properties.Projetos?.multi_select.map((p: any) => p.name) || [];

      if (projects.length === 0) {
        return new Response(JSON.stringify({ members: [], project: null }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      detectedProject = projects[0];
      console.log(`Projeto detectado para ${user_name}: ${detectedProject}`);

      const orFilter = projects.map((proj: string) => ({
        property: 'Projetos',
        multi_select: { contains: proj }
      }));

      notionFilter = { or: orFilter };
    } 
    else {
      return new Response(JSON.stringify({ error: 'Tipo de usuário inválido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      filter: notionFilter,
    })

    const allMembers = response.results.map((page: any) => {
      return page.properties.Nome.title[0]?.plain_text || "Sem Nome"
    })

    const uniqueMembers = [...new Set(allMembers)].filter(name => name !== exclude_name);

    return new Response(JSON.stringify({ 
        members: uniqueMembers, 
        detected_project: detectedProject 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Erro na Edge Function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})