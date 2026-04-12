import React, { useState } from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  TextInput,
  RefreshControl,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { ArenaCard } from '../../src/components/ArenaCard'
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner'
import { Button } from '../../src/components/ui/Button'
import { useArenas } from '../../src/hooks/useArenas'
import { isArenaActive } from '../../src/utils/date'
import { colors, spacing, fontSize, fontWeight, radius } from '../../src/constants/theme'
import type { Arena } from '../../src/types'

type Filter = 'all' | 'mine' | 'active'

export default function ArenasScreen() {
  const { arenas, loading, refreshing, refresh, join, leave } = useArenas()
  const [filter, setFilter] = useState<Filter>('all')
  const [joinTarget, setJoinTarget] = useState<Arena | null>(null)
  const [inviteCode, setInviteCode] = useState('')
  const [selectedTeam, setSelectedTeam] = useState<'a' | 'b'>('a')

  const filtered = arenas.filter(arena => {
    if (filter === 'mine') return arena.is_member
    if (filter === 'active') return isArenaActive(arena.starts_at, arena.ends_at)
    return true
  })

  const handleJoinPress = (arena: Arena) => {
    if (arena.invite_code) {
      setJoinTarget(arena)
    } else if (arena.arena_type === 'battle' && arena.join_mode === 'free') {
      setJoinTarget(arena)
    } else {
      join(arena)
    }
  }

  const handleConfirmJoin = () => {
    if (!joinTarget) return
    join(joinTarget, selectedTeam, inviteCode)
    setJoinTarget(null)
    setInviteCode('')
  }

  if (loading) return <LoadingSpinner fullScreen message="Loading arenas…" />

  return (
    <View style={styles.container}>
      {/* Filter chips */}
      <View style={styles.filters}>
        {(['all', 'active', 'mine'] as Filter[]).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
              {f === 'all' ? 'All' : f === 'active' ? 'Active' : 'Joined'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <ArenaCard
            arena={item}
            onJoin={handleJoinPress}
            onLeave={leave}
          />
        )}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.emerald}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="shield-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No arenas found</Text>
            <Text style={styles.emptyText}>
              {filter === 'mine'
                ? 'You haven\'t joined any arenas yet'
                : 'Check back later for new competitions'}
            </Text>
          </View>
        }
      />

      {/* Join confirmation modal */}
      <Modal
        visible={!!joinTarget}
        transparent
        animationType="slide"
        onRequestClose={() => setJoinTarget(null)}
      >
        <Pressable style={styles.overlay} onPress={() => setJoinTarget(null)}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Join {joinTarget?.name}</Text>

            {/* Team selection for free-mode battle arenas */}
            {joinTarget?.arena_type === 'battle' && joinTarget.join_mode === 'free' && (
              <>
                <Text style={styles.teamLabel}>Choose your team:</Text>
                <View style={styles.teamRow}>
                  <TouchableOpacity
                    style={[styles.teamBtn, selectedTeam === 'a' && styles.teamBtnActive]}
                    onPress={() => setSelectedTeam('a')}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.teamBtnText, selectedTeam === 'a' && styles.teamBtnTextActive]}>
                      {joinTarget.team_a_name ?? 'Team A'}
                    </Text>
                    <Text style={styles.teamMemberCount}>
                      {joinTarget.team_a_count ?? 0} members
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.teamBtn, selectedTeam === 'b' && styles.teamBtnActive]}
                    onPress={() => setSelectedTeam('b')}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.teamBtnText, selectedTeam === 'b' && styles.teamBtnTextActive]}>
                      {joinTarget.team_b_name ?? 'Team B'}
                    </Text>
                    <Text style={styles.teamMemberCount}>
                      {joinTarget.team_b_count ?? 0} members
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Invite code input */}
            {joinTarget?.invite_code && (
              <>
                <Text style={styles.teamLabel}>Enter invite code:</Text>
                <TextInput
                  style={styles.codeInput}
                  value={inviteCode}
                  onChangeText={setInviteCode}
                  placeholder="Invite code"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  selectionColor={colors.emerald}
                />
              </>
            )}

            <Button
              title="Confirm Join"
              onPress={handleConfirmJoin}
              fullWidth
              size="lg"
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  filters: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.bgInput,
  },
  filterChipActive: { borderColor: colors.emerald, backgroundColor: colors.emeraldDim },
  filterChipText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  filterChipTextActive: { color: colors.emeraldLight },

  list: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  sep: { height: spacing.md },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    gap: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 260,
  },

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
  teamLabel: {
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
})
