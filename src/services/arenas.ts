import { supabase } from './supabase'
import type {
  Arena,
  ArenaMember,
  ArenaMessage,
  ArenaMessageReaction,
  ArenaStanding,
  ArenaMemberStat,
  GroupArenaLeaderboardEntry,
  ArenaNotification,
} from '../types'

/** Fetch all arenas with member counts and current user's membership */
export async function getArenas(userId: string): Promise<Arena[]> {
  const { data: arenas, error } = await supabase
    .from('arenas')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  if (!arenas) return []

  const arenaIds = arenas.map((a: Arena) => a.id)

  // Fetch members for all arenas
  const { data: members } = await supabase
    .from('arena_members')
    .select('arena_id, user_id, team')
    .in('arena_id', arenaIds)

  const memberRows = (members ?? []) as { arena_id: string; user_id: string; team: 'a' | 'b' | null }[]

  return arenas.map((arena: Arena) => {
    const arenaMembers = memberRows.filter(m => m.arena_id === arena.id)
    const myMembership = arenaMembers.find(m => m.user_id === userId)

    return {
      ...arena,
      member_count: arenaMembers.length,
      team_a_count: arenaMembers.filter(m => m.team === 'a').length,
      team_b_count: arenaMembers.filter(m => m.team === 'b').length,
      is_member: !!myMembership,
      my_team: myMembership?.team ?? null,
    }
  })
}

