import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useLocalSearchParams, useNavigation } from 'expo-router'
import { useHeaderHeight } from '@react-navigation/elements'
import { useLayoutEffect } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { ArenaChat } from '../../src/components/ArenaChat'
import { Badge } from '../../src/components/ui/Badge'
import { Card } from '../../src/components/ui/Card'
import { Button } from '../../src/components/ui/Button'
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner'
import { useArenaDetail, useArenas } from '../../src/hooks/useArenas'
import { useAuth } from '../../src/hooks/useAuth'
import { arenaStatusLabel, formatDateShort } from '../../src/utils/date'
import { consistencyColor, formatPct, rankBadge } from '../../src/utils/consistency'
import { colors, spacing, fontSize, fontWeight, radius } from '../../src/constants/theme'

type Tab = 'standings' | 'members' | 'chat'

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ArenaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const navigation = useNavigation()
  const headerHeight = useHeaderHeight()
  const { userId } = useAuth()
  const { join, leave } = useArenas()
  const { arena, standings, memberStats, groupLeaderboard, loading, reload } = useArenaDetail(id)
  const [activeTab, setActiveTab] = useState<Tab>('standings')
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [selectedTeam, setSelectedTeam] = useState<'a' | 'b'>('a')

  useLayoutEffect(() => {
    if (arena) navigation.setOptions({ title: arena.name })
  }, [arena, navigation])

  if (loading || !arena) return <LoadingSpinner fullScreen message="Loading arena…" />

  const status = arenaStatusLabel(arena.starts_at, arena.ends_at)
  const statusVariant = status === 'Active' ? 'emerald' : status === 'Upcoming' ? 'amber' : 'gray'
  const isBattle = arena.arena_type === 'battle'
  const isMember = arena.is_member
  const needsTeamPick = isBattle && arena.join_mode === 'free'
  const needsCode = !!arena.invite_code

  const handleJoinPress = () => {
    if (needsCode || needsTeamPick) {
      setShowJoinModal(true)
    } else {
      join(arena, 'a')
      setTimeout(reload, 500)
    }
  }
  const handleJoinConfirm = () => {
    setShowJoinModal(false)
    join(arena, selectedTeam, joinCode.trim() || undefined)
    setJoinCode('')
    setTimeout(reload, 500)
  }
  const handleLeave = () => {
    leave(arena.id)
    setTimeout(reload, 500)
  }

  const TABS: { key: Tab; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
    { key: 'standings', icon: 'trophy-outline', label: 'Standings' },
    { key: 'members', icon: 'people-outline', label: 'Members' },
    { key: 'chat', icon: 'chatbubbles-outline', label: 'Chat' },
  ]

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={headerHeight}
    >
      {/* ── Compact arena header ── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerMeta}>
            <Badge label={status} variant={statusVariant} />
            <Badge label={isBattle ? 'Battle' : 'Group'} variant={isBattle ? 'purple' : 'sky'} size="sm" />
            <Text style={styles.dates}>
              {formatDateShort(arena.starts_at)} – {formatDateShort(arena.ends_at)}
            </Text>
          </View>
        </View>

        {/* Battle: compact team overview */}
        {isBattle && (
          <View style={styles.teamsRow}>
            <View style={styles.teamSide}>
              <Text style={styles.teamSideName} numberOfLines={1}>
                {arena.team_a_name ?? 'Team A'}
              </Text>
              <Text style={styles.teamSideCount}>{arena.team_a_count ?? 0} members</Text>
            </View>
            <View style={styles.vsCircle}>
              <Text style={styles.vsText}>VS</Text>
            </View>
            <View style={[styles.teamSide, styles.teamSideRight]}>
              <Text style={styles.teamSideName} numberOfLines={1}>
                {arena.team_b_name ?? 'Team B'}
              </Text>
              <Text style={styles.teamSideCount}>{arena.team_b_count ?? 0} members</Text>
            </View>
          </View>
        )}

        {/* Group: member count */}
        {!isBattle && (
          <View style={styles.groupCountRow}>
            <Ionicons name="people-outline" size={14} color={colors.textMuted} />
            <Text style={styles.groupCountText}>
              {arena.member_count ?? 0}
              {arena.max_members ? ` / ${arena.max_members}` : ''} members
            </Text>
          </View>
        )}

        {/* Join / leave */}
        {status !== 'Ended' && (
          isMember ? (
            <View style={styles.memberStatusRow}>
              <View style={styles.memberStatusBadge}>
                <Ionicons name="checkmark-circle" size={14} color={colors.emerald} />
                <Text style={styles.memberStatusText}>
                  Member{isBattle && arena.my_team
                    ? ` · ${arena.my_team === 'a' ? arena.team_a_name : arena.team_b_name}`
                    : ''}
                </Text>
              </View>
              <TouchableOpacity onPress={handleLeave} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.leaveText}>Leave</Text>
              </TouchableOpacity>
            </View>
          ) : (
            status === 'Active' && (
              <Button title="Join Arena" onPress={handleJoinPress} fullWidth size="md" />
            )
          )
        )}
      </View>

      {/* ── Tab bar ── */}
      <View style={styles.tabBar}>
        {TABS.map(tab => {
          const active = activeTab === tab.key
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabBtn, active && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={tab.icon}
                size={15}
                color={active ? colors.emerald : colors.textMuted}
              />
              <Text style={[styles.tabBtnText, active && styles.tabBtnTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* ── Join modal (invite code / team selection) ── */}
      <Modal
        visible={showJoinModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowJoinModal(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setShowJoinModal(false)}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Join {arena.name}</Text>

            {needsTeamPick && (
              <>
                <Text style={styles.sheetLabel}>Choose your team</Text>
                <View style={styles.teamRow}>
                  {(['a', 'b'] as const).map(t => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.teamBtn, selectedTeam === t && styles.teamBtnActive]}
                      onPress={() => setSelectedTeam(t)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.teamBtnText, selectedTeam === t && styles.teamBtnTextActive]}>
                        {t === 'a' ? (arena.team_a_name ?? 'Team A') : (arena.team_b_name ?? 'Team B')}
                      </Text>
                      <Text style={styles.teamMemberCount}>
                        {(t === 'a' ? arena.team_a_count : arena.team_b_count) ?? 0} members
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {needsCode && (
              <>
                <Text style={styles.sheetLabel}>Invite code</Text>
                <TextInput
                  style={styles.codeInput}
                  value={joinCode}
                  onChangeText={setJoinCode}
                  placeholder="Enter invite code"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  selectionColor={colors.emerald}
                />
              </>
            )}

            <Button title="Confirm Join" onPress={handleJoinConfirm} fullWidth size="lg" />
          </View>
        </Pressable>
      </Modal>

      {/* ── Content (fills remaining space per tab) ── */}
      <View style={styles.content}>
        {activeTab === 'standings' && (
          isBattle ? (
            <BattleStandingsTab
              standings={standings}
              memberStats={memberStats}
              teamAName={arena.team_a_name ?? 'Team A'}
              teamBName={arena.team_b_name ?? 'Team B'}
            />
          ) : (
            <GroupStandingsTab entries={groupLeaderboard} currentUserId={userId} />
          )
        )}

        {activeTab === 'members' && (
          <MembersTab
            memberStats={memberStats}
            currentUserId={userId}
            isBattle={isBattle}
            teamAName={arena.team_a_name ?? 'Team A'}
            teamBName={arena.team_b_name ?? 'Team B'}
          />
        )}

        {activeTab === 'chat' && (
          userId
            ? <ArenaChat arenaId={id} currentUserId={userId} members={memberStats} />
            : <View style={styles.emptyState}>
                <Ionicons name="lock-closed-outline" size={40} color={colors.textMuted} />
                <Text style={styles.emptyStateText}>Sign in to join the chat</Text>
              </View>
        )}
      </View>
    </KeyboardAvoidingView>
  )
}

// ─── Battle Standings Tab ─────────────────────────────────────────────────────

function BattleStandingsTab({
  standings,
  memberStats,
  teamAName,
  teamBName,
}: {
  standings: ReturnType<typeof useArenaDetail>['standings']
  memberStats: ReturnType<typeof useArenaDetail>['memberStats']
  teamAName: string
  teamBName: string
}) {
  const standingA = standings.find(s => s.team === 'a') ?? standings[0]
  const standingB = standings.find(s => s.team === 'b') ?? standings[1]
  const avgA = standingA?.avg_reading_pct ?? 0
  const avgB = standingB?.avg_reading_pct ?? 0

  const total = avgA + avgB
  const barWidthA = total > 0 ? (avgA / total) * 100 : 50
  const colorA = consistencyColor(avgA)
  const colorB = consistencyColor(avgB)

  const leader = avgA > avgB ? teamAName : avgB > avgA ? teamBName : null
  const diff = Math.abs(avgA - avgB)

  const teamAMembers = [...memberStats.filter(m => m.team === 'a')].sort((a, b) => b.reading_pct - a.reading_pct)
  const teamBMembers = [...memberStats.filter(m => m.team === 'b')].sort((a, b) => b.reading_pct - a.reading_pct)

  return (
    <ScrollView contentContainerStyle={styles.standingsPad} showsVerticalScrollIndicator={false}>
      {/* Scoreboard card */}
      <Card style={styles.scoreCard}>
        <Text style={styles.scoreCardTitle}>Live Score</Text>

        <View style={styles.scoreRow}>
          {/* Team A */}
          <View style={styles.scoreTeam}>
            <Text style={[styles.scoreAvg, { color: colorA }]}>{formatPct(avgA)}</Text>
            <Text style={styles.scoreTeamName} numberOfLines={1}>{teamAName}</Text>
            <Text style={styles.scoreMemberCount}>{standingA?.member_count ?? 0} members</Text>
          </View>

          {/* Center indicator */}
          <View style={styles.scoreMiddle}>
            {leader ? (
              <View style={styles.leadPill}>
                <Text style={styles.leadPillText}>+{formatPct(diff)}</Text>
              </View>
            ) : (
              <Text style={styles.tiedLabel}>Tied</Text>
            )}
          </View>

          {/* Team B */}
          <View style={[styles.scoreTeam, { alignItems: 'flex-end' }]}>
            <Text style={[styles.scoreAvg, { color: colorB }]}>{formatPct(avgB)}</Text>
            <Text style={styles.scoreTeamName} numberOfLines={1}>{teamBName}</Text>
            <Text style={styles.scoreMemberCount}>{standingB?.member_count ?? 0} members</Text>
          </View>
        </View>

        {/* Battle bar */}
        <View style={styles.battleBar}>
          <View style={[styles.battleBarA, { flex: barWidthA, backgroundColor: colorA }]} />
          <View style={[styles.battleBarB, { flex: 100 - barWidthA, backgroundColor: colorB }]} />
        </View>

        {leader && (
          <Text style={styles.leadingLabel}>🏆 {leader} is leading</Text>
        )}
      </Card>

      {/* Per-team member rankings */}
      <View style={styles.teamsColumns}>
        <TeamRankColumn members={teamAMembers} title={teamAName} accentColor={colorA} />
        <TeamRankColumn members={teamBMembers} title={teamBName} accentColor={colorB} />
      </View>
    </ScrollView>
  )
}

function TeamRankColumn({
  members,
  title,
  accentColor,
}: {
  members: ReturnType<typeof useArenaDetail>['memberStats']
  title: string
  accentColor: string
}) {
  return (
    <Card style={styles.teamRankCard}>
      <View style={[styles.teamRankHeader, { borderLeftColor: accentColor }]}>
        <Text style={styles.teamRankTitle} numberOfLines={1}>{title}</Text>
      </View>
      {members.length === 0 ? (
        <Text style={styles.emptyCardText}>No members yet</Text>
      ) : (
        members.map((m, i) => (
          <View key={m.user_id} style={styles.teamMemberRow}>
            <Text style={styles.teamMemberRank}>
              {i < 3 ? rankBadge(i + 1) : `${i + 1}`}
            </Text>
            <Text style={styles.teamMemberName} numberOfLines={1}>{m.username}</Text>
            <Text style={[styles.teamMemberPct, { color: consistencyColor(m.reading_pct) }]}>
              {formatPct(m.reading_pct)}
            </Text>
          </View>
        ))
      )}
    </Card>
  )
}

// ─── Group Standings Tab ──────────────────────────────────────────────────────

function GroupStandingsTab({
  entries,
  currentUserId,
}: {
  entries: ReturnType<typeof useArenaDetail>['groupLeaderboard']
  currentUserId: string | null
}) {
  if (entries.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="trophy-outline" size={48} color={colors.textMuted} />
        <Text style={styles.emptyStateTitle}>No standings yet</Text>
        <Text style={styles.emptyStateText}>Log your activities to appear on the board</Text>
      </View>
    )
  }

  return (
    <FlatList
      data={entries}
      keyExtractor={item => item.user_id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: spacing.xxl }}
      ListHeaderComponent={
        <View style={styles.listColumnHeader}>
          <Text style={[styles.colLabel, { width: 40 }]}>#</Text>
          <Text style={[styles.colLabel, { flex: 1, marginLeft: 40 + spacing.sm }]}>Member</Text>
          <Text style={[styles.colLabel, { width: 40, textAlign: 'right' }]}>Pts</Text>
          <Text style={[styles.colLabel, { width: 48, textAlign: 'right', marginLeft: spacing.sm }]}>%</Text>
        </View>
      }
      renderItem={({ item, index }) => {
        const isMe = item.user_id === currentUserId
        const rank = item.rank ?? index + 1
        return (
          <View style={[styles.groupRow, isMe && styles.groupRowMe]}>
            <View style={styles.groupRankCell}>
              {rank <= 3
                ? <Text style={styles.rankEmoji}>{rankBadge(rank)}</Text>
                : <Text style={styles.rankNum}>#{rank}</Text>}
            </View>

            <View style={[styles.groupAvatar, isMe && styles.groupAvatarMe]}>
              <Text style={styles.groupAvatarText}>{item.username[0]?.toUpperCase()}</Text>
            </View>

            <View style={styles.groupNameCol}>
              <Text style={[styles.groupName, isMe && { color: colors.emerald }]} numberOfLines={1}>
                {item.username}{isMe ? ' (you)' : ''}
              </Text>
              <View style={styles.groupActivityRow}>
                <Text style={styles.groupActivityTag}>📖 {item.reading_days}d</Text>
                <Text style={styles.groupActivityTag}>🌙 {item.fasting_days}d</Text>
                <Text style={styles.groupActivityTag}>🌟 {item.qiyam_days}d</Text>
              </View>
            </View>

            <Text style={[styles.groupPoints, { color: colors.amber }]}>{item.total_points}</Text>
            <Text style={[styles.groupPct, { color: consistencyColor(item.reading_pct) }]}>
              {formatPct(item.reading_pct)}
            </Text>
          </View>
        )
      }}
    />
  )
}

// ─── Members Tab ──────────────────────────────────────────────────────────────

function MembersTab({
  memberStats,
  currentUserId,
  isBattle,
  teamAName,
  teamBName,
}: {
  memberStats: ReturnType<typeof useArenaDetail>['memberStats']
  currentUserId: string | null
  isBattle: boolean
  teamAName: string
  teamBName: string
}) {
  const sorted = [...memberStats].sort((a, b) => b.reading_pct - a.reading_pct)

  if (sorted.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="people-outline" size={48} color={colors.textMuted} />
        <Text style={styles.emptyStateTitle}>No members yet</Text>
      </View>
    )
  }

  return (
    <FlatList
      data={sorted}
      keyExtractor={item => item.user_id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: spacing.xxl }}
      renderItem={({ item, index }) => {
        const isMe = item.user_id === currentUserId
        const teamLabel = isBattle
          ? item.team === 'a' ? teamAName : item.team === 'b' ? teamBName : null
          : null

        return (
          <View style={[styles.memberRow, isMe && styles.memberRowMe]}>
            <Text style={styles.memberRankNum}>#{index + 1}</Text>

            <View style={[styles.memberAvatar, isMe && styles.memberAvatarMe]}>
              <Text style={styles.memberAvatarText}>{item.username[0]?.toUpperCase()}</Text>
            </View>

            <View style={styles.memberInfo}>
              <Text style={[styles.memberName, isMe && { color: colors.emerald }]} numberOfLines={1}>
                {item.username}{isMe ? ' (you)' : ''}
              </Text>
              {teamLabel && (
                <Text style={styles.memberTeamTag}>{teamLabel}</Text>
              )}
            </View>

            <View style={styles.memberRight}>
              <Text style={[styles.memberPct, { color: consistencyColor(item.reading_pct) }]}>
                {formatPct(item.reading_pct)}
              </Text>
              <Text style={styles.memberDays}>{item.reading_days} days</Text>
            </View>
          </View>
        )
      }}
    />
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },

  // Header
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTop: {},
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  dates: { fontSize: fontSize.xs, color: colors.textMuted },

  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamSide: { flex: 1, gap: 2 },
  teamSideRight: { alignItems: 'flex-end' },
  teamSideName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  teamSideCount: { fontSize: fontSize.xs, color: colors.textMuted },
  vsCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.bgCardAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: colors.textMuted },

  groupCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  groupCountText: { fontSize: fontSize.sm, color: colors.textSecondary },

  memberStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  memberStatusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  memberStatusText: { fontSize: fontSize.sm, color: colors.emerald, fontWeight: fontWeight.medium },
  leaveText: { fontSize: fontSize.sm, color: colors.textMuted },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 11,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: { borderBottomColor: colors.emerald },
  tabBtnText: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.textMuted },
  tabBtnTextActive: { color: colors.emerald },

  content: { flex: 1 },

  // Join modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.xl,
    gap: spacing.lg,
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingBottom: 36,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
  },
  sheetTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  sheetLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },
  teamRow: { flexDirection: 'row', gap: spacing.md },
  teamBtn: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.bgInput,
    alignItems: 'center',
    gap: 4,
  },
  teamBtnActive: { borderColor: colors.emerald, backgroundColor: colors.emeraldDim },
  teamBtnText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  teamBtnTextActive: { color: colors.emeraldLight },
  teamMemberCount: { fontSize: fontSize.xs, color: colors.textMuted },
  codeInput: {
    backgroundColor: colors.bgInput,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 46,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },

  // Battle standings
  standingsPad: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  scoreCard: { gap: spacing.md },
  scoreCardTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textMuted,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreTeam: { flex: 1, gap: 3 },
  scoreAvg: {
    fontSize: 32,
    fontWeight: fontWeight.bold,
    lineHeight: 36,
  },
  scoreTeamName: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  scoreMemberCount: { fontSize: fontSize.xs, color: colors.textMuted },
  scoreMiddle: { alignItems: 'center', paddingHorizontal: spacing.sm },
  leadPill: {
    backgroundColor: `${colors.emerald}20`,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: `${colors.emerald}50`,
  },
  leadPillText: { fontSize: fontSize.xs, color: colors.emeraldLight, fontWeight: fontWeight.bold },
  tiedLabel: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: fontWeight.bold },
  battleBar: {
    height: 10,
    flexDirection: 'row',
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  battleBarA: { height: '100%' },
  battleBarB: { height: '100%' },
  leadingLabel: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center' },

  teamsColumns: { flexDirection: 'row', gap: spacing.md },
  teamRankCard: { flex: 1, gap: spacing.sm, padding: spacing.md },
  teamRankHeader: {
    borderLeftWidth: 3,
    paddingLeft: spacing.sm,
    marginBottom: 2,
  },
  teamRankTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  teamMemberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 5,
    borderTopWidth: 1,
    borderTopColor: `${colors.border}60`,
  },
  teamMemberRank: { width: 20, fontSize: 13, textAlign: 'center' },
  teamMemberName: { flex: 1, fontSize: fontSize.sm, color: colors.textPrimary, fontWeight: fontWeight.medium },
  teamMemberPct: { fontSize: fontSize.sm, fontWeight: fontWeight.bold },

  // Group standings
  listColumnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  colLabel: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: fontWeight.medium },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.border}50`,
  },
  groupRowMe: { backgroundColor: `${colors.emerald}0a` },
  groupRankCell: { width: 40, alignItems: 'center' },
  rankEmoji: { fontSize: 18 },
  rankNum: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textSecondary },
  groupAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgCardAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  groupAvatarMe: { borderColor: colors.emerald, backgroundColor: colors.emeraldDim },
  groupAvatarText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.textSecondary },
  groupNameCol: { flex: 1, gap: 2, minWidth: 0 },
  groupName: { fontSize: fontSize.md, fontWeight: fontWeight.medium, color: colors.textPrimary },
  groupActivityRow: { flexDirection: 'row', gap: spacing.sm },
  groupActivityTag: { fontSize: 10, color: colors.textMuted },
  groupPoints: { width: 40, fontSize: fontSize.sm, fontWeight: fontWeight.bold, textAlign: 'right' },
  groupPct: { width: 48, fontSize: fontSize.sm, fontWeight: fontWeight.bold, textAlign: 'right', marginLeft: spacing.sm },

  // Members tab
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.border}50`,
  },
  memberRowMe: { backgroundColor: `${colors.emerald}0a` },
  memberRankNum: { width: 28, fontSize: fontSize.sm, color: colors.textMuted, fontWeight: fontWeight.medium },
  memberAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.bgCardAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  memberAvatarMe: { borderColor: colors.emerald, backgroundColor: colors.emeraldDim },
  memberAvatarText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.textSecondary },
  memberInfo: { flex: 1, gap: 2, minWidth: 0 },
  memberName: { fontSize: fontSize.md, fontWeight: fontWeight.medium, color: colors.textPrimary },
  memberTeamTag: { fontSize: fontSize.xs, color: colors.textMuted },
  memberRight: { alignItems: 'flex-end', gap: 2 },
  memberPct: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
  memberDays: { fontSize: fontSize.xs, color: colors.textMuted },

  // Empty states
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xxl,
  },
  emptyStateTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.semibold, color: colors.textSecondary },
  emptyStateText: { fontSize: fontSize.md, color: colors.textMuted, textAlign: 'center' },
  emptyCardText: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.md },
})
