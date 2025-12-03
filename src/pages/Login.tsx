import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate, Link } from 'react-router-dom'
import logoSerra from '../assets/LogoSerra.svg'

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
    <div className="flex flex-col items-center justify-center min-h-screen bg-azulEscuroPage font-poppins text-white relative overflow-hidden">
      
      {/* Elementos decorativos de fundo (opcional, para dar um charme extra) */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-azulClaroCheck/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-laranja/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex flex-col items-center z-10 w-full max-w-md px-4">
        {/* Logo da Serra Jr. */}
        <img 
          src={logoSerra} 
          alt="Logo Serra Jr. Engenharia" 
          className="w-48 mb-8 drop-shadow-lg"
        />

        <form 
          onSubmit={handleLogin} 
          className="w-full bg-azulEscuroCard p-8 rounded-2xl shadow-2xl border border-azulClaroBorder/30 backdrop-blur-sm"
        >
          <h2 className="text-2xl font-bold mb-6 text-center text-white">
            Bem-vindo(a) de volta!
          </h2>
          
          {error && (
            <div className="p-3 mb-5 text-sm text-red-200 bg-red-900/50 border border-red-500/50 rounded-lg text-center animate-pulse">
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1 ml-1">Email</label>
              <input
                type="email"
                placeholder="seu.email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-[#001A33] border border-azulClaroBorder/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-laranja focus:ring-1 focus:ring-laranja transition-all duration-300"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1 ml-1">Senha</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 bg-[#001A33] border border-azulClaroBorder/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-laranja focus:ring-1 focus:ring-laranja transition-all duration-300"
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full py-3 mt-2 text-white font-bold bg-laranja rounded-lg hover:bg-opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Entrando...
                </span>
              ) : 'Entrar'}
            </button>
          </div>
          
          <div className="mt-6 text-center text-sm text-gray-400">
            <p>
              Não tem uma conta?{' '}
              <Link 
                to="/signup" 
                className="text-azulClaroCheck font-semibold hover:text-laranja hover:underline transition-colors"
              >
                Cadastre-se
              </Link>
            </p>
          </div>
        </form>
      </div>
      
      {/* Rodapé simples */}
      <footer className="absolute bottom-4 text-xs text-gray-500 opacity-50">
        &copy; {new Date().getFullYear()} Serra Jr. Engenharia
      </footer>
    </div>
  )
}