/** Fetch a single arena with membership info */
export async function getArena(arenaId: string, userId: string): Promise<Arena | null> {
  const { data, error } = await supabase
    .from('arenas')
    .select('*')
    .eq('id', arenaId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const { data: members } = await supabase
    .from('arena_members')
    .select('user_id, team')
    .eq('arena_id', arenaId)

  const memberRows = (members ?? []) as { user_id: string; team: 'a' | 'b' | null }[]
  const myMembership = memberRows.find(m => m.user_id === userId)

  return {
    ...(data as Arena),
    member_count: memberRows.length,
    team_a_count: memberRows.filter(m => m.team === 'a').length,
    team_b_count: memberRows.filter(m => m.team === 'b').length,
    is_member: !!myMembership,
    my_team: myMembership?.team ?? null,
  }
}

/** Join a battle arena (free mode: pick team; auto mode: auto-balanced) */
export async function joinBattleArena(
  arenaId: string,
  userId: string,
  team: 'a' | 'b',
  joinMode: 'free' | 'auto',
  inviteCode?: string
): Promise<void> {
  if (joinMode === 'auto') {
    // Try RPC first; if it doesn't exist fall back to client-side team balancing
    const { error } = await supabase.rpc('join_arena_auto', {
      arena_id_param: arenaId,
      user_id_param: userId,
      ...(inviteCode ? { invite_code_param: inviteCode } : {}),
    })
    if (!error) return
    if (error.code !== 'PGRST202') throw error

    // RPC not found — pick the less-populated team, then insert directly
    const { data: members } = await supabase
      .from('arena_members')
      .select('team')
      .eq('arena_id', arenaId)
    const rows = (members ?? []) as { team: string | null }[]
    const autoTeam: 'a' | 'b' =
      rows.filter(m => m.team === 'a').length <= rows.filter(m => m.team === 'b').length ? 'a' : 'b'
    const { error: insertError } = await supabase
      .from('arena_members')
      .insert({ arena_id: arenaId, user_id: userId, team: autoTeam })
    if (insertError) throw insertError
  } else {
    const { error } = await supabase
      .from('arena_members')
      .insert({ arena_id: arenaId, user_id: userId, team })
    if (error) throw error
  }
}

/** Join a group arena */
export async function joinGroupArena(arenaId: string, userId: string, inviteCode?: string): Promise<void> {
  // Try RPC first; if it doesn't exist fall back to direct insert
  const { error } = await supabase.rpc('join_arena_group', {
    arena_id_param: arenaId,
    user_id_param: userId,
    ...(inviteCode ? { invite_code_param: inviteCode } : {}),
  })
  if (!error) return
  if (error.code !== 'PGRST202') throw error

  // RPC not found — insert directly (group arenas have no real teams; use 'a' as placeholder)
  const { error: insertError } = await supabase
    .from('arena_members')
    .insert({ arena_id: arenaId, user_id: userId, team: 'a' })
  if (insertError) throw insertError
}

/** Leave an arena */
export async function leaveArena(arenaId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('arena_members')
    .delete()
    .eq('arena_id', arenaId)
    .eq('user_id', userId)

  if (error) throw error
}

/** Switch team in a battle arena */
export async function switchTeam(
  arenaId: string,
  userId: string,
  newTeam: 'a' | 'b'
): Promise<void> {
  const { error } = await supabase
    .from('arena_members')
    .update({ team: newTeam })
    .eq('arena_id', arenaId)
    .eq('user_id', userId)

  if (error) throw error
}

// ─── Standings (computed from direct table queries — no RPCs required) ────────

/** Shared helper: resolve arena date range and member log data */
async function _arenaContext(arenaId: string) {
  const [{ data: arena }, { data: members }] = await Promise.all([
    supabase.from('arenas').select('starts_at, ends_at').eq('id', arenaId).maybeSingle(),
    supabase
      .from('arena_members')
      .select('user_id, team, profiles:user_id(username)')
      .eq('arena_id', arenaId),
  ])

  if (!arena || !members || members.length === 0) return null

  const startDate = arena.starts_at.split('T')[0]
  const arenaEnd = arena.ends_at.split('T')[0]
  const today = new Date().toISOString().split('T')[0]
  const endDate = arenaEnd < today ? arenaEnd : today

  // Days elapsed (at least 1 to avoid division by zero)
  const msPerDay = 86_400_000
  const totalDays = Math.max(
    1,
    Math.round((new Date(endDate + 'T00:00:00').getTime() - new Date(startDate + 'T00:00:00').getTime()) / msPerDay) + 1
  )

  const userIds = (members as any[]).map((m: any) => m.user_id)
  const { data: logs } = await supabase
    .from('daily_logs')
    .select('user_id, quran_reading, fasting, qiyam')
    .in('user_id', userIds)
    .gte('log_date', startDate)
    .lte('log_date', endDate)

  return { members: members as any[], totalDays, logs: (logs ?? []) as any[] }
}

export async function getArenaMemberStats(arenaId: string): Promise<ArenaMemberStat[]> {
  const ctx = await _arenaContext(arenaId)
  if (!ctx) return []

  return ctx.members.map((m: any) => {
    const ml = ctx.logs.filter((l: any) => l.user_id === m.user_id)
    const readingDays = ml.filter((l: any) => l.quran_reading).length
    return {
      user_id: m.user_id,
      username: (m.profiles as any)?.username ?? 'Unknown',
      reading_days: readingDays,
      reading_pct: Math.round((readingDays / ctx.totalDays) * 100),
      team: m.team ?? null,
    } as ArenaMemberStat
  })
}

export async function getArenaStandings(arenaId: string): Promise<ArenaStanding[]> {
  const stats = await getArenaMemberStats(arenaId)
  if (stats.length === 0) return []

  const avg = (group: ArenaMemberStat[]) =>
    group.length === 0 ? 0 : Math.round(group.reduce((s, m) => s + m.reading_pct, 0) / group.length)

  const teamA = stats.filter(m => m.team === 'a')
  const teamB = stats.filter(m => m.team === 'b')

  const result: ArenaStanding[] = []
  if (teamA.length > 0)
    result.push({ team: 'a', avg_reading_pct: avg(teamA), avg_reading_pct_week: avg(teamA), member_count: teamA.length })
  if (teamB.length > 0)
    result.push({ team: 'b', avg_reading_pct: avg(teamB), avg_reading_pct_week: avg(teamB), member_count: teamB.length })

  // Group arena (no teams): single entry
  if (result.length === 0) {
    result.push({ team: 'all', avg_reading_pct: avg(stats), avg_reading_pct_week: avg(stats), member_count: stats.length })
  }
  return result
}

export async function getGroupArenaLeaderboard(
  arenaId: string
): Promise<GroupArenaLeaderboardEntry[]> {
  const ctx = await _arenaContext(arenaId)
  if (!ctx) return []

  const entries: GroupArenaLeaderboardEntry[] = ctx.members.map((m: any) => {
    const ml = ctx.logs.filter((l: any) => l.user_id === m.user_id)
    const readingDays = ml.filter((l: any) => l.quran_reading).length
    const fastingDays = ml.filter((l: any) => l.fasting).length
    const qiyamDays = ml.filter((l: any) => l.qiyam).length
    return {
      user_id: m.user_id,
      username: (m.profiles as any)?.username ?? 'Unknown',
      total_points: readingDays + fastingDays + qiyamDays,
      reading_days: readingDays,
      fasting_days: fastingDays,
      qiyam_days: qiyamDays,
      reading_pct: Math.round((readingDays / ctx.totalDays) * 100),
      rank: 0,
    }
  })

  entries.sort((a, b) => b.total_points - a.total_points)
  entries.forEach((e, i) => { e.rank = i + 1 })
  return entries
}

// ─── Chat ────────────────────────────────────────────────────────────────────

export async function getArenaMessages(arenaId: string): Promise<ArenaMessage[]> {
  const { data, error } = await supabase
    .from('arena_messages')
    .select('*, profiles:user_id(username), reactions:arena_message_reactions(id, user_id, emoji)')
    .eq('arena_id', arenaId)
    .order('created_at', { ascending: true })
    .limit(100)

  if (error) throw error
  return (data ?? []) as ArenaMessage[]
}

export async function sendArenaMessage(
  arenaId: string,
  userId: string,
  content: string
): Promise<ArenaMessage> {
  const { data, error } = await supabase
    .from('arena_messages')
    .insert({ arena_id: arenaId, user_id: userId, content })
    .select('*, profiles:user_id(username)')
    .single()

  if (error) throw error
  return data as ArenaMessage
}

export async function deleteArenaMessage(messageId: string): Promise<void> {
  const { error } = await supabase
    .from('arena_messages')
    .delete()
    .eq('id', messageId)

  if (error) throw error
}

// ─── Reactions ───────────────────────────────────────────────────────────────

export async function getMessageReactions(
  messageIds: string[]
): Promise<ArenaMessageReaction[]> {
  if (messageIds.length === 0) return []
  const { data, error } = await supabase
    .from('arena_message_reactions')
    .select('*')
    .in('message_id', messageIds)

  if (error) throw error
  return (data ?? []) as ArenaMessageReaction[]
}

export async function toggleReaction(
  messageId: string,
  userId: string,
  emoji: string
): Promise<'added' | 'removed'> {
  // Check if reaction exists
  const { data: existing } = await supabase
    .from('arena_message_reactions')
    .select('id')
    .eq('message_id', messageId)
    .eq('user_id', userId)
    .eq('emoji', emoji)
    .maybeSingle()

  if (existing) {
    await supabase
      .from('arena_message_reactions')
      .delete()
      .eq('id', existing.id)
    return 'removed'
  } else {
    await supabase
      .from('arena_message_reactions')
      .insert({ message_id: messageId, user_id: userId, emoji })
    return 'added'
  }
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function getUnreadNotifications(
  userId: string
): Promise<ArenaNotification[]> {
  const { data, error } = await supabase
    .from('arena_notifications')
    .select('*')
    .eq('user_id', userId)
    .eq('is_read', false)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as ArenaNotification[]
}

export async function markNotificationsRead(userId: string): Promise<void> {
  await supabase
    .from('arena_notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)
}

// ─── Members ─────────────────────────────────────────────────────────────────

export async function getArenaMembers(arenaId: string): Promise<ArenaMember[]> {
  const { data, error } = await supabase
    .from('arena_members')
    .select('*, profiles:user_id(id, username, country, gender)')
    .eq('arena_id', arenaId)

  if (error) throw error
  return (data ?? []) as ArenaMember[]
}
