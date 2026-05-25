/**
 * Tabs layout — add new tabs by:
 *   1. Create app/(tabs)/<name>.tsx
 *   2. Add a tabBarIcon and tabBarLabel in the <Tabs.Screen> below.
 *
 * The custom TabBar renders itself — its tab list is driven entirely by
 * the screens registered here.
 */
import { Tabs } from 'expo-router'
import { House, Dumbbell, TrendingUp, Trophy, Users } from 'lucide-react-native'
import TabBar, { TAB_BAR_HEIGHT } from '@/components/TabBar'
import { BG } from '@/lib/theme'

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: BG },
        // Extra bottom padding so content clears the floating tab bar
        tabBarStyle: { height: TAB_BAR_HEIGHT },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <House size={size} color={color} strokeWidth={1.6} />
          ),
        }}
      />

      <Tabs.Screen
        name="logger"
        options={{
          tabBarLabel: 'Log',
          tabBarIcon: ({ color, size }) => (
            <Dumbbell size={size} color={color} strokeWidth={1.6} />
          ),
        }}
      />

      <Tabs.Screen
        name="charts"
        options={{
          tabBarLabel: 'Progress',
          tabBarIcon: ({ color, size }) => (
            <TrendingUp size={size} color={color} strokeWidth={1.6} />
          ),
        }}
      />

      <Tabs.Screen
        name="records"
        options={{
          tabBarLabel: 'Records',
          tabBarIcon: ({ color, size }) => (
            <Trophy size={size} color={color} strokeWidth={1.6} />
          ),
        }}
      />

      <Tabs.Screen
        name="leaderboard"
        options={{
          tabBarLabel: 'Rank',
          tabBarIcon: ({ color, size }) => (
            <Users size={size} color={color} strokeWidth={1.6} />
          ),
        }}
      />
    </Tabs>
  )
}
