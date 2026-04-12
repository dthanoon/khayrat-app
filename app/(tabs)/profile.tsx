import React from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { PersonalStats } from '../../src/components/PersonalStats'
import { ActivityHeatmap } from '../../src/components/ActivityHeatmap'
import { Card } from '../../src/components/ui/Card'
import { useAuth } from '../../src/hooks/useAuth'
import { colors, spacing, fontSize, fontWeight, radius } from '../../src/constants/theme'

export default function ProfileScreen() {
  const router = useRouter()
  const { profile, userId, email, signOut } = useAuth()

  if (!userId) return null

  const displayName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ')

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      {/* Profile card */}
      <Card style={styles.profileCard}>
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(profile?.username ?? '?')[0].toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            {displayName ? (
              <>
                <Text style={styles.displayName}>{displayName}</Text>
                <Text style={styles.username}>@{profile?.username}</Text>
              </>
            ) : (
              <Text style={styles.displayName}>@{profile?.username}</Text>
            )}
            <Text style={styles.email}>{email}</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/settings')}
            style={styles.editBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Meta */}
        <View style={styles.metaRow}>
          {profile?.country && (
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={14} color={colors.textMuted} />
              <Text style={styles.metaText}>{profile.country}</Text>
            </View>
          )}
          {profile?.gender && (
            <View style={styles.metaItem}>
              <Ionicons name="person-outline" size={14} color={colors.textMuted} />
              <Text style={styles.metaText}>
                {profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)}
              </Text>
            </View>
          )}
          {profile?.age && (
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
              <Text style={styles.metaText}>{profile.age} years</Text>
            </View>
          )}
        </View>
      </Card>

      {/* Stats */}
      <PersonalStats />

      {/* Activity heatmap */}
      <Card>
        <ActivityHeatmap userId={userId} />
      </Card>

      {/* Sign out */}
      <TouchableOpacity onPress={signOut} style={styles.signOutBtn} activeOpacity={0.8}>
        <Ionicons name="log-out-outline" size={18} color={colors.error} />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <View style={{ height: spacing.xxl }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: {
    padding: spacing.lg,
    gap: spacing.xl,
  },
  profileCard: { gap: spacing.lg },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.lg,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.emeraldDim,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.emerald,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: fontWeight.bold,
    color: colors.emeraldLight,
  },
  profileInfo: { flex: 1, gap: 4 },
  displayName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  username: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  email: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  editBtn: {
    padding: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: `${colors.error}40`,
    backgroundColor: `${colors.error}0a`,
  },
  signOutText: {
    fontSize: fontSize.md,
    color: colors.error,
    fontWeight: fontWeight.medium,
  },
})
