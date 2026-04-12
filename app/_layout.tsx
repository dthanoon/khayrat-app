import 'react-native-url-polyfill/auto'
import React, { useEffect } from 'react'
import { View, Text, StyleSheet, Animated, Pressable } from 'react-native'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { supabase } from '../src/services/supabase'
import { getProfile } from '../src/services/profiles'
import { useStore } from '../src/store/useStore'
import { colors } from '../src/constants/theme'

SplashScreen.preventAutoHideAsync()

function ToastOverlay() {
  const { toast, clearToast } = useStore()
  const opacity = React.useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (toast) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(2400),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start()
    }
  }, [toast, opacity])

  if (!toast) return null

  const bgColor =
    toast.type === 'success'
      ? colors.emeraldDim
      : toast.type === 'error'
      ? colors.roseDim
      : colors.bgCard

  const textColor =
    toast.type === 'success'
      ? colors.emeraldLight
      : toast.type === 'error'
      ? '#fda4af'
      : colors.textPrimary

  return (
    <Animated.View style={[styles.toast, { backgroundColor: bgColor, opacity }]}>
      <Pressable onPress={clearToast} style={styles.toastInner}>
        <Text style={[styles.toastText, { color: textColor }]}>{toast.message}</Text>
      </Pressable>
    </Animated.View>
  )
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, setSession, setProfile, setAuthLoading } = useStore()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      if (session?.user.id) {
        const profile = await getProfile(session.user.id).catch(() => null)
        setProfile(profile)
      }
      setAuthLoading(false)
      SplashScreen.hideAsync()
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      if (session?.user.id) {
        const profile = await getProfile(session.user.id).catch(() => null)
        setProfile(profile)
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)'

    if (session === null && !inAuthGroup) {
      router.replace('/(auth)/login')
    } else if (session !== null && inAuthGroup) {
      router.replace('/(tabs)')
    }
  }, [session, segments])

  return <>{children}</>
}

export default function RootLayout() {
  return (
    <AuthGate>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bgCard },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: { fontWeight: '600', color: colors.textPrimary },
          contentStyle: { backgroundColor: colors.bg },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="arena/[id]"
          options={{ title: 'Arena', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="user/[id]"
          options={{ title: 'Profile', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="settings"
          options={{ title: 'Settings', headerBackTitle: 'Back' }}
        />
      </Stack>
      <ToastOverlay />
    </AuthGate>
  )
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 90,
    left: 20,
    right: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  toastInner: {
    padding: 14,
  },
  toastText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
})
