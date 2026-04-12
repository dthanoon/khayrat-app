import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { colors, fontSize } from '../../src/constants/theme'

type IoniconsName = keyof typeof Ionicons.glyphMap

function TabIcon({ name, focused }: { name: IoniconsName; focused: boolean }) {
  return (
    <Ionicons
      name={focused ? name : (`${name}-outline` as IoniconsName)}
      size={24}
      color={focused ? colors.emerald : colors.textMuted}
    />
  )
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.bgCard },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { fontWeight: '600', color: colors.textPrimary },
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: colors.bgCard,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.emerald,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: fontSize.xs, fontWeight: '500' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
          headerTitle: 'Khayrat',
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Ranks',
          tabBarIcon: ({ focused }) => <TabIcon name="trophy" focused={focused} />,
          headerTitle: 'Leaderboard',
        }}
      />
      <Tabs.Screen
        name="arenas"
        options={{
          title: 'Arenas',
          tabBarIcon: ({ focused }) => <TabIcon name="shield" focused={focused} />,
          headerTitle: 'Arenas',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon name="person" focused={focused} />,
          headerTitle: 'My Profile',
        }}
      />
    </Tabs>
  )
}
