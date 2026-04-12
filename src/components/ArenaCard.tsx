import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Badge } from './ui/Badge'
import { arenaStatusLabel, formatDateShort } from '../utils/date'
import { colors, spacing, fontSize, fontWeight, radius } from '../constants/theme'
import type { Arena } from '../types'

interface ArenaCardProps {
  arena: Arena
  onJoin?: (arena: Arena) => void
  onLeave?: (arenaId: string) => void
}

export function ArenaCard({ arena, onJoin, onLeave }: ArenaCardProps) {
  const router = useRouter()
  const status = arenaStatusLabel(arena.starts_at, arena.ends_at)
  const isBattle = arena.arena_type === 'battle'

  const statusVariant = status === 'Active' ? 'emerald' : status === 'Upcoming' ? 'amber' : 'gray'

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/arena/${arena.id}`)}
      activeOpacity={0.8}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>{arena.name}</Text>
          <Badge label={status} variant={statusVariant} size="sm" />
        </View>
        <View style={styles.metaRow}>
          <Badge
            label={isBattle ? 'Battle' : 'Group'}
            variant={isBattle ? 'purple' : 'sky'}
            size="sm"
          />
          <Text style={styles.dates}>
            {formatDateShort(arena.starts_at)} – {formatDateShort(arena.ends_at)}
          </Text>
        </View>
      </View>

      {/* Teams / member count */}
      {isBattle ? (
        <View style={styles.teamsRow}>
          <View style={styles.team}>
            <Text style={styles.teamName} numberOfLines={1}>
              {arena.team_a_name ?? 'Team A'}
            </Text>
            <Text style={styles.teamCount}>{arena.team_a_count ?? 0} members</Text>
          </View>
          <View style={styles.vs}>
            <Text style={styles.vsText}>VS</Text>
          </View>
          <View style={[styles.team, styles.teamRight]}>
            <Text style={styles.teamName} numberOfLines={1}>
              {arena.team_b_name ?? 'Team B'}
            </Text>
            <Text style={styles.teamCount}>{arena.team_b_count ?? 0} members</Text>
          </View>
        </View>
      ) : (
        <View style={styles.groupInfo}>
          <Ionicons name="people-outline" size={16} color={colors.textMuted} />
          <Text style={styles.groupCount}>
            {arena.member_count ?? 0}
            {arena.max_members ? ` / ${arena.max_members}` : ''} members
          </Text>
        </View>
      )}

      {/* Join/leave button row */}
      {status !== 'Ended' && (onJoin || onLeave) && (
        <View style={styles.actionRow}>
          {arena.is_member ? (
            <View style={styles.joinedRow}>
              <View style={styles.joinedBadge}>
                <Ionicons name="checkmark-circle" size={14} color={colors.emerald} />
                <Text style={styles.joinedText}>
                  Joined{isBattle && arena.my_team ? ` · ${arena.my_team === 'a' ? arena.team_a_name : arena.team_b_name}` : ''}
                </Text>
              </View>
              {onLeave && (
                <TouchableOpacity
                  onPress={() => onLeave(arena.id)}
                  style={styles.leaveBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.leaveBtnText}>Leave</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            onJoin && status === 'Active' && (
              <TouchableOpacity
                style={styles.joinBtn}
                onPress={() => onJoin(arena)}
                activeOpacity={0.8}
              >
                <Text style={styles.joinBtnText}>Join Arena</Text>
              </TouchableOpacity>
            )
          )}
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: { gap: spacing.sm },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  name: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dates: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },

  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  team: { flex: 1, gap: 2 },
  teamRight: { alignItems: 'flex-end' },
  teamName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  teamCount: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  vs: {
    paddingHorizontal: spacing.sm,
  },
  vsText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
  },

  groupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  groupCount: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },

  actionRow: {
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  joinBtn: {
    backgroundColor: colors.emerald,
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  joinBtnText: {
    color: '#000',
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.md,
  },
  joinedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  joinedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  joinedText: {
    fontSize: fontSize.sm,
    color: colors.emerald,
    fontWeight: fontWeight.medium,
  },
  leaveBtn: {},
  leaveBtnText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
})
