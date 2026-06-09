import React, { useState } from 'react'
import { View, Text, TextInput, StyleSheet, TextInputProps, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '@/constants/theme'

interface TextFieldProps extends TextInputProps {
  label?: string
  error?: string
  /** Left icon name from Ionicons. */
  icon?: keyof typeof Ionicons.glyphMap
  /** Renders a show/hide toggle for password fields. */
  isPassword?: boolean
}

/**
 * Themed text input with optional label, leading icon, password toggle, and
 * inline error text.
 */
export const TextField: React.FC<TextFieldProps> = ({
  label,
  error,
  icon,
  isPassword,
  style,
  ...rest
}) => {
  const { colors, borderRadius, layout } = useTheme()
  const [focused, setFocused] = useState(false)
  const [hidden, setHidden] = useState(!!isPassword)

  const borderColor = error ? colors.border.error : focused ? colors.border.focus : colors.border.default

  return (
    <View style={styles.wrap}>
      {label ? <Text style={[styles.label, { color: colors.text.secondary }]}>{label}</Text> : null}
      <View
        style={[
          styles.inputRow,
          {
            height: layout.inputHeight,
            borderRadius: borderRadius.md,
            borderColor,
            backgroundColor: colors.background.input,
          },
        ]}
      >
        {icon ? <Ionicons name={icon} size={20} color={colors.icon.secondary} style={styles.icon} /> : null}
        <TextInput
          style={[styles.input, { color: colors.text.primary }, style]}
          placeholderTextColor={colors.text.placeholder}
          secureTextEntry={hidden}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...rest}
        />
        {isPassword ? (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={8}>
            <Ionicons name={hidden ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.icon.secondary} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={[styles.error, { color: colors.semantic.error }]}>{error}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '500', marginBottom: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, paddingHorizontal: 12 },
  icon: { marginRight: 8 },
  input: { flex: 1, fontSize: 16, paddingVertical: 0 },
  error: { fontSize: 12, marginTop: 4 },
})
