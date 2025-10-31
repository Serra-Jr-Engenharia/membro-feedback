import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

export default async function handler(req, res) {
  try {
    const response = await notion.databases.query({
      database_id: databaseId,
    });

    const members = response.results.map(page => {
      return {
        id: page.id,
        name: page.properties.Nome.title[0]?.plain_text,
        sector: page.properties.Setor.select?.name,
      };
    });

    res.status(200).json({ members });
  } catch (error) {
    console.error('Erro ao buscar dados do Notion:', error);
    res.status(500).json({ error: 'Falha ao buscar dados do Notion' });
  }
}