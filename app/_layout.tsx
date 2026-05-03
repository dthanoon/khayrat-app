import 'react-native-url-polyfill/auto'
import React, { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Animated, Pressable } from 'react-native'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import * as Notifications from 'expo-notifications'
import { supabase } from '../src/services/supabase'
import { getProfile, getCachedProfile } from '../src/services/profiles'
import { registerForPushNotifications } from '../src/services/notifications'
import { syncWidgetAuthToken } from '../src/services/widgetSync'
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
  const { session, profile, setSession, setProfile, setAuthLoading, isAuthLoading, profileLoaded, setProfileLoaded } = useStore()
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
    // Hide native splash immediately so our custom logo screen shows
    SplashScreen.hideAsync()

    let splashDismissed = false
    let initialBootstrapDone = false

    const dismissSplash = () => {
      if (splashDismissed) return
      splashDismissed = true
      Animated.timing(splashOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => setAuthLoading(false))
    }

    // Safety net: if auth init hangs (slow network, AsyncStorage stall on iOS cold start),
    // dismiss splash so the app never freezes. 3s is generous for AsyncStorage + a cached
    // profile lookup; if we hit it, something is genuinely broken.
    const timeoutId = setTimeout(() => {
      // If timeout fires before profile resolves, force resolution so routing can redirect.
      if (!initialBootstrapDone) {
        setProfileLoaded(true)
      }
      dismissSplash()
    }, 3000)

    // Cold-start bootstrap. Cached profile gives us an instant first paint with the right
    // username — splash only fades once the underlying screen is correct.
    ;(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setSession(session)

        if (!session?.user.id) {
          setProfileLoaded(true)
          initialBootstrapDone = true
          clearTimeout(timeoutId)
          dismissSplash()
          return
        }

        const userId = session.user.id
        const cached = await getCachedProfile(userId)

        if (cached) {
          // Instant path: render with cached profile, then refresh in the background.
          setProfile(cached)
          setProfileLoaded(true)
          initialBootstrapDone = true
          clearTimeout(timeoutId)
          dismissSplash()
          getProfile(userId)
            .then(p => { if (p) setProfile(p) })
            .catch(() => {})
        } else {
          // Cold path (first install / cache cleared): wait for network before splash drops
          // so the user never sees the "Friend" placeholder.
          try {
            const p = await getProfile(userId)
            if (p) setProfile(p)
          } catch {
            // Network failed — let routing decide based on whatever state we have.
          }
          setProfileLoaded(true)
          initialBootstrapDone = true
          clearTimeout(timeoutId)
          dismissSplash()
        }

        // Defer non-critical work — push permission prompt and widget sync should not
        // block first paint and should not race with the splash fade animation.
        setTimeout(() => {
          registerForPushNotifications(userId).catch(() => {})
          syncWidgetAuthToken(userId, session.access_token, session.refresh_token)
        }, 1000)
      } catch {
        setProfileLoaded(true)
        initialBootstrapDone = true
        clearTimeout(timeoutId)
        dismissSplash()
      }
    })()

    // Subsequent auth events. INITIAL_SESSION is handled by the bootstrap above; skip it
    // here to avoid a duplicate profile fetch on cold start.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'INITIAL_SESSION') return

      setSession(session)

      if (event === 'SIGNED_OUT' || !session?.user.id) {
        setProfile(null)
        setProfileLoaded(true)
        return
      }

      const userId = session.user.id

      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        // Try cache first for instant render even on sign-in (covers re-login on same device).
        const cached = await getCachedProfile(userId)
        if (cached) setProfile(cached)
        try {
          const fresh = await getProfile(userId)
          if (fresh) setProfile(fresh)
          else if (!cached) setProfile(null)
        } catch {
          if (!cached) setProfile(null)
        }
        setProfileLoaded(true)

        if (event === 'SIGNED_IN') {
          setTimeout(() => {
            registerForPushNotifications(userId).catch(() => {})
            syncWidgetAuthToken(userId, session.access_token, session.refresh_token)
          }, 1000)
        }
      } else if (event === 'TOKEN_REFRESHED') {
        // Just keep the widget's tokens fresh — no profile refetch needed.
        syncWidgetAuthToken(userId, session.access_token, session.refresh_token)
      }
    })

    return () => {
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!profileLoaded) return
    const inAuthGroup = segments[0] === '(auth)'
    const inOnboarding = (segments[0] as string) === 'onboarding'

    if (session === null && !inAuthGroup) {
      router.replace('/(auth)/login')
    } else if (session !== null && inAuthGroup) {
      // Send to onboarding if profile not yet set up, otherwise straight to tabs
      if (profile?.username) {
        router.replace('/(tabs)')
      } else {
        router.replace('/onboarding' as any)
      }
    } else if (session !== null && !profile?.username && !inAuthGroup && !inOnboarding) {
      // User has a session but never finished onboarding — funnel them in even if
      // they crashed mid-flow and reopened on a tab/settings/etc.
      router.replace('/onboarding' as any)
    }
  }, [session, segments, profile, profileLoaded])

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
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
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
