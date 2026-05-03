import { NativeModules, Platform } from 'react-native'

export interface WidgetSyncData {
  userId: string
  accessToken: string
  refreshToken: string
  supabaseUrl: string
  supabaseAnonKey: string
  quranReading: boolean
  fasting: boolean
  qiyam: boolean
  kahfReading: boolean
  date: string
}

export function syncWidgetData(data: WidgetSyncData): void {
  try {
    if (Platform.OS === 'ios' && NativeModules.WidgetSyncModule) {
      NativeModules.WidgetSyncModule.syncData(data)
    } else if (Platform.OS === 'android' && NativeModules.WidgetSyncModule) {
      NativeModules.WidgetSyncModule.syncData(data)
    }
  } catch {
    // Widget sync is best-effort; never crash the main app
  }
}

/** Refresh only the auth tokens in widget storage — called on TOKEN_REFRESHED so the widget
 *  always has valid tokens without overwriting the log values it stored itself. */
export function syncWidgetAuthToken(
  userId: string,
  accessToken: string,
  refreshToken: string,
): void {
  if (Platform.OS !== 'ios') return
  try {
    const mod = NativeModules.WidgetSyncModule
    if (mod?.syncAuthToken) {
      mod.syncAuthToken(
        userId,
        accessToken,
        refreshToken,
        process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
      )
    }
  } catch {
    // best-effort
  }
}
