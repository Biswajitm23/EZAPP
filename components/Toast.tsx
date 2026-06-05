import React, { useEffect, useRef } from 'react'
import { Text, StyleSheet, Animated, Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'

export type ToastType = 'success' | 'error' | 'info'

interface ToastProps {
  visible: boolean
  message: string
  type?: ToastType
  onHide?: () => void
}

const CONFIG: Record<ToastType, { icon: keyof typeof Ionicons.glyphMap; color: string; tint: string }> = {
  success: { icon: 'checkmark-circle', color: '#13A07C', tint: '#E7F5EF' },
  error: { icon: 'alert-circle', color: '#EF4444', tint: '#FDE7E7' },
  info: { icon: 'information-circle', color: '#2E6F94', tint: '#E2EEF6' },
}

/**
 * Transient toast banner that slides in from the top. Purely presentational —
 * the FeedbackProvider controls `visible` and auto-dismissal. Tap to dismiss.
 */
export const Toast: React.FC<ToastProps> = ({ visible, message, type = 'success', onHide }) => {
  const insets = useSafeAreaInsets()
  const anim = useRef(new Animated.Value(0)).current
  const cfg = CONFIG[type]

  useEffect(() => {
    Animated.spring(anim, {
      toValue: visible ? 1 : 0,
      useNativeDriver: true,
      stiffness: 180,
      damping: 20,
      mass: 0.7,
    }).start()
  }, [visible, anim])

  return (
    <Animated.View
      pointerEvents={visible ? 'box-none' : 'none'}
      style={[
        styles.wrap,
        {
          top: insets.top + 8,
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) }],
        },
      ]}
    >
      <Pressable style={styles.toast} onPress={onHide}>
        <Ionicons name={cfg.icon} size={22} color={cfg.color} style={[styles.icon, { backgroundColor: cfg.tint }]} />
        <Text style={styles.message} numberOfLines={3}>
          {message}
        </Text>
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 1000,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    maxWidth: 460,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: '#0B1B33',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 10,
  },
  icon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 34,
    overflow: 'hidden',
  },
  message: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1B2233', lineHeight: 19 },
})
