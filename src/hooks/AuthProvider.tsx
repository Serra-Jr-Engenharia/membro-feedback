import { useState, createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import { directorLogins } from '../lib/userDatabase'
import type { DirectorProfile } from '../lib/userDatabase.ts'
import { Navigate } from 'react-router-dom'

// 1. Definir o que o nosso Contexto vai fornecer
interface AuthContextType {
  profile: DirectorProfile | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

// 2. Criar o Contexto
const AuthContext = createContext<AuthContextType>(null!)

// 3. Criar o Provedor
export function AuthProvider({ children }: { children: ReactNode }) {
  // O único estado que importa: quem está logado
  const [profile, setProfile] = useState<DirectorProfile | null>(null)

  // Função de Login
  const login = async (email: string, password: string) => {
    // Procura o usuário no nosso arquivo "hardcoded"
    const foundUser = directorLogins.find(
      (user) => user.email === email
    )

    // Verifica a senha
    if (foundUser && foundUser.password === password) {
      setProfile(foundUser) // Login com sucesso!
      return; // Sucesso
    }

    // Falha no login
    throw new Error('Email ou senha inválidos.')
  }

  // Função de Logout
  const logout = () => {
    setProfile(null) // Simplesmente limpa o perfil
  }

  // O 'value' agora fornece o perfil e as funções de login/logout
  return (
    <AuthContext.Provider value={{ profile, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// 4. O Hook (para usar nas páginas)
export const useAuth = () => useContext(AuthContext)