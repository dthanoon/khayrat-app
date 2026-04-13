import { supabase } from './supabase'
import type { LeaderboardEntry, LeaderboardSort, LeaderboardFilters, UserStats } from '../types'

/**
 * Fetch paginated leaderboard from user_stats view.
 * The view already contains username, country, gender — no separate profile join needed.
 */
export async function getLeaderboard(
  sort: LeaderboardSort = 'consistency_pct',
  filters: LeaderboardFilters = {},
  limit = 50,
  offset = 0
): Promise<LeaderboardEntry[]> {
  let query = supabase
    .from('user_stats')
    .select('id, username, country, gender, total_points, active_days, consistency_pct, reading_consistency_pct, fasting_consistency_pct, qiyam_consistency_pct')
    .order(sort, { ascending: false })
    .range(offset, offset + limit - 1)

  if (filters.gender) query = query.eq('gender', filters.gender)
  if (filters.country) query = query.eq('country', filters.country)

  const { data, error } = await query
  if (error) throw error
  if (!data) return []

  return (data as UserStats[]).map((row, i) => ({
    user_id: row.id,
    username: row.username,
    country: row.country,
    gender: row.gender,
    total_points: row.total_points,
    active_days: row.active_days,
    consistency_pct: row.consistency_pct,
    reading_consistency_pct: row.reading_consistency_pct,
    fasting_consistency_pct: row.fasting_consistency_pct,
    qiyam_consistency_pct: row.qiyam_consistency_pct,
    rank: offset + i + 1,
  }))
}

/** Get stats + rank for a single user */
export async function getUserStatsAndRank(
  userId: string
): Promise<{ stats: UserStats; rank: number } | null> {
  const { data: userStat, error } = await supabase
    .from('user_stats')
    .select('*')
    .eq('id', userId)   // view uses 'id', not 'user_id'
    .maybeSingle()

  if (error) throw error
  if (!userStat) return null

  // Count users with strictly higher consistency to determine rank
  const { count, error: countError } = await supabase
    .from('user_stats')
    .select('*', { count: 'exact', head: true })
    .gt('consistency_pct', (userStat as UserStats).consistency_pct)

  if (countError) throw countError

  return {
    stats: userStat as UserStats,
    rank: (count ?? 0) + 1,
  }
}

/** Get user's current streak — RPC param is p_user_id */
export async function getUserStreak(userId: string): Promise<number> {
  const { data, error } = await supabase.rpc('get_user_streak', { p_user_id: userId })
  if (error) return 0
  return (data as number) ?? 0
}
