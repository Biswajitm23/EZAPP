/**
 * Color Palette for Employee Zone App
 *
 * Usage:
 *   import { useTheme } from '@/constants/theme'
 *   const { colors } = useTheme()
 *   <View style={{ backgroundColor: colors.background.primary }} />
 */

interface BrandColors {
  primary: string
  secondary: string
  gradient: readonly [string, string, ...string[]]
}

interface BackgroundColors {
  primary: string
  secondary: string
  card: string
  input: string
  overlay: string
  modalOverlay: string
}

interface TextColors {
  primary: string
  secondary: string
  tertiary: string
  inverse: string
  link: string
  placeholder: string
}

interface BorderColors {
  default: string
  light: string
  focus: string
  error: string
}

interface SemanticColors {
  success: string
  successLight: string
  error: string
  errorLight: string
  warning: string
  warningLight: string
  info: string
  infoLight: string
}

interface IconColors {
  primary: string
  secondary: string
  active: string
  inactive: string
}

interface TabBarColors {
  background: string
  active: string
  inactive: string
  border: string
}

export interface ThemeColors {
  brand: BrandColors
  background: BackgroundColors
  text: TextColors
  border: BorderColors
  semantic: SemanticColors
  icon: IconColors
  tabBar: TabBarColors
}

// Brand Colors (shared across themes) — Bitpastel Employee Zone teal-green.
// primary: the bright "chat bubble" green; secondary: the deep header green
// from the app reference. The gradient runs bright → deep for CTAs/avatars.
export const BRAND_GREEN = '#13A07C'
export const BRAND_GREEN_DARK = '#0E7A60'

const brand: BrandColors = {
  primary: BRAND_GREEN,
  secondary: BRAND_GREEN_DARK,
  gradient: [BRAND_GREEN, BRAND_GREEN_DARK] as const,
}

/**
 * Soft pastel card shades lifted from the Bitpastel testimonial cards
 * (green / blue / pink / yellow). Each pairs a tinted background with a
 * readable accent for text + icons sitting on it. Screens cycle through these
 * for category tiles and content cards.
 */
export interface Pastel {
  bg: string
  accent: string
}

export const pastels: readonly Pastel[] = [
  { bg: '#DCF2E1', accent: '#1E7A52' }, // green
  { bg: '#D7EAF6', accent: '#2E6F94' }, // blue
  { bg: '#FADDE1', accent: '#B24A57' }, // pink
  { bg: '#FBF0CF', accent: '#9A7B25' }, // yellow
] as const

/** Deterministically pick a pastel for an index (cycles through the set). */
export const pastelAt = (i: number): Pastel => pastels[((i % pastels.length) + pastels.length) % pastels.length]

// Light Theme
export const lightColors: ThemeColors = {
  brand,
  background: {
    primary: '#F6F8FA',
    secondary: '#EEF1F5',
    card: '#FFFFFF',
    input: '#F1F4F9',
    overlay: 'rgba(0, 0, 0, 0.5)',
    modalOverlay: 'rgba(0, 0, 0, 0.6)',
  },
  text: {
    primary: '#0B1B33',
    secondary: '#5B6B82',
    tertiary: '#94A3B8',
    inverse: '#FFFFFF',
    link: BRAND_GREEN,
    placeholder: 'rgba(11, 27, 51, 0.4)',
  },
  border: {
    default: 'rgba(15, 23, 42, 0.12)',
    light: 'rgba(15, 23, 42, 0.06)',
    focus: BRAND_GREEN,
    error: '#EF4444',
  },
  semantic: {
    success: '#10B981',
    successLight: 'rgba(16, 185, 129, 0.1)',
    error: '#EF4444',
    errorLight: 'rgba(239, 68, 68, 0.1)',
    warning: '#F59E0B',
    warningLight: 'rgba(245, 158, 11, 0.1)',
    info: '#3B82F6',
    infoLight: 'rgba(59, 130, 246, 0.1)',
  },
  icon: {
    primary: '#0B1B33',
    secondary: '#5B6B82',
    active: BRAND_GREEN,
    inactive: '#94A3B8',
  },
  tabBar: {
    background: '#FFFFFF',
    active: BRAND_GREEN,
    inactive: '#94A3B8',
    border: 'rgba(15, 23, 42, 0.08)',
  },
}

// Dark Theme
export const darkColors: ThemeColors = {
  brand,
  background: {
    primary: '#0A1220',
    secondary: '#111B2E',
    card: '#0F1A2C',
    input: '#162338',
    overlay: 'rgba(0, 0, 0, 0.7)',
    modalOverlay: 'rgba(0, 0, 0, 0.85)',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#B8C5D6',
    tertiary: '#6B7B92',
    inverse: '#0B1B33',
    link: '#34D1A8',
    placeholder: '#6B7B92',
  },
  border: {
    default: 'rgba(148, 163, 184, 0.3)',
    light: 'rgba(148, 163, 184, 0.16)',
    focus: '#34D1A8',
    error: '#EF4444',
  },
  semantic: {
    success: '#10B981',
    successLight: 'rgba(16, 185, 129, 0.15)',
    error: '#EF4444',
    errorLight: 'rgba(239, 68, 68, 0.15)',
    warning: '#F59E0B',
    warningLight: 'rgba(245, 158, 11, 0.15)',
    info: '#3B82F6',
    infoLight: 'rgba(59, 130, 246, 0.15)',
  },
  icon: {
    primary: '#FFFFFF',
    secondary: '#B8C5D6',
    active: '#34D1A8',
    inactive: '#6B7B92',
  },
  tabBar: {
    background: 'rgba(10, 18, 32, 0.95)',
    active: '#34D1A8',
    inactive: '#6B7B92',
    border: 'rgba(148, 163, 184, 0.2)',
  },
}

export const colors = {
  light: lightColors,
  dark: darkColors,
}
