import { Redirect } from 'expo-router'
import { useStore } from '../src/store/useStore'

export default function Index() {
  const { session, isAuthLoading } = useStore()

  // While loading, render nothing (splash screen is shown)
  if (isAuthLoading) return null

  return <Redirect href={session ? '/(tabs)' : '/(auth)/login'} />
}
