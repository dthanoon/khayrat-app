import { useState, useEffect, useCallback } from 'react'
import {
  getLeaderboard,
  getUserStatsAndRank,
  getUserStreak,
} from '../services/leaderboard'
import { useStore } from '../store/useStore'
import type { LeaderboardEntry, LeaderboardSort, LeaderboardFilters, PersonalStatsData } from '../types'

export function useLeaderboard(sort: LeaderboardSort = 'consistency_pct') {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filters, setFilters] = useState<LeaderboardFilters>({})

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true)
      else setLoading(true)
      try {
        const data = await getLeaderboard(sort, filters)
        setEntries(data)
      } catch (e) {
        console.error('Leaderboard load error', e)
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [sort, filters]
  )

  useEffect(() => {
    load()
  }, [load])

  return {
    entries,
    loading,
    refreshing,
    filters,
    setFilters,
    refresh: () => load(true),
  }
}

export function usePersonalStats() {
  const { session } = useStore()
  const userId = session?.user.id

  const [stats, setStats] = useState<PersonalStatsData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const [statsResult, streak] = await Promise.all([
        getUserStatsAndRank(userId),
        getUserStreak(userId),
      ])

      if (statsResult) {
        setStats({
          streak,
          consistency_pct: statsResult.stats.consistency_pct,
          reading_pct: statsResult.stats.reading_pct,
          fasting_pct: statsResult.stats.fasting_pct,
          qiyam_pct: statsResult.stats.qiyam_pct,
          active_days: statsResult.stats.active_days,
          days_since_joining: statsResult.stats.days_since_joining,
          total_points: statsResult.stats.total_points,
          rank: statsResult.rank,
        })
      }
    } catch (e) {
      console.error('Personal stats error', e)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    load()
  }, [load])

  return { stats, loading, reload: load }
}
