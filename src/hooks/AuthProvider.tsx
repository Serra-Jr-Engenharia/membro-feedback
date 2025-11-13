import { useState, useEffect, createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Session, User } from '@supabase/supabase-js'

export interface Profile {
  id: string;
  notion_name: string;
  user_role: string;
  project_name: string | null;
  assessoria: string;
}
interface AuthContextType {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
}
const AuthContext = createContext<AuthContextType>(null!)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true); // Começa como true

  useEffect(() => {
    console.log('AuthProvider (v5 - Deadlock Fix): Configurando listener...')

    const { data: authListener } = supabase.auth.onAuthStateChange(
      
      (event, session) => {
        console.log(`AuthProvider: Evento: ${event}`)
        
        setSession(session)
        setUser(session?.user ?? null)
        setProfile(null); 

        setTimeout(async () => {
          try {
            if (session?.user) {
              console.log(`AuthProvider: Buscando perfil (ID: ${session.user.id})`)

              const { data: profileData, error } = await supabase
                .from('profiles')
                .select('id, notion_name, user_role, project_name, assessoria')
                .eq('id', session.user.id)
                .limit(1)
                .maybeSingle(); 

              if (error) {
                console.error('ERRO AO BUSCAR PERFIL:', error.message)
              }
              
              setProfile(profileData as Profile ?? null)
              console.log('AuthProvider: Perfil recebido:', profileData)

            } else {
              console.log('AuthProvider: Perfil limpo (sem sessão).')
            }

          } catch (error) {
              console.error('AuthProvider: Erro inesperado:', error)
          } finally {
              setLoading(false)
              console.log('AuthProvider: Carregamento finalizado.')
          }
        }, 0) 
      }
    )

    return () => {
      console.log('AuthProvider: Limpando listener.')
      authListener.subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ session, user, profile, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)