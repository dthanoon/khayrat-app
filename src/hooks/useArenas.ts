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

      // Validate invite code if needed
      if (arena.invite_code && inviteCode !== arena.invite_code) {
        showToast('Invalid invite code', 'error')
        return
      }

      try {
        if (arena.arena_type === 'battle') {
          await joinBattleArena(arena.id, userId, team ?? 'a', arena.join_mode)
        } else {
          await joinGroupArena(arena.id, userId)
        }
        showToast('Joined arena!', 'success')
        load()
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to join arena'
        showToast(msg, 'error')
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
        const msg = e instanceof Error ? e.message : 'Failed to leave arena'
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
  const { session } = useStore()
  const userId = session?.user.id

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
        await sendArenaMessage(arenaId, userId, content.trim())
      } catch (e) {
        console.error('Send message error', e)
      } finally {
        setSending(false)
      }
    },
    [arenaId, userId]
  )

  const react = useCallback(
    async (messageId: string, emoji: string) => {
      if (!userId) return
      await toggleReaction(messageId, userId, emoji)
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
