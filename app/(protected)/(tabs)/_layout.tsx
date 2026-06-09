import React from 'react'
import { Tabs } from 'expo-router'
import { BottomTabBar } from '@/components'

/**
 * Bottom tab navigator for the authenticated area.
 *
 * Four tabs mirroring the web Employee Zone: Dashboard, Bitpoints, Incentives,
 * Profile. The visuals are rendered by the custom floating pill {@link BottomTabBar}
 * (icons + active-tab labels are configured there).
 */
export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{ headerShown: false, animation: 'fade' }}
    >
      <Tabs.Screen name="dashboard/index" options={{ title: 'Home' }} />
<<<<<<< HEAD
      {/* bitpoints/ route repurposed as the Collab Days screen (path unchanged). */}
      <Tabs.Screen name="bitpoints/index" options={{ title: 'Collab Days' }} />
=======
      <Tabs.Screen name="bitpoints/index" options={{ title: 'Bitpoints' }} />
>>>>>>> 7bd40f4462d6b8d134c54f2d6eb8b38d2134af43
      <Tabs.Screen name="incentives/index" options={{ title: 'Incentives' }} />
      <Tabs.Screen name="profile/index" options={{ title: 'Profile' }} />
    </Tabs>
  )
}
