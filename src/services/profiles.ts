import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from './supabase'
import type { Profile } from '../types'

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? ''

const PROFILE_CACHE_KEY = 'khayrat:profile:cache:v1'

/** Read the cached profile for instant first paint on cold start.
 *  Returns null if no cache, parse fails, or cached id doesn't match the active user. */
export async function getCachedProfile(userId: string): Promise<Profile | null> {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_CACHE_KEY)
    if (!raw) return null
    const cached = JSON.parse(raw) as Profile
    if (!cached || cached.id !== userId) return null
    return cached
  } catch {
    return null
  }
}

export async function setCachedProfile(profile: Profile): Promise<void> {
  try {
    await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile))
  } catch {
    // best-effort
  }
}

export async function clearCachedProfile(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PROFILE_CACHE_KEY)
  } catch {
    // best-effort
  }
}

/** Register a new user directly via Supabase auth */
export async function registerUser(email: string, password: string): Promise<{ userId: string; sessionReady: boolean }> {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw new Error(error.message)
  if (!data.user) throw new Error('Registration failed — please try again')
  return { userId: data.user.id, sessionReady: !!data.session }
}

/** Upsert the user's profile (step 2 of registration or settings update) */
export async function upsertProfile(
  userId: string,
  updates: Partial<Omit<Profile, 'id' | 'created_at' | 'is_admin'>>
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...updates })
    .select()
    .single()

  if (error) throw error
  return data as Profile
}

/** Fetch a profile by user id */
export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error
  return data as Profile | null
}

/** Fetch the current user's own profile */
export async function getMyProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return getProfile(user.id)
}

/** Update password for the current user */
export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
}

/** Send password reset email */
export async function sendPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'khayrat://reset-password',
  })
  if (error) throw error
}
