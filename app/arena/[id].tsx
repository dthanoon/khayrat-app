import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native'
import { useLocalSearchParams, useNavigation } from 'expo-router'
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

export default function ArenaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const navigation = useNavigation()
  const { userId } = useAuth()
  const { join, leave } = useArenas()
  const { arena, standings, memberStats, groupLeaderboard, loading, reload } = useArenaDetail(id)

  const [activeTab, setActiveTab] = useState<Tab>('standings')

  useLayoutEffect(() => {
    if (arena) {
      navigation.setOptions({ title: arena.name })
    }
  }, [arena, navigation])

  if (loading || !arena) return <LoadingSpinner fullScreen message="Loading arena…" />

  const status = arenaStatusLabel(arena.starts_at, arena.ends_at)
  const statusVariant = status === 'Active' ? 'emerald' : status === 'Upcoming' ? 'amber' : 'gray'
  const isBattle = arena.arena_type === 'battle'
  const isMember = arena.is_member

  const handleJoin = () => {
    if (isBattle && arena.join_mode === 'free') {
      // For simplicity, default to team A; the Arenas screen has the full flow
      join(arena, 'a')
    } else {
      join(arena)
    }
    setTimeout(reload, 500)
  }

  const handleLeave = () => {
    leave(arena.id)
    setTimeout(reload, 500)
  }

  return (
    <View style={styles.container}>
      <ScrollView stickyHeaderIndices={[1]}>
        {/* Arena header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.arenaName}>{arena.name}</Text>
            <Badge label={status} variant={statusVariant} />
          </View>
          <View style={styles.headerMeta}>
            <Badge label={isBattle ? 'Battle' : 'Group'} variant={isBattle ? 'purple' : 'sky'} size="sm" />
            <Text style={styles.dates}>
              {formatDateShort(arena.starts_at)} – {formatDateShort(arena.ends_at)}
            </Text>
          </View>

          {/* Team overview for battle arenas */}
          {isBattle && (
            <View style={styles.teamsRow}>
              <Card style={styles.teamCard}>
                <Text style={styles.teamCardName} numberOfLines={1}>
                  {arena.team_a_name ?? 'Team A'}
                </Text>
                <Text style={styles.teamCardCount}>{arena.team_a_count ?? 0}</Text>
                <Text style={styles.teamCardLabel}>members</Text>
                {standings[0] && (
                  <Text style={[styles.teamAvg, { color: consistencyColor(standings[0].avg_reading_pct) }]}>
                    {formatPct(standings[0].avg_reading_pct)} avg
                  </Text>
                )}
              </Card>

              <View style={styles.vsBox}>
                <Text style={styles.vsText}>VS</Text>
              </View>

              <Card style={[styles.teamCard, styles.teamCardRight]}>
                <Text style={styles.teamCardName} numberOfLines={1}>
                  {arena.team_b_name ?? 'Team B'}
                </Text>
                <Text style={styles.teamCardCount}>{arena.team_b_count ?? 0}</Text>
                <Text style={styles.teamCardLabel}>members</Text>
                {standings[1] && (
                  <Text style={[styles.teamAvg, { color: consistencyColor(standings[1].avg_reading_pct) }]}>
                    {formatPct(standings[1].avg_reading_pct)} avg
                  </Text>
                )}
              </Card>
            </View>
          )}

          {/* Member count for group arenas */}
          {!isBattle && (
            <View style={styles.groupCount}>
              <Ionicons name="people-outline" size={16} color={colors.textMuted} />
              <Text style={styles.groupCountText}>
                {arena.member_count ?? 0}
                {arena.max_members ? ` / ${arena.max_members}` : ''} members
              </Text>
            </View>
          )}

          {/* Join/leave */}
          {status !== 'Ended' && (
            <View style={styles.joinRow}>
              {isMember ? (
                <View style={styles.memberRow}>
                  <View style={styles.memberBadge}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.emerald} />
                    <Text style={styles.memberBadgeText}>
                      Member{isBattle && arena.my_team
                        ? ` · ${arena.my_team === 'a' ? arena.team_a_name : arena.team_b_name}`
                        : ''}
                    </Text>
                  </View>
                  <Button
                    title="Leave"
                    onPress={handleLeave}
                    variant="ghost"
                    size="sm"
                    textStyle={{ color: colors.textMuted }}
                  />
                </View>
              ) : (
                status === 'Active' && (
                  <Button
                    title="Join Arena"
                    onPress={handleJoin}
                    fullWidth
                    size="md"
                  />
                )
              )}
            </View>
          )}
        </View>

        {/* Tabs header (sticky) */}
        <View style={styles.tabsContainer}>
          {(['standings', 'members', 'chat'] as Tab[]).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab content */}
        {activeTab === 'standings' && (
          <View style={styles.tabContent}>
            {isBattle ? (
              <BattleStandings
                standings={standings}
                memberStats={memberStats}
                teamAName={arena.team_a_name ?? 'Team A'}
                teamBName={arena.team_b_name ?? 'Team B'}
              />
            ) : (
              <GroupLeaderboard entries={groupLeaderboard} currentUserId={userId} />
            )}
          </View>
        )}

        {activeTab === 'members' && (
          <MembersList memberStats={memberStats} currentUserId={userId} />
        )}
      </ScrollView>

      {/* Chat is full-height, outside the scrollview */}
      {activeTab === 'chat' && userId && (
        <View style={styles.chatContainer}>
          <ArenaChat arenaId={id} currentUserId={userId} />
        </View>
      )}
    </View>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function BattleStandings({
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
  const teamA = memberStats.filter(m => m.team === 'a')
  const teamB = memberStats.filter(m => m.team === 'b')

  return (
    <View style={styles.battleContent}>
      <MemberLeaderboard members={teamA} title={teamAName} />
      <MemberLeaderboard members={teamB} title={teamBName} />
    </View>
  )
}

function MemberLeaderboard({
  members,
  title,
}: {
  members: ReturnType<typeof useArenaDetail>['memberStats']
  title: string
}) {
  return (
    <Card style={styles.leaderCard}>
      <Text style={styles.leaderTitle}>{title}</Text>
      {members.length === 0 ? (
        <Text style={styles.emptyText}>No members yet</Text>
      ) : (
        members.map((m, i) => (
          <View key={m.user_id} style={styles.memberRow2}>
            <Text style={styles.memberRank}>
              {i < 3 ? rankBadge(i + 1) : `#${i + 1}`}
            </Text>
            <Text style={styles.memberName} numberOfLines={1}>{m.username}</Text>
            <Text style={[styles.memberPct, { color: consistencyColor(m.reading_pct) }]}>
              {formatPct(m.reading_pct)}
            </Text>
          </View>
        ))
      )}
    </Card>
  )
}

function GroupLeaderboard({
  entries,
  currentUserId,
}: {
  entries: ReturnType<typeof useArenaDetail>['groupLeaderboard']
  currentUserId: string | null
}) {
  return (
    <View style={styles.tabContent}>
      {entries.map((entry, i) => (
        <View
          key={entry.user_id}
          style={[styles.groupRow, entry.user_id === currentUserId && styles.groupRowMe]}
        >
          <Text style={styles.groupRank}>
            {i < 3 ? rankBadge(i + 1) : `#${entry.rank}`}
          </Text>
          <Text style={styles.groupUsername} numberOfLines={1}>{entry.username}</Text>
          <Text style={styles.groupPoints}>{entry.total_points} pts</Text>
        </View>
      ))}
      {entries.length === 0 && (
        <Text style={styles.emptyText}>No data yet</Text>
      )}
    </View>
  )
}

function MembersList({
  memberStats,
  currentUserId,
}: {
  memberStats: ReturnType<typeof useArenaDetail>['memberStats']
  currentUserId: string | null
}) {
  return (
    <FlatList
      data={memberStats}
      keyExtractor={item => item.user_id}
      renderItem={({ item, index }) => (
        <View
          style={[
            styles.memberItem,
            item.user_id === currentUserId && styles.memberItemMe,
          ]}
        >
          <Text style={styles.memberRank}>#{index + 1}</Text>
          <View style={styles.memberAvatar}>
            <Text style={styles.memberAvatarText}>{item.username[0]?.toUpperCase()}</Text>
          </View>
          <Text style={styles.memberName2} numberOfLines={1}>{item.username}</Text>
          <Text style={[styles.memberPct2, { color: consistencyColor(item.reading_pct) }]}>
            {formatPct(item.reading_pct)}
          </Text>
        </View>
      )}
      contentContainerStyle={{ paddingBottom: 24 }}
      scrollEnabled={false}
    />
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    padding: spacing.lg,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  arenaName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    flex: 1,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dates: { fontSize: fontSize.xs, color: colors.textMuted },

  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  teamCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    padding: spacing.lg,
  },
  teamCardRight: { alignItems: 'center' },
  teamCardName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  teamCardCount: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  teamCardLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  teamAvg: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  vsBox: {
    width: 32,
    alignItems: 'center',
  },
  vsText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
  },

  groupCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  groupCountText: { fontSize: fontSize.sm, color: colors.textSecondary },

  joinRow: { paddingTop: spacing.sm },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  memberBadgeText: {
    fontSize: fontSize.sm,
    color: colors.emerald,
    fontWeight: fontWeight.medium,
  },

  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  tabBtnActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.emerald,
  },
  tabBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textMuted,
  },
  tabBtnTextActive: { color: colors.emerald },

  tabContent: { padding: spacing.lg, gap: spacing.md },
  chatContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    marginTop: 260, // approx header height
  },

  battleContent: { gap: spacing.md },
  leaderCard: { gap: spacing.md },
  leaderTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
  },
  memberRow2: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  memberRank: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    width: 30,
    textAlign: 'center',
  },
  memberName: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    fontWeight: fontWeight.medium,
  },
  memberPct: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },

  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    gap: spacing.md,
  },
  groupRowMe: { backgroundColor: `${colors.emerald}0a` },
  groupRank: { fontSize: fontSize.md, color: colors.textMuted, width: 32 },
  groupUsername: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
  },
  groupPoints: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.amber,
  },

  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  memberItemMe: { backgroundColor: `${colors.emerald}0a` },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bgCardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textSecondary,
  },
  memberName2: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    fontWeight: fontWeight.medium,
  },
  memberPct2: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
})
