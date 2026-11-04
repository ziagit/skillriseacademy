import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  // undefined = not loaded yet, null = no profile row
  const [profile, setProfile] = useState(undefined)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const userIdRef = useRef(undefined)

  const loadProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null)
      return
    }
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    if (error) console.error(error)
    setProfile(data ?? null)
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured) return

    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      await loadProfile(data.session?.user?.id)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession)
      const userId = newSession?.user?.id
      if (userId === userIdRef.current) return // token refresh etc.
      userIdRef.current = userId
      if (userId) setProfile(undefined)
      // Defer DB calls out of the auth callback (recommended by supabase-js).
      setTimeout(() => loadProfile(userId), 0)
    })
    return () => sub.subscription.unsubscribe()
  }, [loadProfile])

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      role: profile?.role ?? null,
      isAdmin: profile?.role === 'admin',
      isTeacher: profile?.role === 'teacher' || profile?.role === 'admin',
      refreshProfile: () => loadProfile(session?.user?.id),
      signOut: async () => {
        await supabase.auth.signOut()
        setProfile(null)
      },
    }),
    [session, profile, loading, loadProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

export function homePathFor(role) {
  if (role === 'admin') return '/admin'
  if (role === 'teacher') return '/teacher'
  return '/student'
}
