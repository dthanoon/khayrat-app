import React, { useState, useEffect, useLayoutEffect } from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { useLocalSearchParams, useNavigation } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Card } from '../../src/components/ui/Card'
import { ActivityHeatmap } from '../../src/components/ActivityHeatmap'
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner'
import { getProfile } from '../../src/services/profiles'
import { getUserStatsAndRank, getUserStreak } from '../../src/services/leaderboard'
import { consistencyColor, formatPct, rankBadge } from '../../src/utils/consistency'
import { colors, spacing, fontSize, fontWeight, radius } from '../../src/constants/theme'
import type { Profile, UserStats } from '../../src/types'

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const navigation = useNavigation()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<{ stats: UserStats; rank: number } | null>(null)
  const [streak, setStreak] = useState(0)
  const [loading, setLoading] = useState(true)

  useLayoutEffect(() => {
    if (profile) {
      navigation.setOptions({ title: `@${profile.username}` })
    }
  }, [profile, navigation])

  useEffect(() => {
    Promise.all([
      getProfile(id),
      getUserStatsAndRank(id),
      getUserStreak(id),
    ])
      .then(([p, s, str]) => {
        setProfile(p)
        setStats(s)
        setStreak(str)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <LoadingSpinner fullScreen message="Loading profile…" />
  if (!profile) {
    return (
      <View style={styles.notFound}>
        <Ionicons name="person-outline" size={48} color={colors.textMuted} />
        <Text style={styles.notFoundText}>User not found</Text>
      </View>
    )
  }

  const cColor = stats ? consistencyColor(stats.stats.consistency_pct) : colors.textMuted

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      {/* Profile header */}
      <Card style={styles.profileCard}>
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{profile.username[0]?.toUpperCase()}</Text>
          </View>
          <View style={styles.nameBlock}>
            <Text style={styles.displayName}>@{profile.username}</Text>
          </View>
        </View>

        {/* Meta row */}
        <View style={styles.metaRow}>
          {profile.country && (
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={13} color={colors.textMuted} />
              <Text style={styles.metaText}>{profile.country}</Text>
            </View>
          )}
          {profile.gender && (
            <View style={styles.metaItem}>
              <Ionicons name="person-outline" size={13} color={colors.textMuted} />
              <Text style={styles.metaText}>
                {profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)}
              </Text>
            </View>
          )}
        </View>
      </Card>

      {/* Stats */}
      {stats && (
        <Card style={styles.statsCard}>
          <View style={styles.statsRow}>
            <StatBox label="Rank" value={rankBadge(stats.rank)} color={colors.purple} />
            <StatBox label="Consistency" value={formatPct(stats.stats.consistency_pct)} color={cColor} />
            <StatBox label="Streak" value={`${streak}d`} color={colors.amber} />
          </View>

          <View style={styles.barSection}>
            {[
              { label: 'Quran', pct: stats.stats.reading_consistency_pct, color: colors.emerald },
              { label: 'Fasting', pct: stats.stats.fasting_consistency_pct, color: colors.amber },
              { label: 'Qiyam', pct: stats.stats.qiyam_consistency_pct, color: colors.purple },
            ].map(({ label, pct, color }) => (
              <View key={label} style={styles.barRow}>
                <Text style={styles.barLabel}>{label}</Text>
                <View style={styles.barTrack}>
                  <View
                    style={[styles.barFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: color }]}
                  />
                </View>
                <Text style={[styles.barPct, { color }]}>{formatPct(pct)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.bottomStats}>
            <MiniStat label="Active Days" value={stats.stats.active_days} />
            <MiniStat label="Days Tracked" value={stats.stats.days_since_joining} />
            <MiniStat label="Total Points" value={stats.stats.total_points} />
          </View>
        </Card>
      )}

      {/* Activity heatmap */}
      <Card>
        <ActivityHeatmap userId={id} />
      </Card>

      <View style={{ height: spacing.xxl }} />
    </ScrollView>
  )
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statBoxValue, { color }]}>{value}</Text>
      <Text style={styles.statBoxLabel}>{label}</Text>
    </View>
  )
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.miniStat}>
      <Text style={styles.miniStatValue}>{value}</Text>
      <Text style={styles.miniStatLabel}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.lg, gap: spacing.xl },
  notFound: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  notFoundText: { fontSize: fontSize.lg, color: colors.textMuted },

  profileCard: { gap: spacing.lg },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.bgCardAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: fontWeight.bold,
    color: colors.textSecondary,
  },
  nameBlock: { flex: 1, gap: 4 },
  displayName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  username: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: fontSize.sm, color: colors.textMuted },

  statsCard: { gap: spacing.lg },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statBox: { alignItems: 'center', gap: 4 },
  statBoxValue: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
  },
  statBoxLabel: { fontSize: fontSize.xs, color: colors.textMuted },

  barSection: { gap: spacing.md },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  barLabel: { fontSize: fontSize.sm, color: colors.textSecondary, width: 52 },
  barTrack: {
    flex: 1,
    height: 6,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: radius.full },
  barPct: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, width: 36, textAlign: 'right' },

  bottomStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  miniStat: { alignItems: 'center', gap: 4 },
  miniStatValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  miniStatLabel: { fontSize: fontSize.xs, color: colors.textMuted },
})
