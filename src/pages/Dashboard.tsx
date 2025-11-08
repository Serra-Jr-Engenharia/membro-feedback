import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient' 
import { useAuth } from '../hooks/AuthProvider' 

export default function Dashboard() {
  const { profile, logout } = useAuth() 
  const [members, setMembers] = useState<string[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)

  useEffect(() => {
    if (profile && profile.sector) {
      setLoadingMembers(true)
      const fetchMembers = async () => {
        

        const { data, error } = await supabase.functions.invoke(
          'get-notion-members',
          {
            method: 'POST',
            body: { sector: profile.sector },
          }
        )
        
        if (error) {
          console.error('Erro ao buscar membros:', error)
          alert('Não foi possível carregar os membros do Notion.')
        } else {
          setMembers(data.members)
        }
        setLoadingMembers(false)
      }
      fetchMembers()
    }
  }, [profile])

  const handleLogout = () => {
    logout()
  }

  const handleEvaluate = async (memberName: string) => {
    if (!profile) return;

    const { error } = await supabase
      .from('evaluations') 
      .insert({
          director_id: profile.id, 
          member_name: memberName,
          week_of: new Date().toISOString().split('T')[0],
          aspect_communication: 5, 
          aspect_proactivity: 4, 
          comments: 'Exemplo de avaliação.', 
       })

    if (error) alert('Erro ao salvar: ' + error.message)
    else alert(`Avaliação de ${memberName} salva!`)
  }

  if (!profile) return <div>Redirecionando...</div>

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Olá, {profile.full_name}</h1>
          <p className="text-xl">Setor: <span className="font-semibold">{profile.sector}</span></p>
        </div>
        <button 
          onClick={handleLogout}
          className="px-4 py-2 text-sm text-white bg-red-600 rounded hover:bg-red-700"
        >
          Sair
        </button>
      </div>

      <h2 className="mt-8 text-2xl font-bold">Membros para Avaliar</h2>
      {loadingMembers ? (
        <p>Carregando membros do Notion...</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {members.map((name) => (
            <li key={name} className="flex justify-between items-center p-4 bg-white rounded shadow">
              <span className="text-lg">{name}</span>
              <button
                onClick={() => handleEvaluate(name)}
                className="px-4 py-2 text-sm text-white bg-green-600 rounded hover:bg-green-700"
              >
                Avaliar (Exemplo)
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}