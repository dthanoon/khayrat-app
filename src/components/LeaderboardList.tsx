import React from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LoadingSpinner } from './ui/LoadingSpinner'
import { consistencyColor, formatPct, rankBadge } from '../utils/consistency'
import { colors, spacing, fontSize, fontWeight, radius } from '../constants/theme'
import type { LeaderboardEntry } from '../types'

interface RowProps {
  entry: LeaderboardEntry
  currentUserId?: string | null
  sortKey: string
}

function LeaderboardRow({ entry, currentUserId, sortKey }: RowProps) {
  const router = useRouter()
  const isMe = entry.user_id === currentUserId
  const rank = entry.rank ?? 0

  let displayValue: string
  if (sortKey === 'total_points') displayValue = String(entry.total_points)
  else if (sortKey === 'points_per_day') displayValue = (entry.points_per_day ?? 0).toFixed(1)
  else if (sortKey === 'reading_consistency_pct') displayValue = formatPct(entry.reading_consistency_pct)
  else if (sortKey === 'fasting_consistency_pct') displayValue = formatPct(entry.fasting_consistency_pct)
  else if (sortKey === 'qiyam_consistency_pct') displayValue = formatPct(entry.qiyam_consistency_pct)
  else displayValue = formatPct(entry.consistency_pct)

  const valueColor =
    sortKey === 'total_points' || sortKey === 'points_per_day'
      ? colors.amber
      : consistencyColor(
          sortKey === 'reading_consistency_pct'
            ? entry.reading_consistency_pct
            : sortKey === 'fasting_consistency_pct'
            ? entry.fasting_consistency_pct
            : sortKey === 'qiyam_consistency_pct'
            ? entry.qiyam_consistency_pct
            : entry.consistency_pct
        )

  return (
    <TouchableOpacity
      style={[styles.row, isMe && styles.rowHighlight]}
      onPress={() => router.push(`/user/${entry.user_id}`)}
      activeOpacity={0.7}
    >
      {/* Rank */}
      <View style={styles.rankCell}>
        {rank <= 3 ? (
          <Text style={styles.rankEmoji}>{rankBadge(rank)}</Text>
        ) : (
          <Text style={[styles.rankNum, rank <= 10 && { color: colors.amber }]}>
            #{rank}
          </Text>
        )}
      </View>

      {/* Avatar + username */}
      <View style={[styles.avatar, isMe && styles.avatarMe]}>
        <Text style={styles.avatarText}>{entry.username[0]?.toUpperCase()}</Text>
      </View>
      <View style={styles.nameCell}>
        <Text style={[styles.username, isMe && { color: colors.emerald }]} numberOfLines={1}>
          {entry.username}
          {isMe && <Text style={styles.meTag}> (you)</Text>}
        </Text>
        {entry.country && (
          <Text style={styles.country} numberOfLines={1}>
            {entry.country}
          </Text>
        )}
      </View>

      {/* Value */}
      <Text style={[styles.value, { color: valueColor }]}>{displayValue}</Text>
    </TouchableOpacity>
  )
}

interface LeaderboardListProps {
  entries: LeaderboardEntry[]
  loading: boolean
  refreshing: boolean
  onRefresh: () => void
  currentUserId?: string | null
  sortKey: string
  ListHeaderComponent?: React.ComponentType | React.ReactElement | null
}

export function LeaderboardList({
  entries,
  loading,
  refreshing,
  onRefresh,
  currentUserId,
  sortKey,
  ListHeaderComponent,
}: LeaderboardListProps) {
  if (loading) return <LoadingSpinner fullScreen message="Loading leaderboard…" />

  return (
    <FlatList
      data={entries}
      keyExtractor={(item) => item.user_id}
      renderItem={({ item }) => (
        <LeaderboardRow entry={item} currentUserId={currentUserId} sortKey={sortKey} />
      )}
      refreshing={refreshing}
      onRefresh={onRefresh}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Ionicons name="people-outline" size={40} color={colors.textMuted} />
          <Text style={styles.emptyText}>No entries yet</Text>
        </View>
      }
      contentContainerStyle={styles.list}
      ItemSeparatorComponent={() => <View style={styles.sep} />}
    />
  )
}

const styles = StyleSheet.create({
  list: { paddingBottom: 24 },
  sep: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.bg,
  },
  rowHighlight: {
    backgroundColor: `${colors.emerald}0a`,
  },
  rankCell: {
    width: 36,
    alignItems: 'center',
  },
  rankEmoji: { fontSize: 18 },
  rankNum: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.bgCardAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  avatarMe: {
    borderColor: colors.emerald,
    backgroundColor: colors.emeraldDim,
  },
  avatarText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  nameCell: { flex: 1, gap: 2 },
  username: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
  },
  meTag: {
    fontSize: fontSize.xs,
    color: colors.emerald,
    fontWeight: fontWeight.regular,
  },
  country: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  value: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    minWidth: 52,
    textAlign: 'right',
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    gap: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
})
