import { supabase } from './supabase'
import type { LeaderboardEntry, LeaderboardSort, LeaderboardFilters, UserStats, ComparativeRanks, MetricRanks, MetricContext, AllComparativeRanks } from '../types'

/**
 * Fetch paginated leaderboard from user_stats view.
 * The view already contains username, country, gender — no separate profile join needed.
 *
 * Sorting by 'points_per_day' goes through a dedicated RPC because the column is
 * computed (total_points / active_days) and isn't part of the view.
 */
export async function getLeaderboard(
  sort: LeaderboardSort = 'consistency_pct',
  filters: LeaderboardFilters = {},
  limit = 50,
  offset = 0
): Promise<LeaderboardEntry[]> {
  if (sort === 'points_per_day') {
    return getLeaderboardByPointsPerDay(filters, limit, offset)
  }

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

type PointsPerDayRow = {
  id: string
  username: string
  country: string | null
  gender: string | null
  total_points: number
  active_days: number
  consistency_pct: number
  reading_consistency_pct: number
  fasting_consistency_pct: number
  qiyam_consistency_pct: number
  points_per_day: number
}

async function getLeaderboardByPointsPerDay(
  filters: LeaderboardFilters,
  limit: number,
  offset: number
): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase.rpc('get_leaderboard_by_points_per_day', {
    p_gender: filters.gender ?? null,
    p_country: filters.country ?? null,
    p_limit: limit,
    p_offset: offset,
  })

  if (error) throw error
  if (!data) return []

  return (data as PointsPerDayRow[]).map((row, i) => ({
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
    points_per_day: row.points_per_day,
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

type RankRow = {
  id: string
  gender: string | null
  country: string | null
  consistency_pct: number
  reading_consistency_pct: number
  fasting_consistency_pct: number
  qiyam_consistency_pct: number
  total_points: number
}
type MetricField = keyof Omit<RankRow, 'id' | 'gender' | 'country'>

/**
 * Fetch all user_stats in one query and compute ranks for all 5 metrics
 * across global / same-gender / same-country contexts entirely client-side.
 */
export async function getAllComparativeRanks(
  userId: string,
  gender: string | null,
  country: string | null
): Promise<AllComparativeRanks | null> {
  const { data, error } = await supabase
    .from('user_stats')
    .select('id, gender, country, consistency_pct, reading_consistency_pct, fasting_consistency_pct, qiyam_consistency_pct, total_points')

  if (error || !data || data.length === 0) return null

  const rows = data as RankRow[]
  const me = rows.find(r => r.id === userId)
  if (!me) return null

  const genderRows = gender ? rows.filter(r => r.gender === gender) : null
  const countryRows = country ? rows.filter(r => r.country === country) : null

  const computeRank = (pool: RankRow[], val: number, field: MetricField): MetricRanks => ({
    rank: pool.filter(r => r[field] > val).length + 1,
    total: pool.length,
  })

  const makeMetric = (field: MetricField): MetricContext => {
    const val = me[field]
    return {
      global: computeRank(rows, val, field),
      gender: genderRows ? computeRank(genderRows, val, field) : null,
      country: countryRows ? computeRank(countryRows, val, field) : null,
    }
  }

  return {
    gender,
    country,
    consistency: makeMetric('consistency_pct'),
    quran: makeMetric('reading_consistency_pct'),
    fasting: makeMetric('fasting_consistency_pct'),
    qiyam: makeMetric('qiyam_consistency_pct'),
    points: makeMetric('total_points'),
  }
}

/**
 * Get comparative ranks for a user: global, same gender, same country.
 * Uses consistency_pct as the ranking metric (matching global leaderboard default).
 */
export async function getComparativeRanks(
  consistencyPct: number,
  gender: string | null,
  country: string | null
): Promise<ComparativeRanks> {
  // Global rank: how many users scored strictly higher
  const [{ count: globalHigher }, { count: globalTotal }] = await Promise.all([
    supabase.from('user_stats').select('*', { count: 'exact', head: true }).gt('consistency_pct', consistencyPct),
    supabase.from('user_stats').select('*', { count: 'exact', head: true }),
  ])

  let genderRank: number | null = null
  let genderTotal: number | null = null
  if (gender) {
    const [{ count: gh }, { count: gt }] = await Promise.all([
      supabase.from('user_stats').select('*', { count: 'exact', head: true })
        .eq('gender', gender).gt('consistency_pct', consistencyPct),
      supabase.from('user_stats').select('*', { count: 'exact', head: true })
        .eq('gender', gender),
    ])
    genderRank = (gh ?? 0) + 1
    genderTotal = gt ?? 0
  }

  let countryRank: number | null = null
  let countryTotal: number | null = null
  if (country) {
    const [{ count: ch }, { count: ct }] = await Promise.all([
      supabase.from('user_stats').select('*', { count: 'exact', head: true })
        .eq('country', country).gt('consistency_pct', consistencyPct),
      supabase.from('user_stats').select('*', { count: 'exact', head: true })
        .eq('country', country),
    ])
    countryRank = (ch ?? 0) + 1
    countryTotal = ct ?? 0
  }

  return {
    globalRank: (globalHigher ?? 0) + 1,
    globalTotal: globalTotal ?? 0,
    genderRank,
    genderTotal,
    countryRank,
    countryTotal,
    gender,
    country,
  }
}
