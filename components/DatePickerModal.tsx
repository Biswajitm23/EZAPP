import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, Pressable, Modal, StyleSheet, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_GREEN } from '@/constants/theme'

/**
 * Themed calendar date picker — a pure-JS modal that matches the app's green
 * design system (no native date-picker dependency). Tap the header year to jump
 * to a year grid (handy for dates of birth), use the chevrons for months, then
 * confirm with "Set Date". Emits a `YYYY-MM-DD` string.
 */
interface DatePickerModalProps {
  visible: boolean
  /** Current value as YYYY-MM-DD (optional). */
  value?: string
  title?: string
  /** Latest selectable date. Defaults to today (DOB can't be in the future). */
  maximumDate?: Date
  minimumYear?: number
  onClose: () => void
  onConfirm: (date: string) => void
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const pad = (n: number) => String(n).padStart(2, '0')
const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

/** Parse YYYY-MM-DD into a local Date, or null if invalid. */
const parseISO = (s?: string): Date | null => {
  if (!s) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim())
  if (!m) return null
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return Number.isNaN(d.getTime()) ? null : d
}

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  visible,
  value,
  title = 'Select Date',
  maximumDate,
  minimumYear = 1940,
  onClose,
  onConfirm,
}) => {
  const today = useMemo(() => startOfDay(new Date()), [])
  const maxDate = maximumDate ? startOfDay(maximumDate) : today

  // The month currently shown in the grid + the tentatively selected day.
  const [view, setView] = useState(() => parseISO(value) ?? maxDate)
  const [selected, setSelected] = useState<Date | null>(() => parseISO(value))
  const [yearMode, setYearMode] = useState(false)

  // Re-sync when re-opened with a (possibly) different value.
  useEffect(() => {
    if (!visible) return
    const initial = parseISO(value) ?? maxDate
    setView(initial)
    setSelected(parseISO(value))
    setYearMode(false)
  }, [visible, value]) // eslint-disable-line react-hooks/exhaustive-deps

  const year = view.getFullYear()
  const month = view.getMonth()

  const grid = useMemo(() => {
    const firstWeekday = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells: (Date | null)[] = []
    for (let i = 0; i < firstWeekday; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }, [year, month])

  const years = useMemo(() => {
    const out: number[] = []
    for (let y = maxDate.getFullYear(); y >= minimumYear; y--) out.push(y)
    return out
  }, [maxDate, minimumYear])

  const sameDay = (a: Date | null, b: Date | null) =>
    !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

  const isDisabled = (d: Date) => d.getTime() > maxDate.getTime()

  const goMonth = (delta: number) => setView(new Date(year, month + delta, 1))

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color="#6B7280" />
            </Pressable>
          </View>

          {/* Month / year bar */}
          <View style={styles.monthBar}>
            <Pressable onPress={() => setYearMode((y) => !y)} hitSlop={6} style={styles.monthLabelBtn}>
              <Text style={styles.monthLabel}>
                {MONTHS[month]} {year}
              </Text>
              <Ionicons name={yearMode ? 'chevron-up' : 'chevron-down'} size={16} color={BRAND_GREEN} />
            </Pressable>
            {!yearMode && (
              <View style={styles.navBtns}>
                <Pressable onPress={() => goMonth(-1)} hitSlop={6} style={styles.navBtn}>
                  <Ionicons name="chevron-back" size={20} color="#1B2233" />
                </Pressable>
                <Pressable onPress={() => goMonth(1)} hitSlop={6} style={styles.navBtn}>
                  <Ionicons name="chevron-forward" size={20} color="#1B2233" />
                </Pressable>
              </View>
            )}
          </View>

          {yearMode ? (
            <ScrollView style={styles.yearScroll} contentContainerStyle={styles.yearGrid}>
              {years.map((y) => {
                const active = y === year
                return (
                  <Pressable
                    key={y}
                    onPress={() => {
                      setView(new Date(y, month, 1))
                      setYearMode(false)
                    }}
                    style={[styles.yearCell, active && styles.yearCellActive]}
                  >
                    <Text style={[styles.yearText, active && styles.yearTextActive]}>{y}</Text>
                  </Pressable>
                )
              })}
            </ScrollView>
          ) : (
            <>
              {/* Weekday row */}
              <View style={styles.weekRow}>
                {WEEKDAYS.map((w, i) => (
                  <Text key={i} style={styles.weekday}>
                    {w}
                  </Text>
                ))}
              </View>

              {/* Day grid */}
              <View style={styles.daysWrap}>
                {grid.map((d, i) => {
                  if (!d) return <View key={i} style={styles.dayCell} />
                  const disabled = isDisabled(d)
                  const isSelected = sameDay(d, selected)
                  const isToday = sameDay(d, today)
                  return (
                    <Pressable
                      key={i}
                      disabled={disabled}
                      onPress={() => setSelected(d)}
                      style={styles.dayCell}
                    >
                      <View style={[styles.dayInner, isSelected && styles.daySelected, !isSelected && isToday && styles.dayToday]}>
                        <Text
                          style={[
                            styles.dayText,
                            isSelected && styles.dayTextSelected,
                            disabled && styles.dayTextDisabled,
                          ]}
                        >
                          {d.getDate()}
                        </Text>
                      </View>
                    </Pressable>
                  )
                })}
              </View>
            </>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <Pressable style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.confirmBtn, !selected && styles.confirmDisabled]}
              disabled={!selected}
              onPress={() => selected && onConfirm(toISO(selected))}
            >
              <Text style={styles.confirmText}>Set Date</Text>
            </Pressable>
          </View>
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
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#0E7A60',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  title: { fontSize: 17, fontWeight: '700', color: '#1B2233' },

  monthBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 10 },
  monthLabelBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  monthLabel: { fontSize: 16, fontWeight: '700', color: '#1B2233' },
  navBtns: { flexDirection: 'row', gap: 6 },
  navBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F2F4F8' },

  weekRow: { flexDirection: 'row', marginTop: 4, marginBottom: 6 },
  weekday: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '700', color: '#9AA1AD' },

  daysWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayInner: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  daySelected: { backgroundColor: BRAND_GREEN },
  dayToday: { borderWidth: 1.5, borderColor: BRAND_GREEN },
  dayText: { fontSize: 15, color: '#1B2233', fontWeight: '500' },
  dayTextSelected: { color: '#FFFFFF', fontWeight: '700' },
  dayTextDisabled: { color: '#CBD0D8' },

  yearScroll: { maxHeight: 280 },
  yearGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingVertical: 4 },
  yearCell: { width: `${100 / 3}%`, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  yearCellActive: {},
  yearText: { fontSize: 16, color: '#1B2233', fontWeight: '500' },
  yearTextActive: { color: BRAND_GREEN, fontWeight: '800' },

  footer: { flexDirection: 'row', gap: 12, marginTop: 14 },
  cancelBtn: { flex: 1, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F2F4F8' },
  cancelText: { fontSize: 15, fontWeight: '700', color: '#5B6472' },
  confirmBtn: { flex: 1, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: BRAND_GREEN },
  confirmDisabled: { opacity: 0.5 },
  confirmText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
})
