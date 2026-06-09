import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { Toast, type ToastType } from './Toast'
import { ConfirmModal } from './ConfirmModal'
import { ActionSheet, type ActionSheetOption } from './ActionSheet'

type IoniconName = keyof typeof Ionicons.glyphMap

interface ConfirmOptions {
  title: string
  message?: string
  confirmText?: string
  cancelText?: string
  icon?: IoniconName
  /**
   * Optional async work to run while the dialog stays open with a spinner in
   * the confirm button. Resolves the promise (to `true`) once it completes.
   */
  onConfirm?: () => void | Promise<void>
}

interface AlertOptions {
  title: string
  message?: string
  confirmText?: string
  icon?: IoniconName
}

interface SheetOptions {
  title?: string
  message?: string
  options: ActionSheetOption[]
  cancelText?: string
}

interface ToastFn {
  (message: string, type?: ToastType, duration?: number): void
  success: (message: string, duration?: number) => void
  error: (message: string, duration?: number) => void
  info: (message: string, duration?: number) => void
}

export interface FeedbackApi {
  /** Transient banner. `toast('Saved')` defaults to success; or `toast.error(...)`. */
  toast: ToastFn
  /** Two-button confirmation. Resolves `true` on confirm, `false` on cancel. */
  confirm: (opts: ConfirmOptions) => Promise<boolean>
  /** Single-button informational dialog. Resolves when dismissed. */
  alert: (opts: AlertOptions) => Promise<void>
  /** Bottom multi-choice sheet. Resolves the chosen index, or -1 if cancelled. */
  sheet: (opts: SheetOptions) => Promise<number>
}

const FeedbackContext = createContext<FeedbackApi | null>(null)

interface DialogState extends ConfirmOptions {
  mode: 'confirm' | 'alert'
  resolve: (value: boolean) => void
}

interface SheetState extends SheetOptions {
  resolve: (index: number) => void
}

/**
 * App-wide feedback system. Mount once near the root, then anywhere:
 *
 *   const { toast, confirm, alert } = useFeedback()
 *   toast.success('Profile updated')
 *   if (await confirm({ title: 'Log Out?', confirmText: 'Log Out' })) signOut()
 *
 * Renders a single themed Toast + ConfirmModal so screens never touch the
 * native `Alert` and every popup stays on-brand.
 */
export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dialog, setDialog] = useState<DialogState | null>(null)
  const [loading, setLoading] = useState(false)
  const [sheetState, setSheetState] = useState<SheetState | null>(null)

  const [toastState, setToastState] = useState<{ message: string; type: ToastType }>({ message: '', type: 'success' })
  const [toastVisible, setToastVisible] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const hideToast = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    setToastVisible(false)
  }, [])

  const showToast = useCallback((message: string, type: ToastType = 'success', duration = 2600) => {
    if (!message || !message.trim()) return
    if (timer.current) clearTimeout(timer.current)
    setToastState({ message, type })
    setToastVisible(true)
    timer.current = setTimeout(() => setToastVisible(false), duration)
  }, [])

  const toast = useMemo<ToastFn>(() => {
    const fn = ((message, type, duration) => showToast(message, type, duration)) as ToastFn
    fn.success = (m, d) => showToast(m, 'success', d)
    fn.error = (m, d) => showToast(m, 'error', d)
    fn.info = (m, d) => showToast(m, 'info', d)
    return fn
  }, [showToast])

  const confirm = useCallback(
    (opts: ConfirmOptions) =>
      new Promise<boolean>((resolve) => setDialog({ ...opts, mode: 'confirm', resolve })),
    []
  )

  const alert = useCallback(
    (opts: AlertOptions) =>
      new Promise<void>((resolve) => setDialog({ ...opts, mode: 'alert', resolve: () => resolve() })),
    []
  )

  const sheet = useCallback(
    (opts: SheetOptions) => new Promise<number>((resolve) => setSheetState({ ...opts, resolve })),
    []
  )

  const handleConfirm = useCallback(async () => {
    if (!dialog) return
    if (dialog.onConfirm) {
      setLoading(true)
      try {
        await dialog.onConfirm()
      } finally {
        setLoading(false)
      }
    }
    const { resolve, mode } = dialog
    setDialog(null)
    resolve(mode === 'confirm')
  }, [dialog])

  const handleCancel = useCallback(() => {
    if (!dialog || loading) return
    const { resolve } = dialog
    setDialog(null)
    resolve(false)
  }, [dialog, loading])

  const handleSheetSelect = useCallback(
    (index: number) => {
      if (!sheetState) return
      const { resolve } = sheetState
      setSheetState(null)
      resolve(index)
    },
    [sheetState]
  )

  const api = useMemo<FeedbackApi>(() => ({ toast, confirm, alert, sheet }), [toast, confirm, alert, sheet])

  return (
    <FeedbackContext.Provider value={api}>
      {children}

      <Toast visible={toastVisible} message={toastState.message} type={toastState.type} onHide={hideToast} />

      <ConfirmModal
        visible={!!dialog}
        title={dialog?.title ?? ''}
        message={dialog?.message}
        confirmText={dialog?.confirmText ?? (dialog?.mode === 'alert' ? 'OK' : 'Confirm')}
        cancelText={dialog?.cancelText ?? 'Cancel'}
        icon={dialog?.icon}
        hideCancel={dialog?.mode === 'alert'}
        loading={loading}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />

      <ActionSheet
        visible={!!sheetState}
        title={sheetState?.title}
        message={sheetState?.message}
        options={sheetState?.options ?? []}
        cancelText={sheetState?.cancelText}
        onSelect={handleSheetSelect}
        onCancel={() => handleSheetSelect(-1)}
      />
    </FeedbackContext.Provider>
  )
}

/** Access the app-wide toast / confirm / alert helpers. */
export const useFeedback = (): FeedbackApi => {
  const ctx = useContext(FeedbackContext)
  if (!ctx) throw new Error('useFeedback must be used within a <FeedbackProvider>')
  return ctx
}
