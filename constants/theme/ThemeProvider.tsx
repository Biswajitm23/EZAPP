import { createContext, useContext, useMemo, useCallback, ReactNode } from 'react'
import { lightColors, ThemeColors } from './colors'
import { typography, Typography } from './typography'
import { spacing, borderRadius, layout, Spacing, BorderRadius, Layout } from './spacing'
import { lightShadows, Shadows } from './shadows'

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
  mode: 'light',
  isDark: false,
  isLoaded: true,
  setMode: () => {},
  toggleMode: () => {},
}

const ThemeContext = createContext<ThemeContextType>(defaultThemeContext)

interface ThemeProviderProps {
  children: ReactNode
  defaultMode?: ThemeMode
}

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
      typography,
      spacing,
      borderRadius,
      layout,
      shadows: lightShadows,
      mode: 'light',
      isDark: false,
      isLoaded: true,
      setMode,
      toggleMode,
    }),
    [setMode, toggleMode]
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
