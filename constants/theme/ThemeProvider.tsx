<<<<<<< HEAD
import { createContext, useContext, useMemo, useCallback, ReactNode } from 'react'
import { lightColors, ThemeColors } from './colors'
import { typography, Typography } from './typography'
import { spacing, borderRadius, layout, Spacing, BorderRadius, Layout } from './spacing'
import { lightShadows, Shadows } from './shadows'
=======
import { createContext, useContext, useState, useMemo, useEffect, useCallback, ReactNode } from 'react'
import { useColorScheme } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { lightColors, darkColors, ThemeColors } from './colors'
import { typography, Typography } from './typography'
import { spacing, borderRadius, layout, Spacing, BorderRadius, Layout } from './spacing'
import { lightShadows, darkShadows, Shadows } from './shadows'

const THEME_MODE_KEY = '@emp_theme_mode'
>>>>>>> 7bd40f4462d6b8d134c54f2d6eb8b38d2134af43

export type ThemeMode = 'light' | 'dark' | 'system'

interface ThemeContextType {
  colors: ThemeColors
  typography: Typography
  spacing: Spacing
  borderRadius: BorderRadius
  layout: Layout
  shadows: Shadows
  mode: ThemeMode
  isDark: boolean
  isLoaded: boolean
  setMode: (mode: ThemeMode) => void
  toggleMode: () => void
}

const defaultThemeContext: ThemeContextType = {
  colors: lightColors,
  typography,
  spacing,
  borderRadius,
  layout,
  shadows: lightShadows,
<<<<<<< HEAD
  mode: 'light',
  isDark: false,
  isLoaded: true,
=======
  mode: 'system',
  isDark: false,
  isLoaded: false,
>>>>>>> 7bd40f4462d6b8d134c54f2d6eb8b38d2134af43
  setMode: () => {},
  toggleMode: () => {},
}

const ThemeContext = createContext<ThemeContextType>(defaultThemeContext)

interface ThemeProviderProps {
  children: ReactNode
  defaultMode?: ThemeMode
}

<<<<<<< HEAD
/**
 * The app is pinned to a single LIGHT theme (feedback #1). The system color
 * scheme and any persisted dark/system preference are intentionally ignored,
 * and `setMode`/`toggleMode` are no-ops. The context shape is kept intact so
 * every `useTheme()` consumer keeps compiling — `isDark` is simply always false.
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const setMode = useCallback(() => {}, [])
  const toggleMode = useCallback(() => {}, [])

  const value: ThemeContextType = useMemo(
    () => ({
      colors: lightColors,
=======
export function ThemeProvider({ children, defaultMode = 'system' }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme()
  const [mode, setModeState] = useState<ThemeMode>(defaultMode)
  const [isLoaded, setIsLoaded] = useState(false)

  // Hydrate persisted mode on mount
  useEffect(() => {
    AsyncStorage.getItem(THEME_MODE_KEY)
      .then((stored) => {
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setModeState(stored)
        }
      })
      .catch(() => {})
      .finally(() => setIsLoaded(true))
  }, [])

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode)
    AsyncStorage.setItem(THEME_MODE_KEY, newMode).catch(() => {})
  }, [])

  const isDark = useMemo(() => {
    if (mode === 'system') return systemColorScheme === 'dark'
    return mode === 'dark'
  }, [mode, systemColorScheme])

  const toggleMode = useCallback(() => {
    setMode(isDark ? 'light' : 'dark')
  }, [isDark, setMode])

  const value: ThemeContextType = useMemo(
    () => ({
      colors: isDark ? darkColors : lightColors,
>>>>>>> 7bd40f4462d6b8d134c54f2d6eb8b38d2134af43
      typography,
      spacing,
      borderRadius,
      layout,
<<<<<<< HEAD
      shadows: lightShadows,
      mode: 'light',
      isDark: false,
      isLoaded: true,
      setMode,
      toggleMode,
    }),
    [setMode, toggleMode]
=======
      shadows: isDark ? darkShadows : lightShadows,
      mode,
      isDark,
      isLoaded,
      setMode,
      toggleMode,
    }),
    [isDark, mode, isLoaded, setMode, toggleMode]
>>>>>>> 7bd40f4462d6b8d134c54f2d6eb8b38d2134af43
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export const useColors = () => {
  const { colors, isDark } = useTheme()
  return { colors, isDark }
}
