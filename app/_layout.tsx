import 'react-native-url-polyfill/auto'
import React, { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Animated, Pressable } from 'react-native'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import * as Notifications from 'expo-notifications'
import { supabase } from '../src/services/supabase'
import { getProfile } from '../src/services/profiles'
import { registerForPushNotifications } from '../src/services/notifications'
import { useStore } from '../src/store/useStore'
import { colors } from '../src/constants/theme'
import { AppSplashScreen } from '../src/components/SplashLogo'

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
  const { session, setSession, setProfile, setAuthLoading, isAuthLoading } = useStore()
  const segments = useSegments()
  const router = useRouter()
  const splashOpacity = useRef(new Animated.Value(1)).current

  // Open arena when user taps a mention notification
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data as { type?: string; arena_id?: string }
      if (data?.type === 'mention' && data?.arena_id) {
        router.push(`/arena/${data.arena_id}` as any)
      }
    })
    return () => sub.remove()
  }, [])

  useEffect(() => {
    // Hide native splash immediately so our custom screen shows
    SplashScreen.hideAsync()

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      if (session?.user.id) {
        const profile = await getProfile(session.user.id).catch(() => null)
        setProfile(profile)
        registerForPushNotifications(session.user.id).catch(() => {})
      }
      // Fade out custom splash, then mark auth done
      Animated.timing(splashOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => setAuthLoading(false))
    })

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

  return (
    <>
      {children}
      {/* Custom splash overlay — fades out once auth resolves */}
      {isAuthLoading && (
        <Animated.View
          style={[StyleSheet.absoluteFillObject, { opacity: splashOpacity, zIndex: 999 }]}
          pointerEvents="none"
        >
          <AppSplashScreen />
        </Animated.View>
      )}
    </>
  )
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
        <Stack.Screen
          name="privacy"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="terms"
          options={{ headerShown: false }}
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
