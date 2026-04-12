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

/** Join a battle arena (free mode: pick team; auto mode: balanced) */
export async function joinBattleArena(
  arenaId: string,
  userId: string,
  team: 'a' | 'b',
  joinMode: 'free' | 'auto'
): Promise<void> {
  if (joinMode === 'auto') {
    const { error } = await supabase.rpc('join_arena_auto', {
      arena_id_param: arenaId,
      user_id_param: userId,
    })
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('arena_members')
      .insert({ arena_id: arenaId, user_id: userId, team })
    if (error) throw error
  }
}

/** Join a group arena */
export async function joinGroupArena(arenaId: string, userId: string): Promise<void> {
  const { error } = await supabase.rpc('join_arena_group', {
    arena_id_param: arenaId,
    user_id_param: userId,
  })
  if (error) throw error
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

// ─── Standings ──────────────────────────────────────────────────────────────

export async function getArenaStandings(arenaId: string): Promise<ArenaStanding[]> {
  const { data, error } = await supabase.rpc('get_arena_standings', {
    arena_id_param: arenaId,
  })
  if (error) throw error
  return (data ?? []) as ArenaStanding[]
}

export async function getArenaMemberStats(arenaId: string): Promise<ArenaMemberStat[]> {
  const { data, error } = await supabase.rpc('get_arena_member_stats', {
    arena_id_param: arenaId,
  })
  if (error) throw error
  return (data ?? []) as ArenaMemberStat[]
}

export async function getGroupArenaLeaderboard(
  arenaId: string
): Promise<GroupArenaLeaderboardEntry[]> {
  const { data, error } = await supabase.rpc('get_group_arena_leaderboard', {
    arena_id_param: arenaId,
  })
  if (error) throw error
  return (data ?? []) as GroupArenaLeaderboardEntry[]
}

// ─── Chat ────────────────────────────────────────────────────────────────────

export async function getArenaMessages(arenaId: string): Promise<ArenaMessage[]> {
  const { data, error } = await supabase
    .from('arena_messages')
    .select('*, profiles:user_id(username)')
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
