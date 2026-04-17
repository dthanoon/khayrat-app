export interface Profile {
  id: string
  username: string
  first_name: string | null
  last_name: string | null
  age: number | null
  gender: 'male' | 'female' | null
  country: string | null
  city: string | null
  is_admin: boolean
  created_at: string
}

export interface DailyLog {
  id: string
  user_id: string
  log_date: string // YYYY-MM-DD
  quran_reading: boolean
  fasting: boolean
  qiyam: boolean
  created_at: string
}

/** Matches the user_stats VIEW columns exactly */
export interface UserStats {
  id: string                      // the user's UUID (not user_id)
  username: string
  full_name: string | null
  age: number | null
  gender: string | null
  country: string | null
  city: string | null
  joined_at: string
  reading_points: number
  fasting_points: number
  qiyam_points: number
  total_points: number
  active_days: number
  days_since_joining: number
  consistency_pct: number
  reading_consistency_pct: number
  fasting_consistency_pct: number
  qiyam_consistency_pct: number
}

export type LeaderboardSort =
  | 'consistency_pct'
  | 'total_points'
  | 'reading_consistency_pct'
  | 'fasting_consistency_pct'
  | 'qiyam_consistency_pct'

export interface LeaderboardEntry {
  user_id: string
  username: string
  country: string | null
  gender: string | null
  total_points: number
  active_days: number
  consistency_pct: number
  reading_consistency_pct: number
  fasting_consistency_pct: number
  qiyam_consistency_pct: number
  rank?: number
}

export interface LeaderboardFilters {
  gender?: 'male' | 'female'
  country?: string
}

export interface Arena {
  id: string
  name: string
  arena_type: 'battle' | 'group'
  team_a_name: string | null
  team_b_name: string | null
  starts_at: string
  ends_at: string
  join_mode: 'free' | 'auto'
  allow_team_switch: boolean
  invite_code: string | null
  max_members: number | null
  track_fasting: boolean
  track_qiyam: boolean
  created_at: string
  // computed client-side from arena_members
  member_count?: number
  team_a_count?: number
  team_b_count?: number
  my_team?: 'a' | 'b' | null
  is_member?: boolean
}

export interface ArenaMember {
  id: string
  arena_id: string
  user_id: string
  team: 'a' | 'b' | null
  joined_at: string
  profiles?: Pick<Profile, 'id' | 'username' | 'country' | 'gender'>
}

export interface ArenaMessage {
  id: string
  arena_id: string
  user_id: string
  content: string
  created_at: string
  profiles?: Pick<Profile, 'username'>
  reactions?: ArenaMessageReaction[]
}

export interface ArenaMessageReaction {
  id: string
  message_id: string
  user_id: string
  emoji: string
}

export interface ArenaNotification {
  id: string
  user_id: string
  arena_id: string
  message_id: string
  actor_username: string
  content_preview: string
  is_read: boolean
  created_at: string
}

export interface ArenaStanding {
  team: string
  avg_reading_pct: number
  avg_reading_pct_week: number
  member_count: number
}

export interface ArenaMemberStat {
  user_id: string
  username: string
  reading_days: number
  reading_pct: number
  team: 'a' | 'b' | null
}

export interface GroupArenaLeaderboardEntry {
  user_id: string
  username: string
  total_points: number
  reading_days: number
  fasting_days: number
  qiyam_days: number
  reading_pct: number
  rank: number
}

export interface PersonalStatsData {
  streak: number
  consistency_pct: number
  reading_consistency_pct: number
  fasting_consistency_pct: number
  qiyam_consistency_pct: number
  active_days: number
  days_since_joining: number
  total_points: number
  rank?: number
  gender?: string | null
  country?: string | null
}

export interface ComparativeRanks {
  globalRank: number
  globalTotal: number
  genderRank: number | null
  genderTotal: number | null
  countryRank: number | null
  countryTotal: number | null
  gender: string | null
  country: string | null
}

export interface MetricRanks {
  rank: number
  total: number
}

export interface MetricContext {
  global: MetricRanks
  gender: MetricRanks | null
  country: MetricRanks | null
}

export interface AllComparativeRanks {
  gender: string | null
  country: string | null
  consistency: MetricContext
  quran: MetricContext
  fasting: MetricContext
  qiyam: MetricContext
  points: MetricContext
}
