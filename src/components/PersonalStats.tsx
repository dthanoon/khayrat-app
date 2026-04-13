import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Card } from './ui/Card'
import { LoadingSpinner } from './ui/LoadingSpinner'
import { usePersonalStats } from '../hooks/useLeaderboard'
import { consistencyColor, formatPct, rankBadge } from '../utils/consistency'
import { colors, spacing, fontSize, fontWeight, radius } from '../constants/theme'

interface StatItemProps {
  label: string
  value: string
  sub?: string
  color?: string
  icon?: keyof typeof Ionicons.glyphMap
}

function StatItem({ label, value, sub, color, icon }: StatItemProps) {
  return (
    <View style={styles.statItem}>
      {icon && <Ionicons name={icon} size={16} color={color ?? colors.textSecondary} style={styles.statIcon} />}
      <Text style={[styles.statValue, color ? { color } : {}]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sub && <Text style={styles.statSub}>{sub}</Text>}
    </View>
  )
}

interface BarProps {
  pct: number
  color: string
  label: string
}

function ConsistencyBar({ pct, color, label }: BarProps) {
  return (
    <View style={styles.barRow}>
      <Text style={styles.barLabel}>{label}</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.barPct, { color }]}>{formatPct(pct)}</Text>
    </View>
  )
}

export function PersonalStats() {
  const { stats, loading } = usePersonalStats()

  if (loading) return <LoadingSpinner message="Loading stats…" />
  if (!stats) return null

  const cColor = consistencyColor(stats.consistency_pct)

  return (
    <View style={styles.container}>
      {/* Main stats row */}
      <Card style={styles.mainCard}>
        <View style={styles.mainRow}>
          <StatItem
            label="Streak"
            value={`${stats.streak}`}
            sub="days"
            color={colors.amber}
            icon="flame-outline"
          />
          <View style={styles.divider} />
          <StatItem
            label="Consistency"
            value={formatPct(stats.consistency_pct)}
            color={cColor}
            icon="trending-up-outline"
          />
          <View style={styles.divider} />
          <StatItem
            label="Rank"
            value={stats.rank ? rankBadge(stats.rank) : '—'}
            color={colors.purple}
            icon="trophy-outline"
          />
        </View>
      </Card>

      {/* Category breakdown */}
      <Card style={styles.breakdownCard}>
        <Text style={styles.breakdownTitle}>Activity Breakdown</Text>
        <View style={styles.bars}>
          <ConsistencyBar
            label="Quran"
            pct={stats.reading_consistency_pct}
            color={colors.emerald}
          />
          <ConsistencyBar
            label="Fasting"
            pct={stats.fasting_consistency_pct}
            color={colors.amber}
          />
          <ConsistencyBar
            label="Qiyam"
            pct={stats.qiyam_consistency_pct}
            color={colors.purple}
          />
        </View>
        <View style={styles.secondaryRow}>
          <View style={styles.secondaryItem}>
            <Text style={styles.secondaryValue}>{stats.active_days}</Text>
            <Text style={styles.secondaryLabel}>Active Days</Text>
          </View>
          <View style={styles.secondaryItem}>
            <Text style={styles.secondaryValue}>{stats.days_since_joining}</Text>
            <Text style={styles.secondaryLabel}>Days Tracked</Text>
          </View>
          <View style={styles.secondaryItem}>
            <Text style={styles.secondaryValue}>{stats.total_points}</Text>
            <Text style={styles.secondaryLabel}>Total Points</Text>
          </View>
        </View>
      </Card>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  mainCard: {},
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  statIcon: { marginBottom: 2 },
  statValue: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
  },
  statSub: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },

  breakdownCard: { gap: spacing.lg },
  breakdownTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  bars: { gap: spacing.md },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  barLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    width: 52,
  },
  barTrack: {
    flex: 1,
    height: 6,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  barPct: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    width: 36,
    textAlign: 'right',
  },

  secondaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  secondaryItem: { alignItems: 'center', gap: 4 },
  secondaryValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  secondaryLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
})
