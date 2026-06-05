import React from 'react'
import { View, Text, Pressable, Modal, StyleSheet, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_GREEN } from '@/constants/theme'

interface ConfirmModalProps {
  visible: boolean
  title: string
  message?: string
  /** Primary (confirm) button label. */
  confirmText?: string
  /** Secondary (cancel) button label. */
  cancelText?: string
  /** Optional icon shown in a tinted circle above the title. */
  icon?: keyof typeof Ionicons.glyphMap
  /** Shows a spinner in the confirm button + blocks dismissal. */
  loading?: boolean
  /** Hide the secondary button — turns the dialog into a single-action alert. */
  hideCancel?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Themed confirmation dialog — a clean card with a title, body text and a
 * prominent brand-green primary button (mirrors the system-style popup design).
 * Replaces the native `Alert.alert` for confirmations so the look stays on-brand.
 */
export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  icon,
  loading = false,
  hideCancel = false,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={loading ? undefined : onCancel}
    >
      <Pressable style={styles.backdrop} onPress={loading ? undefined : onCancel}>
        <Pressable style={styles.card} onPress={() => {}}>
          {icon && (
            <View style={styles.iconCircle}>
              <Ionicons name={icon} size={26} color={BRAND_GREEN} />
            </View>
          )}

          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}

          <Pressable
            style={[styles.confirmBtn, loading && styles.confirmBtnDisabled]}
            onPress={onConfirm}
            disabled={loading}
            android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.confirmText}>{confirmText}</Text>
            )}
          </Pressable>

          {!hideCancel && (
            <Pressable style={styles.cancelBtn} onPress={onCancel} disabled={loading} hitSlop={6}>
              <Text style={styles.cancelText}>{cancelText}</Text>
            </Pressable>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(11, 27, 51, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 16,
    alignItems: 'center',
    shadowColor: '#0E7A60',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    elevation: 14,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E7F5EF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1B2233',
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  confirmBtn: {
    width: '100%',
    height: 52,
    borderRadius: 999,
    backgroundColor: BRAND_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },
  confirmBtnDisabled: { opacity: 0.7 },
  confirmText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  cancelBtn: { width: '100%', height: 46, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  cancelText: { color: '#8A92A0', fontSize: 15, fontWeight: '600' },
})
