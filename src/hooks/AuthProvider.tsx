/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect, createContext, useContext, useRef, useCallback } from 'react'
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
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>(null!)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  // Guarda o ID do usuário cujo perfil já está carregado em memória
  const loadedUserIdRef = useRef<string | null>(null)

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('id, notion_name, user_role, project_name, assessoria, email')
        .eq('id', userId)
        .limit(1)
        .maybeSingle()

      if (error) {
        console.error('ERRO AO BUSCAR PERFIL:', error.message)
      }

      loadedUserIdRef.current = userId
      setProfile((profileData as Profile) ?? null)
    } catch (error) {
      console.error('AuthProvider: Erro inesperado ao buscar perfil:', error)
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchProfile(user.id)
    }
  }, [user?.id, fetchProfile])

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession)

        // Se não tiver sessão (Logout)
        if (!currentSession) {
          loadedUserIdRef.current = null
          setUser(null)
          setProfile(null)
          setLoading(false)
          return
        }

        const currentUser = currentSession.user
        setUser(currentUser)

        // Se o perfil do usuário atual já foi carregado e não for uma atualização explícita,
        // não refaz a query nem troca a referência do objeto de perfil.
        // Isso evita que eventos de visibilidade da aba (Alt+Tab / visibilitychange) causem re-renders desnecessários.
        if (loadedUserIdRef.current === currentUser.id && event !== 'USER_UPDATED') {
          setLoading(false)
          return
        }

        // Executa a busca assíncrona fora do lock interno de autenticação do Supabase
        setTimeout(async () => {
          try {
            await fetchProfile(currentUser.id)
          } finally {
            setLoading(false)
          }
        }, 0)
      }
    )

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [fetchProfile])

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, refreshProfile }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)