import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate, Link } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const { error: signInError } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleLogin} className="p-8 bg-white rounded shadow-md w-96">
        <h2 className="text-2xl font-bold mb-4">Login</h2>
        
        {error && (
          <div className="p-3 mb-4 text-red-800 bg-red-100 rounded">
            {error}
          </div>
        )}

        <input
          type="email"
          placeholder="Email"
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
        <button type="submit" disabled={loading} className="w-full p-2 text-white bg-blue-600 rounded hover:bg-blue-700">
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
        
        <p className="mt-4 text-center">
          Não tem conta? <Link to="/signup" className="text-blue-600 hover:underline">Cadastre-se</Link>
        </p>
      </form>
    </div>
  )
}