import React from 'react'
import { View, Text, StyleSheet, TextStyle } from 'react-native'

interface BrandWordmarkProps {
  /** Font size of the wordmark. Defaults to 28. */
  size?: number
  style?: TextStyle
}

/**
 * The Bitpastel wordmark ("bitpastel®") rendered in the brand teal.
 *
 * Drop-in placeholder for the official logo — swap for an <Image>/<SvgUri>
 * pointing at the real asset once it lives under `assets/images/`.
 */
export const BrandWordmark: React.FC<BrandWordmarkProps> = ({ size = 28, style }) => (
  <View style={styles.row}>
    <Text style={[styles.word, { fontSize: size }, style]}>bitpastel</Text>
    <Text style={[styles.mark, { fontSize: size * 0.4 }]}>®</Text>
  </View>
)

const BITPASTEL_TEAL = '#13A07C'

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  word: { color: BITPASTEL_TEAL, fontWeight: '700', letterSpacing: 0.2 },
  mark: { color: BITPASTEL_TEAL, fontWeight: '600', marginTop: 2 },
})
