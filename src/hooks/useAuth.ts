import { useCallback } from 'react'
import { supabase } from '../services/supabase'
import { useStore } from '../store/useStore'

export function useAuth() {
  const { session, profile, isAuthLoading, setProfile, showToast } = useStore()

  const signIn = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        showToast(error.message, 'error')
        return false
      }
      return true
    },
    [showToast]
  )

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    useStore.getState().signOut()
  }, [])

  const updateProfile = useCallback(
    async (updates: Partial<typeof profile>) => {
      if (!session?.user.id) return
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', session.user.id)
        .select()
        .single()

      if (error) {
        showToast(error.message, 'error')
        return
      }
      setProfile(data)
      showToast('Profile updated', 'success')
    },
    [session, setProfile, showToast]
  )

  return {
    session,
    profile,
    isAuthLoading,
    userId: session?.user.id ?? null,
    email: session?.user.email ?? null,
    isAdmin: profile?.is_admin ?? false,
    signIn,
    signOut,
    updateProfile,
  }
}
