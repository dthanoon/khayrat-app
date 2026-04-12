import { supabase } from './supabase'
import type { LeaderboardEntry, LeaderboardSort, UserStats } from '../types'

export interface LeaderboardFilters {
  gender?: 'male' | 'female'
  country?: string
}

/**
 * Fetch paginated leaderboard entries.
 * Joins user_stats view with profiles for display info.
 */
export async function getLeaderboard(
  sort: LeaderboardSort = 'consistency_pct',
  filters: LeaderboardFilters = {},
  limit = 50,
  offset = 0
): Promise<LeaderboardEntry[]> {
  // Fetch stats
  let statsQuery = supabase
    .from('user_stats')
    .select('*')
    .order(sort, { ascending: false })
    .range(offset, offset + limit - 1)

  const { data: stats, error: statsError } = await statsQuery
  if (statsError) throw statsError
  if (!stats || stats.length === 0) return []

  const userIds = stats.map((s: UserStats) => s.user_id)

  // Fetch profiles for these users
  let profilesQuery = supabase
    .from('profiles')
    .select('id, username, country, gender')
    .in('id', userIds)

  if (filters.gender) profilesQuery = profilesQuery.eq('gender', filters.gender)
  if (filters.country) profilesQuery = profilesQuery.eq('country', filters.country)

  const { data: profiles, error: profilesError } = await profilesQuery
  if (profilesError) throw profilesError

  const profileMap = new Map((profiles ?? []).map((p: { id: string; username: string; country: string | null; gender: string | null }) => [p.id, p]))

  // Merge and filter
  const entries: LeaderboardEntry[] = []
  let rank = offset + 1

  for (const stat of stats as UserStats[]) {
    const profile = profileMap.get(stat.user_id)
    if (!profile) continue // filtered out

    entries.push({
      user_id: stat.user_id,
      username: profile.username,
      country: profile.country,
      gender: profile.gender,
      total_points: stat.total_points,
      active_days: stat.active_days,
      consistency_pct: stat.consistency_pct,
      reading_pct: stat.reading_pct,
      fasting_pct: stat.fasting_pct,
      qiyam_pct: stat.qiyam_pct,
      rank: rank++,
    })
  }

  return entries
}

/** Get stats + rank for a single user */
export async function getUserStatsAndRank(
  userId: string
): Promise<{ stats: UserStats; rank: number } | null> {
  const { data: userStat, error } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  if (!userStat) return null

  // Count users with higher consistency
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

/** Get user's current streak via RPC */
export async function getUserStreak(userId: string): Promise<number> {
  const { data, error } = await supabase.rpc('get_user_streak', { user_id: userId })
  if (error) return 0
  return (data as number) ?? 0
}
