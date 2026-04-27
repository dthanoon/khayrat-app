import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import type { Profile } from '../types'

interface AppState {
  // Auth
  session: Session | null
  profile: Profile | null
  isAuthLoading: boolean
  profileLoaded: boolean

  // Actions
  setSession: (session: Session | null) => void
  setProfile: (profile: Profile | null) => void
  setAuthLoading: (loading: boolean) => void
  setProfileLoaded: (loaded: boolean) => void
  signOut: () => void

  // Toast
  toast: { message: string; type: 'success' | 'error' | 'info' } | null
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
  clearToast: () => void
}

export const useStore = create<AppState>((set) => ({
  session: null,
  profile: null,
  isAuthLoading: true,
  profileLoaded: false,

  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  setAuthLoading: (isAuthLoading) => set({ isAuthLoading }),
  setProfileLoaded: (profileLoaded) => set({ profileLoaded }),

  signOut: () => set({ session: null, profile: null, profileLoaded: false }),

  toast: null,
  showToast: (message, type = 'info') => {
    set({ toast: { message, type } })
    // Auto-clear after 3 seconds
    setTimeout(() => set({ toast: null }), 3000)
  },
  clearToast: () => set({ toast: null }),
}))
