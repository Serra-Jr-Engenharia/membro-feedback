import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Link, useNavigate } from 'react-router-dom'

const assessorias = [
  'Computação', 'Mecânica', 'SerraLab', 'Comercial', 'Marketing'
]

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  const [userRole, setUserRole] = useState('Membro') 
  
  const [notionName, setNotionName] = useState('')
  const [projectName, setProjectName] = useState('')
  const [assessoria, setAssessoria] = useState(assessorias[0]) 
  
  const [allMembers, setAllMembers] = useState<string[]>([])
  const [loadingMembers, setLoadingMembers] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchAllMembers = async () => {
      setLoadingMembers(true)
      const { data, error } = await supabase.functions.invoke(
        'get-all-notion-members', 
        { method: 'GET' }
      )
      if (error) {
        console.error('Erro ao buscar lista:', error)
      } else {
        setAllMembers(data.members || [])
        if (data.members && data.members.length > 0) {
            setNotionName(data.members[0])
        }
      }
      setLoadingMembers(false)
    }
    fetchAllMembers()
  }, [])

 const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (userRole === 'Gestor' && !projectName.trim()) {
        setError('O nome do projeto é obrigatório para Gestores.')
        setLoading(false)
        return
    }

    const projectToSave = userRole === 'Gestor' ? projectName : null;

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          notion_name: notionName,
          user_role: userRole,
          project_name: projectToSave,
          assessoria: assessoria,
        }
      }
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (!authData.user) {
      setError('Erro ao criar usuário. Tente novamente.')
      setLoading(false)
      return
    }

    setLoading(false)
    alert('Cadastro realizado com sucesso! Por favor, faça o login.')
    navigate('/login')
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-azulEscuroPage font-poppins text-gray-200">
      <form onSubmit={handleSignUp} className="p-8 bg-azulEscuroCard border border-azulClaroBorder rounded shadow-md w-96 flex flex-col gap-4">
        <h2 className="text-2xl font-bold mb-2 text-center text-white">Cadastrar</h2>

        {error && <div className="p-3 text-sm text-red-800 bg-red-100 rounded">{error}</div>}

        {/* --- Seleção de Nome (do Notion) --- */}
        <div>
            <label className="block text-sm font-medium text-gray-300">Seu Nome (como no Notion)</label>
            {loadingMembers ? (
                <p className="text-xs text-gray-400 mt-1">Carregando lista...</p>
            ) : (
                <select 
                    value={notionName} 
                    onChange={(e) => setNotionName(e.target.value)}
                    className="w-full p-2 border border-azulClaroBorder rounded bg-azulEscuroPage text-white mt-1"
                >
                    {allMembers.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
            )}
        </div>

        {/* --- Email e Senha --- */}
        <div>
            <label className="block text-sm font-medium text-gray-300">Email</label>
            <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full p-2 border border-azulClaroBorder rounded bg-azulEscuroPage text-white mt-1" 
                required 
            />
        </div>
        
        <div>
            <label className="block text-sm font-medium text-gray-300">Senha</label>
            <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full p-2 border border-azulClaroBorder rounded bg-azulEscuroPage text-white mt-1" 
                required 
            />
        </div>
        
        {/* --- Função --- */}
        <div>
            <label className="block text-sm font-medium text-gray-300">Função:</label>
            <select 
                value={userRole} 
                onChange={(e) => setUserRole(e.target.value)}
                className="w-full p-2 border border-azulClaroBorder rounded bg-azulEscuroPage text-white mt-1"
            >
                <option value="Membro">Membro</option>
                <option value="Gestor">Gestor de Projeto</option>
                <option value="Diretor">Diretor de Setor</option>
            </select>
        </div>
        
        {/* --- Campos Dinâmicos --- */}
        
        {/* Só mostra input de projeto para GESTOR */}
        {userRole === 'Gestor' && (
          <div>
            <label className="block text-sm font-medium text-gray-300">
                Qual projeto você gere?
            </label>
            <input
                type="text"
                placeholder="Ex: Projeto Feedback"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full p-2 border border-azulClaroBorder rounded bg-azulEscuroPage text-white mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">Deve ser idêntico à tag no Notion.</p>
          </div>
        )}

        {/* Assessoria (Sempre visível) */}
        <div>
            <label className="block text-sm font-medium text-gray-300">Sua Assessoria:</label>
            <select 
                value={assessoria} 
                onChange={(e) => setAssessoria(e.target.value)}
                className="w-full p-2 border border-azulClaroBorder rounded bg-azulEscuroPage text-white mt-1"
            >
                {assessorias.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
        </div>

        <button 
            type="submit" 
            disabled={loading || loadingMembers} 
            className="w-full p-2 mt-4 text-white font-bold bg-laranja rounded hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Cadastrando...' : 'Cadastrar'}
        </button>

        <p className="text-center text-sm mt-2">
          Já tem conta? <Link to="/login" className="text-azulClaroCheck hover:underline">Entrar</Link>
        </p>
      </form>
    </div>
  )
}