import React from 'react'
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { PressableScale } from './motion'

const BRAND = '#13A07C'

interface CheckboxProps {
  /** Whether the checkbox is ticked. */
  checked: boolean
  /** Toggle handler — receives the next checked value. */
  onChange: (next: boolean) => void
  /** Label text shown beside the checkbox. */
  label: string
  /** Disable interaction (e.g. while a confirm is already in flight / done). */
  disabled?: boolean
  style?: StyleProp<ViewStyle>
}

/**
 * Reusable checkbox — a filled circular checkmark + label, matching
 * assets/Reference/CheckBoxDesign.png. Used to gate the video / pdf / form /
 * guideline confirm + submit flows. When ticked, the circle fills with the
 * brand colour and shows a white checkmark; when not, it's an empty ring.
 */
export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  label,
  disabled,
  style,
}) => {
  return (
    <PressableScale
      style={[styles.row, style]}
      activeScale={0.98}
      disabled={disabled}
      onPress={() => onChange(!checked)}
      hitSlop={6}
    >
      <View style={[styles.circle, checked ? styles.circleOn : styles.circleOff]}>
        {checked ? <Ionicons name="checkmark" size={15} color="#FFFFFF" /> : null}
      </View>
      <Text style={styles.label}>{label}</Text>
    </PressableScale>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleOn: { backgroundColor: BRAND, borderWidth: 0 },
  circleOff: { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#CBD2DC' },
  label: { flex: 1, fontSize: 14, color: '#374151', fontWeight: '500', lineHeight: 20 },
})
