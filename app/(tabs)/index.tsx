import React from 'react'
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { DailyLogger } from '../../src/components/DailyLogger'
import { PersonalStats } from '../../src/components/PersonalStats'
import { ArenaCard } from '../../src/components/ArenaCard'
import { useAuth } from '../../src/hooks/useAuth'
import { useArenas } from '../../src/hooks/useArenas'
import { colors, spacing, fontSize, fontWeight } from '../../src/constants/theme'

export default function DashboardScreen() {
  const router = useRouter()
  const { profile } = useAuth()
  const { arenas, loading: arenasLoading, refreshing, refresh, leave } = useArenas()

  const myArenas = arenas.filter(a => a.is_member)

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
          tintColor={colors.emerald}
        />
      }
    >
      {/* Greeting */}
      <View style={styles.greeting}>
        <View>
          <Text style={styles.greetingText}>{greeting()},</Text>
          <Text style={styles.username}>
            {profile?.first_name ?? profile?.username ?? 'Friend'} 👋
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/settings')}
          style={styles.settingsBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="settings-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Daily Logger */}
      <Section title="Log Today">
        <DailyLogger />
      </Section>

      {/* Personal Stats */}
      <Section title="Your Stats">
        <PersonalStats />
      </Section>

      {/* My Arenas */}
      {myArenas.length > 0 && (
        <Section title="My Arenas">
          {myArenas.map(arena => (
            <ArenaCard
              key={arena.id}
              arena={arena}
              onLeave={leave}
            />
          ))}
        </Section>
      )}


      <View style={styles.bottomPad} />
    </ScrollView>
  )
}

function Section({
  title,
  children,
  action,
}: {
  title: string
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {action}
      </View>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: {
    padding: spacing.lg,
    gap: spacing.xl,
  },
  greeting: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
  },
  greetingText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  username: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  settingsBtn: {
    padding: spacing.sm,
  },
  section: { gap: spacing.md },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  bottomPad: { height: spacing.xl },
})
