import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Link, useNavigate } from 'react-router-dom'

const assessorias = [
  'Computação', 'Mecânica', 'SerraLab', 'Comercial', 'Marketing'
]

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [userRole, setUserRole] = useState('Gestor')
  
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
        setError('Falha ao carregar lista de membros do Notion.')
        console.error(error)
      } else {
        setAllMembers(data.members)
        setNotionName(data.members[0]) 
      }
      setLoadingMembers(false)
    }
    fetchAllMembers()
  }, [])

 const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          notion_name: notionName,
          user_role: userRole,
          project_name: userRole === 'Gestor' ? projectName : null,
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
      setError('Usuário não foi criado, tente novamente.')
      setLoading(false)
      return
    }

    setLoading(false)
    alert('Cadastro realizado com sucesso! Por favor, faça o login.')
    navigate('/login')
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleSignUp} className="p-8 bg-white rounded shadow-md w-96">
        <h2 className="text-2xl font-bold mb-4">Cadastrar</h2>

        {error && <div className="p-3 mb-4 text-red-800 bg-red-100 rounded">{error}</div>}

        {/* --- Seleção do Nome (do Notion) --- */}
        <label className="block text-sm font-medium text-gray-700">Seu Nome (como está no Notion)</label>
        {loadingMembers ? (
          <p>Carregando membros...</p>
        ) : (
          <select 
            value={notionName} 
            onChange={(e) => setNotionName(e.target.value)}
            className="w-full p-2 mb-4 border rounded bg-white"
          >
            {allMembers.map(name => <option key={name} value={name}>{name}</option>)}
          </select>
        )}

        <input
          type="email"
          placeholder="Email de Login"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
        />
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
        />
        
        <label className="block text-sm font-medium text-gray-700">Eu sou:</label>
        <select 
          value={userRole} 
          onChange={(e) => setUserRole(e.target.value)}
          className="w-full p-2 mb-4 border rounded bg-white"
        >
          <option value="Gestor">Gestor(a) de Projeto</option>
          <option value="Diretor">Diretor(a) de Setor</option>
        </select>
        
        {/* --- Campos Dinâmicos --- */}
        {userRole === 'Gestor' && (
          <input
            type="text"
            placeholder="Nome do seu Projeto"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="w-full p-2 mb-4 border rounded"
          />
        )}

        <label className="block text-sm font-medium text-gray-700">
          {userRole === 'Gestor' ? 'Assessoria deste Projeto:' : 'Minha Assessoria:'}
        </label>
         <select 
            value={assessoria} 
            onChange={(e) => setAssessoria(e.target.value)}
            className="w-full p-2 mb-4 border rounded bg-white"
          >
            {assessorias.map(name => <option key={name} value={name}>{name}</option>)}
          </select>

        <button type="submit" disabled={loading || loadingMembers} className="w-full p-2 text-white bg-blue-600 rounded hover:bg-blue-700">
          {loading ? 'Cadastrando...' : 'Cadastrar'}
        </button>

        <p className="mt-4 text-center">
          Já tem conta? <Link to="/login" className="text-blue-600 hover:underline">Faça login</Link>
        </p>
      </form>
    </div>
  )
}