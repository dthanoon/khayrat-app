import { useState, useEffect, useCallback } from 'react'
import {
  getArenas,
  getArena,
  joinBattleArena,
  joinGroupArena,
  leaveArena,
  getArenaStandings,
  getArenaMemberStats,
  getGroupArenaLeaderboard,
  getArenaMessages,
  sendArenaMessage,
  notifyMentions,
  toggleReaction,
  getUnreadNotifications,
  markNotificationsRead,
} from '../services/arenas'
import { supabase } from '../services/supabase'
import { useStore } from '../store/useStore'
import type {
  Arena,
  ArenaMessage,
  ArenaStanding,
  ArenaMemberStat,
  GroupArenaLeaderboardEntry,
  ArenaNotification,
} from '../types'

export function useArenas() {
  const { session, showToast } = useStore()
  const userId = session?.user.id

  const [arenas, setArenas] = useState<Arena[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(
    async (isRefresh = false) => {
      if (!userId) return
      if (isRefresh) setRefreshing(true)
      else setLoading(true)
      try {
        const data = await getArenas(userId)
        setArenas(data)
      } catch (e) {
        console.error('Arenas load error', e)
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [userId]
  )

  useEffect(() => {
    load()
  }, [load])

  const join = useCallback(
    async (arena: Arena, team?: 'a' | 'b', inviteCode?: string) => {
      if (!userId) return

      // Client-side invite code check (case-insensitive, trimmed) for immediate feedback.
      // Server-side RPCs validate independently — the code is always forwarded below.
      if (arena.invite_code) {
        const entered = (inviteCode ?? '').trim().toLowerCase()
        const expected = arena.invite_code.trim().toLowerCase()
        if (!entered) {
          showToast('This arena requires an invite code', 'error')
          return
        }
        if (entered !== expected) {
          showToast('Invalid invite code', 'error')
          return
        }
      }

      const code = inviteCode?.trim() || undefined
      try {
        if (arena.arena_type === 'battle') {
          await joinBattleArena(arena.id, userId, team ?? 'a', arena.join_mode, code)
        } else {
          await joinGroupArena(arena.id, userId, code)
        }
        showToast('Joined arena!', 'success')
        load()
      } catch (e: unknown) {
        const msg = (e as any)?.message ?? 'Failed to join arena'
        showToast(msg, 'error')
        console.error('Join arena error:', e)
      }
    },
    [userId, showToast, load]
  )

  const leave = useCallback(
    async (arenaId: string) => {
      if (!userId) return
      try {
        await leaveArena(arenaId, userId)
        showToast('Left arena', 'info')
        load()
      } catch (e: unknown) {
        const msg = (e as any)?.message ?? 'Failed to leave arena'
        showToast(msg, 'error')
      }
    },
    [userId, showToast, load]
  )

  return {
    arenas,
    loading,
    refreshing,
    refresh: () => load(true),
    join,
    leave,
  }
}

export function useArenaDetail(arenaId: string) {
  const { session } = useStore()
  const userId = session?.user.id

  const [arena, setArena] = useState<Arena | null>(null)
  const [standings, setStandings] = useState<ArenaStanding[]>([])
  const [memberStats, setMemberStats] = useState<ArenaMemberStat[]>([])
  const [groupLeaderboard, setGroupLeaderboard] = useState<GroupArenaLeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const [arenaData, standingsData, memberData] = await Promise.all([
        getArena(arenaId, userId),
        getArenaStandings(arenaId).catch(() => []),
        getArenaMemberStats(arenaId).catch(() => []),
      ])

      setArena(arenaData)
      setStandings(standingsData)
      setMemberStats(memberData)

      if (arenaData?.arena_type === 'group') {
        const groupData = await getGroupArenaLeaderboard(arenaId).catch(() => [])
        setGroupLeaderboard(groupData)
      }
    } catch (e) {
      console.error('Arena detail error', e)
    } finally {
      setLoading(false)
    }
  }, [arenaId, userId])

  useEffect(() => {
    load()
  }, [load])

  return { arena, standings, memberStats, groupLeaderboard, loading, reload: load }
}

export function useArenaChat(arenaId: string) {
  const { session, profile } = useStore()
  const userId = session?.user.id
  const username = profile?.username

  const [messages, setMessages] = useState<ArenaMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    let active = true

    getArenaMessages(arenaId)
      .then(data => { if (active) { setMessages(data); setLoading(false) } })
      .catch(() => { if (active) setLoading(false) })

    // Realtime subscription for new messages
    const channel = supabase
      .channel(`arena-chat-${arenaId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'arena_messages',
          filter: `arena_id=eq.${arenaId}`,
        },
        async (payload) => {
          // Fetch the sender's username
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', payload.new.user_id)
            .single()

          const newMsg: ArenaMessage = {
            ...(payload.new as ArenaMessage),
            profiles: profile ?? { username: 'Unknown' },
            reactions: [],
          }

          if (active) {
            setMessages(prev => [...prev, newMsg])
          }
        }
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [arenaId])

  const send = useCallback(
    async (content: string) => {
      if (!userId || !content.trim()) return
      setSending(true)
      try {
        const msg = await sendArenaMessage(arenaId, userId, content.trim())
        // Fire-and-forget: notify any @mentioned arena members
        if (username) {
          notifyMentions(arenaId, msg.id, content.trim(), username, userId).catch((e) => {
            console.error('notifyMentions failed:', e)
          })
        }
      } catch (e) {
        console.error('Send message error', e)
      } finally {
        setSending(false)
      }
    },
    [arenaId, userId, username]
  )

  const react = useCallback(
    async (messageId: string, emoji: string) => {
      if (!userId) return
      const result = await toggleReaction(messageId, userId, emoji)
      // Optimistic local update so the UI reacts immediately
      setMessages(prev =>
        prev.map(msg => {
          if (msg.id !== messageId) return msg
          const reactions = [...(msg.reactions ?? [])]
          if (result === 'added') {
            const newReaction = { id: `tmp-${Date.now()}`, message_id: messageId, user_id: userId, emoji }
            return { ...msg, reactions: [...reactions, newReaction] }
          } else {
            return { ...msg, reactions: reactions.filter(r => !(r.user_id === userId && r.emoji === emoji)) }
          }
        })
      )
    },
    [userId]
  )

  return { messages, loading, sending, send, react }
}

export function useNotifications() {
  const { session } = useStore()
  const userId = session?.user.id

  const [notifications, setNotifications] = useState<ArenaNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const load = useCallback(async () => {
    if (!userId) return
    try {
      const data = await getUnreadNotifications(userId)
      setNotifications(data)
      setUnreadCount(data.filter(n => !n.is_read).length)
    } catch (e) {
      console.error('Notifications error', e)
    }
  }, [userId])

  useEffect(() => {
    load()

    // Realtime subscription for new notifications
    if (!userId) return

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'arena_notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications(prev => [payload.new as ArenaNotification, ...prev])
          setUnreadCount(c => c + 1)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, load])

  const markRead = useCallback(async () => {
    if (!userId) return
    await markNotificationsRead(userId)
    setUnreadCount(0)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }, [userId])

  return { notifications, unreadCount, markRead, reload: load }
}
