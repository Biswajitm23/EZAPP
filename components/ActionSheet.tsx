import React from 'react'
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_GREEN } from '@/constants/theme'

export interface ActionSheetOption {
  label: string
  icon?: keyof typeof Ionicons.glyphMap
  destructive?: boolean
}

interface ActionSheetProps {
  visible: boolean
  title?: string
  message?: string
  options: ActionSheetOption[]
  cancelText?: string
  onSelect: (index: number) => void
  onCancel: () => void
}

/**
 * Themed bottom action sheet — a reusable multi-choice picker (e.g. "Take Photo
 * / Choose from Library"). Slides up from the bottom with a rounded card and a
 * separate Cancel button, styled to the app's design system.
 */
export const ActionSheet: React.FC<ActionSheetProps> = ({
  visible,
  title,
  message,
  options,
  cancelText = 'Cancel',
  onSelect,
  onCancel,
}) => {
  const insets = useSafeAreaInsets()

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]} onPress={() => {}}>
          <View style={styles.card}>
            {(title || message) && (
              <View style={styles.headerBox}>
                {title ? <Text style={styles.title}>{title}</Text> : null}
                {message ? <Text style={styles.message}>{message}</Text> : null}
              </View>
            )}
            {options.map((opt, i) => (
              <Pressable
                key={i}
                onPress={() => onSelect(i)}
                android_ripple={{ color: 'rgba(19,160,124,0.08)' }}
                style={[styles.row, i > 0 && styles.rowDivider]}
              >
                {opt.icon && (
                  <Ionicons
                    name={opt.icon}
                    size={20}
                    color={opt.destructive ? '#EF4444' : BRAND_GREEN}
                    style={styles.rowIcon}
                  />
                )}
                <Text style={[styles.rowText, opt.destructive && styles.rowTextDestructive]}>{opt.label}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable style={styles.cancel} onPress={onCancel} android_ripple={{ color: 'rgba(0,0,0,0.05)' }}>
            <Text style={styles.cancelText}>{cancelText}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(11, 27, 51, 0.45)', justifyContent: 'flex-end' },
  wrap: { paddingHorizontal: 12 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 10,
  },
  headerBox: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF1F5',
    alignItems: 'center',
  },
  title: { fontSize: 15, fontWeight: '800', color: '#1B2233', textAlign: 'center' },
  message: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginTop: 4, lineHeight: 18 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 17, paddingHorizontal: 20 },
  rowDivider: { borderTopWidth: 1, borderTopColor: '#EEF1F5' },
  rowIcon: { marginRight: 14 },
  rowText: { fontSize: 16, fontWeight: '600', color: '#1B2233' },
  rowTextDestructive: { color: '#EF4444' },
  cancel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 17,
    alignItems: 'center',
  },
  cancelText: { fontSize: 16, fontWeight: '800', color: '#5B6472' },
})
