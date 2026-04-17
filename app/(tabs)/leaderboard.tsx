import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LeaderboardList } from '../../src/components/LeaderboardList'
import { useLeaderboard } from '../../src/hooks/useLeaderboard'
import { useAuth } from '../../src/hooks/useAuth'
import { colors, spacing, fontSize, fontWeight, radius } from '../../src/constants/theme'
import type { LeaderboardSort } from '../../src/types'

const TABS: { key: LeaderboardSort; label: string; icon: string }[] = [
  { key: 'consistency_pct', label: 'Consistency', icon: '📊' },
  { key: 'total_points', label: 'Points', icon: '⭐' },
  { key: 'reading_consistency_pct', label: 'Quran', icon: '📖' },
  { key: 'fasting_consistency_pct', label: 'Fasting', icon: '🌙' },
  { key: 'qiyam_consistency_pct', label: 'Qiyam', icon: '🌟' },
]

const GENDERS = [
  { value: '', label: 'All' },
  { value: 'male', label: 'Males' },
  { value: 'female', label: 'Females' },
]

export default function LeaderboardScreen() {
  const { userId } = useAuth()
  const [activeTab, setActiveTab] = useState<LeaderboardSort>('consistency_pct')
  const [showFilter, setShowFilter] = useState(false)

  const { entries, loading, refreshing, filters, setFilters, refresh } = useLeaderboard(activeTab)

  const hasFilters = !!filters.gender || !!filters.country

  return (
    <View style={styles.container}>
      {/* Sort tabs */}
      <View style={styles.tabsScroll}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
        >
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.8}
          >
            <Text style={styles.tabEmoji}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
        </ScrollView>
      </View>

      {/* Filter button */}
      <View style={styles.filterRow}>
        <Text style={styles.countLabel}>
          {entries.length} ranked players
        </Text>
        <TouchableOpacity
          style={[styles.filterBtn, hasFilters && styles.filterBtnActive]}
          onPress={() => setShowFilter(true)}
          activeOpacity={0.8}
        >
          <Ionicons
            name="options-outline"
            size={16}
            color={hasFilters ? colors.emerald : colors.textSecondary}
          />
          <Text style={[styles.filterBtnText, hasFilters && styles.filterBtnTextActive]}>
            Filter{hasFilters ? ' •' : ''}
          </Text>
        </TouchableOpacity>
      </View>

      <LeaderboardList
        entries={entries}
        loading={loading}
        refreshing={refreshing}
        onRefresh={refresh}
        currentUserId={userId}
        sortKey={activeTab}
      />

      {/* Filter modal */}
      <Modal
        visible={showFilter}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilter(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setShowFilter(false)}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Filter Leaderboard</Text>

            <Text style={styles.filterSectionLabel}>Gender</Text>
            <View style={styles.chipRow}>
              {GENDERS.map(g => (
                <TouchableOpacity
                  key={g.value}
                  style={[
                    styles.chip,
                    filters.gender === g.value && styles.chipActive,
                  ]}
                  onPress={() => setFilters({ ...filters, gender: g.value as 'male' | 'female' | undefined })}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, filters.gender === g.value && styles.chipTextActive]}>
                    {g.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {hasFilters && (
              <TouchableOpacity
                style={styles.clearBtn}
                onPress={() => { setFilters({}); setShowFilter(false) }}
              >
                <Text style={styles.clearBtnText}>Clear Filters</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.applyBtn}
              onPress={() => setShowFilter(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.applyBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  tabsScroll: {
    height: 54,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabs: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: {
    backgroundColor: colors.emeraldDim,
    borderColor: colors.emerald,
  },
  tabEmoji: { fontSize: 13, lineHeight: 18 },
  tabLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  tabLabelActive: { color: colors.emeraldLight },

  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  countLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterBtnActive: { borderColor: colors.emerald },
  filterBtnText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  filterBtnTextActive: { color: colors.emerald },

  // Modal
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
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  sheetTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  filterSectionLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.bgInput,
  },
  chipActive: { borderColor: colors.emerald, backgroundColor: colors.emeraldDim },
  chipText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  chipTextActive: { color: colors.emeraldLight },
  clearBtn: { alignItems: 'center', padding: spacing.sm },
  clearBtnText: { fontSize: fontSize.md, color: colors.textMuted },
  applyBtn: {
    backgroundColor: colors.emerald,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  applyBtnText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: '#000',
  },
})
