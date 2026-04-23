import { NativeModules, Platform } from 'react-native'

export interface WidgetSyncData {
  userId: string
  accessToken: string
  supabaseUrl: string
  supabaseAnonKey: string
  quranReading: boolean
  fasting: boolean
  qiyam: boolean
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
