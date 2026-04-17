import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Card } from './ui/Card'
import { LoadingSpinner } from './ui/LoadingSpinner'
import { usePersonalStats } from '../hooks/useLeaderboard'
import { consistencyColor, formatPct, rankBadge } from '../utils/consistency'
import { colors, spacing, fontSize, fontWeight, radius } from '../constants/theme'
import type { AllComparativeRanks, MetricContext, MetricRanks } from '../types'

// ─── Stat item ────────────────────────────────────────────────────────────────

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

// ─── Consistency bar ──────────────────────────────────────────────────────────

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

// ─── How You Compare card ─────────────────────────────────────────────────────

type CompCtx = 'global' | 'gender' | 'country'

function topBadgeColor(pct: number) {
  if (pct <= 10) return colors.emerald
  if (pct <= 25) return colors.amber
  return colors.textSecondary
}

function MetricRow({
  emoji,
  label,
  mr,
  isLast,
}: {
  emoji: string
  label: string
  mr: MetricRanks
  isLast: boolean
}) {
  const pct = mr.total > 0 ? Math.ceil((mr.rank / mr.total) * 100) : 0
  const badgeColor = topBadgeColor(pct)

  return (
    <View style={[styles.metricRow, !isLast && styles.metricRowBorder]}>
      <Text style={styles.metricEmoji}>{emoji}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricRank}>#{mr.rank}</Text>
      <Text style={styles.metricOf}>of {mr.total}</Text>
      <View style={[styles.topBadge, { backgroundColor: `${badgeColor}20` }]}>
        <Text style={[styles.topBadgeText, { color: badgeColor }]}>Top {pct}%</Text>
      </View>
    </View>
  )
}

function RankComparisonCard({ ranks }: { ranks: AllComparativeRanks }) {
  const [ctx, setCtx] = useState<CompCtx>('global')

  const genderLabel = ranks.gender === 'male' ? 'Males' : ranks.gender === 'female' ? 'Females' : 'Gender'
  const countryLabel = ranks.country ?? 'Country'

  type CtxOption = { key: CompCtx; label: string; emoji: string; available: boolean }
  const ctxOptions: CtxOption[] = [
    { key: 'global', label: 'Global', emoji: '🌍', available: true },
    { key: 'gender', label: genderLabel, emoji: '👤', available: ranks.gender != null },
    { key: 'country', label: countryLabel, emoji: '🌐', available: ranks.country != null },
  ]

  type MetricDef = { emoji: string; label: string; context: MetricContext }
  const metrics: MetricDef[] = [
    { emoji: '📊', label: 'Consistency', context: ranks.consistency },
    { emoji: '📖', label: 'Quran', context: ranks.quran },
    { emoji: '🌙', label: 'Fasting', context: ranks.fasting },
    { emoji: '🌟', label: 'Qiyam', context: ranks.qiyam },
    { emoji: '⭐', label: 'Points', context: ranks.points },
  ]

  const getCtxRanks = (mc: MetricContext): MetricRanks | null => {
    if (ctx === 'global') return mc.global
    if (ctx === 'gender') return mc.gender
    return mc.country
  }

  // Switch to global if selected context becomes unavailable
  const activeCtx: CompCtx = ctxOptions.find(c => c.key === ctx && c.available) ? ctx : 'global'

  return (
    <Card style={styles.compCard}>
      <View style={styles.compHeader}>
        <Ionicons name="podium-outline" size={16} color={colors.textSecondary} />
        <Text style={styles.compTitle}>How You Compare</Text>
      </View>

      {/* Context toggle chips */}
      <View style={styles.ctxRow}>
        {ctxOptions.filter(c => c.available).map(c => {
          const isActive = activeCtx === c.key
          return (
            <TouchableOpacity
              key={c.key}
              onPress={() => setCtx(c.key)}
              style={[styles.ctxChip, isActive && styles.ctxChipActive]}
              activeOpacity={0.7}
            >
              <Text style={[styles.ctxChipText, isActive && styles.ctxChipTextActive]}>
                {c.emoji} {c.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* Metric rows */}
      <View style={styles.metricList}>
        {metrics.map((m, i) => {
          const mr = getCtxRanks(m.context)
          if (!mr) return null
          return (
            <MetricRow
              key={m.label}
              emoji={m.emoji}
              label={m.label}
              mr={mr}
              isLast={i === metrics.length - 1}
            />
          )
        })}
      </View>
    </Card>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PersonalStats() {
  const { stats, allComparativeRanks, loading } = usePersonalStats()

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

      {/* Activity breakdown */}
      <Card style={styles.breakdownCard}>
        <Text style={styles.breakdownTitle}>Activity Breakdown</Text>
        <View style={styles.bars}>
          <ConsistencyBar label="Quran" pct={stats.reading_consistency_pct} color={colors.emerald} />
          <ConsistencyBar label="Fasting" pct={stats.fasting_consistency_pct} color={colors.amber} />
          <ConsistencyBar label="Qiyam" pct={stats.qiyam_consistency_pct} color={colors.purple} />
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

      {/* Comparative rankings — appears when data is ready */}
      {allComparativeRanks && allComparativeRanks.consistency.global.total > 0 && (
        <RankComparisonCard ranks={allComparativeRanks} />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },

  // Main stats card
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

  // Breakdown card
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

  // Comparison card
  compCard: { gap: spacing.md },
  compHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  compTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },

  // Context toggle
  ctxRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  ctxChip: {
    paddingHorizontal: spacing.md,
    height: 32,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.bgCardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctxChipActive: {
    borderColor: colors.emerald,
    backgroundColor: colors.emeraldDim,
  },
  ctxChipText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.textMuted,
  },
  ctxChipTextActive: {
    color: colors.emeraldLight,
    fontWeight: fontWeight.semibold,
  },

  // Metric rows
  metricList: { gap: 0 },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  metricRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  metricEmoji: { fontSize: 16, width: 22, textAlign: 'center' },
  metricLabel: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  metricRank: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    minWidth: 36,
    textAlign: 'right',
  },
  metricOf: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    minWidth: 44,
  },
  topBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  topBadgeText: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
  },
})
