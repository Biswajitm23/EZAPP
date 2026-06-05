import React from 'react'
import { StatusBar } from 'react-native'
import { Stack } from 'expo-router'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider } from 'react-redux'
import { store } from '@/provider/store/store'
import { ThemeProvider, useTheme } from '@/constants/theme'
import { FeedbackProvider } from '@/components'
import '../global.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60 * 1000,
    },
  },
})

function ThemedStatusBar() {
  const { isDark, colors } = useTheme()
  return (
    <StatusBar
      barStyle={isDark ? 'light-content' : 'dark-content'}
      backgroundColor={colors.background.primary}
    />
  )
}

/**
 * Root layout — wires up every global provider once:
 *   SafeArea -> Theme -> ReactQuery -> Redux -> GestureHandler -> Router stack
 */
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider defaultMode="system">
        <ThemedStatusBar />
        <QueryClientProvider client={queryClient}>
          <Provider store={store}>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <FeedbackProvider>
                <Stack
                  screenOptions={{
                    headerShown: false,
                    animation: 'fade',
                    animationDuration: 280,
                  }}
                >
                  <Stack.Screen name="index" />
                  <Stack.Screen name="login" options={{ gestureEnabled: false }} />
                  <Stack.Screen name="(protected)" options={{ gestureEnabled: false }} />
                </Stack>
              </FeedbackProvider>
            </GestureHandlerRootView>
          </Provider>
        </QueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  )
}
