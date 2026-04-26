import { useState, useEffect, useCallback } from 'react'
import { getTodayLog, upsertDailyLog } from '../services/logs'
import { syncWidgetData } from '../services/widgetSync'
import { useStore } from '../store/useStore'
import { todayString } from '../utils/date'
import type { DailyLog } from '../types'

export function useDailyLog(date?: string) {
  const { session, showToast } = useStore()
  const userId = session?.user.id
  const targetDate = date ?? todayString()

  const pushWidgetSync = useCallback((log: DailyLog) => {
    if (!userId || !session?.access_token) return
    syncWidgetData({
      userId,
      accessToken: session.access_token,
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
      quranReading: log.quran_reading,
      fasting: log.fasting,
      qiyam: log.qiyam,
      kahfReading: log.kahf_reading,
      date: log.log_date,
    })
  }, [userId, session?.access_token])

  const [log, setLog] = useState<DailyLog | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadLog = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const data = await getTodayLog(userId, targetDate)
      setLog(data)
      if (data) pushWidgetSync(data)
    } catch (e: unknown) {
      console.error('Failed to load log', e)
    } finally {
      setLoading(false)
    }
  }, [userId, targetDate, pushWidgetSync])

  useEffect(() => {
    loadLog()
  }, [loadLog])

  const saveLog = useCallback(
    async (updates: {
      quran_reading?: boolean
      fasting?: boolean
      qiyam?: boolean
      kahf_reading?: boolean
    }) => {
      if (!userId) return

      const current = log ?? {
        quran_reading: false,
        fasting: false,
        qiyam: false,
        kahf_reading: false,
      }

      const payload = {
        quran_reading: updates.quran_reading ?? current.quran_reading,
        fasting: updates.fasting ?? current.fasting,
        qiyam: updates.qiyam ?? current.qiyam,
        kahf_reading: updates.kahf_reading ?? current.kahf_reading,
        log_date: targetDate,
      }

      setSaving(true)
      try {
        const updated = await upsertDailyLog(payload)
        setLog(updated)
        pushWidgetSync(updated)
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to save log'
        showToast(msg, 'error')
      } finally {
        setSaving(false)
      }
    },
    [userId, log, showToast, targetDate, pushWidgetSync]
  )

  return { log, loading, saving, saveLog, reload: loadLog }
}
