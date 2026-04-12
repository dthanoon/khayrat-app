import { useState, useEffect, useCallback } from 'react'
import { getTodayLog, upsertDailyLog } from '../services/logs'
import { useStore } from '../store/useStore'
import type { DailyLog } from '../types'

export function useDailyLog() {
  const { session, showToast } = useStore()
  const userId = session?.user.id

  const [log, setLog] = useState<DailyLog | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadLog = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const data = await getTodayLog(userId)
      setLog(data)
    } catch (e: unknown) {
      console.error('Failed to load today log', e)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadLog()
  }, [loadLog])

  const saveLog = useCallback(
    async (updates: {
      quran_reading?: boolean
      fasting?: boolean
      qiyam?: boolean
    }) => {
      if (!userId) return

      const current = log ?? {
        quran_reading: false,
        fasting: false,
        qiyam: false,
      }

      const payload = {
        quran_reading: updates.quran_reading ?? current.quran_reading,
        fasting: updates.fasting ?? current.fasting,
        qiyam: updates.qiyam ?? current.qiyam,
      }

      setSaving(true)
      try {
        const updated = await upsertDailyLog(payload)
        setLog(updated)
        showToast('Log saved', 'success')
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to save log'
        showToast(msg, 'error')
      } finally {
        setSaving(false)
      }
    },
    [userId, log, showToast]
  )

  return { log, loading, saving, saveLog, reload: loadLog }
}
