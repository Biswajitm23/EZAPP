import React from 'react'
import { Text, ActivityIndicator, StyleSheet, ViewStyle, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useTheme } from '@/constants/theme'
import { PressableScale } from './motion'

type Variant = 'primary' | 'secondary' | 'outline'

interface ButtonProps {
  title: string
  onPress?: () => void
  variant?: Variant
  loading?: boolean
  disabled?: boolean
  style?: ViewStyle
}

/**
 * Themed button with a gradient primary style. Mirrors the brand gradient from
 * the design system so CTAs look consistent across the app.
 */
export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}) => {
  const { colors, layout } = useTheme()
  const isDisabled = disabled || loading

  const content = (
    <View style={styles.content}>
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? colors.brand.primary : '#FFFFFF'} />
      ) : (
        <Text
          style={[
            styles.label,
            { color: variant === 'outline' ? colors.brand.primary : '#FFFFFF' },
          ]}
        >
          {title}
        </Text>
      )}
    </View>
  )

  if (variant === 'primary') {
    return (
      <PressableScale onPress={onPress} disabled={isDisabled} style={[{ opacity: isDisabled ? 0.6 : 1 }, style]}>
        <LinearGradient
          colors={colors.brand.gradient}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.base, { height: layout.buttonHeight }]}
        >
          {content}
        </LinearGradient>
      </PressableScale>
    )
  }

  const variantStyle: ViewStyle =
    variant === 'outline'
      ? { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.brand.primary }
      : { backgroundColor: colors.background.secondary }

  return (
    <PressableScale
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        variantStyle,
        { height: layout.buttonHeight, opacity: isDisabled ? 0.6 : 1 },
        style,
      ]}
    >
      {content}
    </PressableScale>
  )
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, borderRadius: 30 },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 16, fontWeight: '600' },
})
