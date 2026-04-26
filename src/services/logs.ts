import { supabase } from './supabase'
import { todayString } from '../utils/date'
import type { DailyLog } from '../types'

export interface UpsertLogPayload {
  quran_reading?: boolean
  fasting?: boolean
  qiyam?: boolean
  kahf_reading?: boolean
  log_date?: string
}

/** Upsert today's daily log for the authenticated user */
export async function upsertDailyLog(payload: UpsertLogPayload): Promise<DailyLog> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const log_date = payload.log_date ?? todayString()

  const { data, error } = await supabase
    .from('daily_logs')
    .upsert(
      {
        user_id: user.id,
        log_date,
        quran_reading: payload.quran_reading ?? false,
        fasting: payload.fasting ?? false,
        qiyam: payload.qiyam ?? false,
        kahf_reading: payload.kahf_reading ?? false,
      },
      { onConflict: 'user_id,log_date' }
    )
    .select()
    .single()

  if (error) throw error
  return data as DailyLog
}

/** Fetch the authenticated user's log for a given date (defaults to today) */
export async function getTodayLog(userId: string, date?: string): Promise<DailyLog | null> {
  const log_date = date ?? todayString()

  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('log_date', log_date)
    .maybeSingle()

  if (error) throw error
  return data as DailyLog | null
}

/** Fetch the last 30 daily logs for a user (for the activity heatmap) */
export async function getRecentLogs(userId: string, days = 30): Promise<DailyLog[]> {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  const cutoffStr = cutoff.toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('log_date', cutoffStr)
    .order('log_date', { ascending: false })

  if (error) throw error
  return (data ?? []) as DailyLog[]
}
