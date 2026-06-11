import React from 'react'
import { StatusBar, View, Text, ScrollView, Pressable, StyleSheet } from 'react-native'
import { Stack, type ErrorBoundaryProps } from 'expo-router'
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
      <ThemeProvider defaultMode="light">
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

/**
 * Root error boundary (expo-router picks this up automatically). Converts an
 * otherwise-silent release crash into a readable screen so the error can be seen
 * and reported, with a retry that remounts the route tree.
 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <SafeAreaProvider>
      <View style={ebStyles.root}>
        <Text style={ebStyles.emoji}>⚠️</Text>
        <Text style={ebStyles.title}>Something went wrong</Text>
        <ScrollView style={ebStyles.box} contentContainerStyle={ebStyles.boxContent}>
          <Text style={ebStyles.message}>{error?.message || 'Unknown error'}</Text>
          {!!error?.stack && <Text style={ebStyles.stack}>{error.stack}</Text>}
        </ScrollView>
        <Pressable style={ebStyles.button} onPress={retry}>
          <Text style={ebStyles.buttonText}>Try again</Text>
        </Pressable>
      </View>
    </SafeAreaProvider>
  )
}

const ebStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  emoji: { fontSize: 40 },
  title: { fontSize: 20, fontWeight: '800', color: '#0E1726' },
  box: { maxHeight: 280, alignSelf: 'stretch', backgroundColor: '#FEF2F2', borderRadius: 12, borderWidth: 1, borderColor: '#FBD5D5' },
  boxContent: { padding: 14 },
  message: { fontSize: 14, fontWeight: '700', color: '#B91C1C' },
  stack: { fontSize: 11, color: '#7A8496', marginTop: 10 },
  button: { marginTop: 8, height: 48, paddingHorizontal: 28, borderRadius: 30, backgroundColor: '#13A07C', alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
})
