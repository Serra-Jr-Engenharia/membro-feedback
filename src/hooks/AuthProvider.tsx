/* eslint-disable react-refresh/only-export-components */
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
  email?: string;
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
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session)
        
        // Só limpa o perfil se não tiver sessão (Logout)
        if (!session) {
          setUser(null);
          setProfile(null);
        } else {
          setUser(session.user);
        }

        setTimeout(async () => {
          try {
            if (session?.user) {
              const { data: profileData, error } = await supabase
                .from('profiles')
                .select('id, notion_name, user_role, project_name, assessoria, email')
                .eq('id', session.user.id)
                .limit(1)
                .maybeSingle(); 

              if (error) console.error('ERRO AO BUSCAR PERFIL:', error.message)
              
              setProfile(profileData as Profile ?? null)
            }
          } catch (error) {
              console.error('AuthProvider: Erro inesperado:', error)
          } finally {
              setLoading(false)
          }
        }, 0) 
      }
    )

    return () => {
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