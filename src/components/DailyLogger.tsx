import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Card } from './ui/Card'
import { useDailyLog } from '../hooks/useDailyLog'
import { colors, spacing, fontSize, fontWeight, radius } from '../constants/theme'

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function isFriday(dateStr: string): boolean {
  return new Date(dateStr + 'T12:00:00').getDay() === 5
}

function getLast7Days() {
  const result: { date: string; abbr: string; day: number; isToday: boolean }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    result.push({
      date: `${yyyy}-${mm}-${dd}`,
      abbr: DAY_ABBR[d.getDay()],
      day: d.getDate(),
      isToday: i === 0,
    })
  }
  return result
}

function formatDateLabel(dateStr: string, isToday: boolean): string {
  if (isToday) return 'Today'
  const d = new Date(dateStr + 'T12:00:00')
  return `${DAY_ABBR[d.getDay()]}, ${MONTH_ABBR[d.getMonth()]} ${d.getDate()}`
}

interface LogItemProps {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  subtitle: string
  checked: boolean
  saving: boolean
  onToggle: () => void
  accentColor: string
}

function LogItem({ icon, label, subtitle, checked, saving, onToggle, accentColor }: LogItemProps) {
  return (
    <TouchableOpacity
      onPress={onToggle}
      style={[styles.logItem, checked && { borderColor: accentColor, backgroundColor: `${accentColor}12` }]}
      activeOpacity={0.7}
      disabled={saving}
    >
      <View style={[styles.logIconBox, { backgroundColor: checked ? `${accentColor}28` : colors.bgCardAlt }]}>
        <Ionicons name={icon} size={22} color={checked ? accentColor : colors.textMuted} />
      </View>
      <View style={styles.logText}>
        <Text style={[styles.logLabel, checked && { color: accentColor }]}>{label}</Text>
        <Text style={styles.logSub}>{subtitle}</Text>
      </View>
      {saving ? (
        <ActivityIndicator size="small" color={accentColor} />
      ) : (
        <View style={[styles.checkbox, checked && { backgroundColor: accentColor, borderColor: accentColor }]}>
          {checked && <Ionicons name="checkmark" size={14} color="#000" />}
        </View>
      )}
    </TouchableOpacity>
  )
}

export function DailyLogger() {
  const [days] = useState(() => getLast7Days())
  const todayStr = days[days.length - 1].date

  const [selectedDate, setSelectedDate] = useState(todayStr)
  const { log, loading, saving, saveLog } = useDailyLog(selectedDate)

  const [quran, setQuran] = useState(false)
  const [fasting, setFasting] = useState(false)
  const [qiyam, setQiyam] = useState(false)
  const [kahf, setKahf] = useState(false)

  // Sync checkboxes when the log for the selected date loads
  useEffect(() => {
    setQuran(log?.quran_reading ?? false)
    setFasting(log?.fasting ?? false)
    setQiyam(log?.qiyam ?? false)
    setKahf(log?.kahf_reading ?? false)
  }, [log])

  const handleDateSelect = (date: string) => {
    if (date === selectedDate) return
    setQuran(false)
    setFasting(false)
    setQiyam(false)
    setKahf(false)
    setSelectedDate(date)
  }

  const isFridaySelected = isFriday(selectedDate)

  const toggle = (
    field: 'quran_reading' | 'fasting' | 'qiyam' | 'kahf_reading',
    current: boolean,
    setter: (v: boolean) => void
  ) => {
    const next = !current
    setter(next)
    saveLog({
      quran_reading: field === 'quran_reading' ? next : quran,
      fasting: field === 'fasting' ? next : fasting,
      qiyam: field === 'qiyam' ? next : qiyam,
      kahf_reading: field === 'kahf_reading' ? next : kahf,
    })
  }

  const isToday = selectedDate === todayStr
  const dateLabel = formatDateLabel(selectedDate, isToday)

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Daily Log</Text>
        <Text style={styles.dateLabel}>{dateLabel}</Text>
      </View>

      {/* 7-day strip */}
      <View style={styles.dateStrip}>
        {days.map(d => {
          const isSelected = d.date === selectedDate
          const dayIsFriday = isFriday(d.date)
          return (
            <TouchableOpacity
              key={d.date}
              onPress={() => handleDateSelect(d.date)}
              style={[
                styles.dayBtn,
                isSelected && styles.dayBtnActive,
                d.isToday && !isSelected && styles.dayBtnToday,
                dayIsFriday && !isSelected && styles.dayBtnFriday,
              ]}
              activeOpacity={0.7}
            >
              <Text style={[styles.dayAbbr, isSelected && styles.dayTextActive, dayIsFriday && !isSelected && styles.dayAbbrFriday]}>{d.abbr}</Text>
              <Text style={[
                styles.dayNum,
                isSelected && styles.dayTextActive,
                d.isToday && !isSelected && styles.dayNumToday,
              ]}>
                {d.day}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.emerald} style={styles.loadingIndicator} />
      ) : (
        <View style={styles.items}>
          <LogItem
            icon="book-outline"
            label="Quran Reading"
            subtitle="Did you read Quran?"
            checked={quran}
            saving={saving}
            onToggle={() => toggle('quran_reading', quran, setQuran)}
            accentColor={colors.emerald}
          />
          <LogItem
            icon="moon-outline"
            label="Fasting"
            subtitle="Did you fast?"
            checked={fasting}
            saving={saving}
            onToggle={() => toggle('fasting', fasting, setFasting)}
            accentColor={colors.amber}
          />
          <LogItem
            icon="star-outline"
            label="Qiyam al-Layl"
            subtitle="Did you pray Qiyam?"
            checked={qiyam}
            saving={saving}
            onToggle={() => toggle('qiyam', qiyam, setQiyam)}
            accentColor={colors.purple}
          />
          {isFridaySelected && (
            <LogItem
              icon="reader-outline"
              label="Kahf Reading"
              subtitle="Surah Al-Kahf — Friday sunnah"
              checked={kahf}
              saving={saving}
              onToggle={() => toggle('kahf_reading', kahf, setKahf)}
              accentColor={colors.sky}
            />
          )}
        </View>
      )}
    </Card>
  )
}

const styles = StyleSheet.create({
  card: { gap: spacing.lg },
  header: { gap: 2 },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  dateLabel: { fontSize: fontSize.sm, color: colors.textMuted },

  // 7-day strip
  dateStrip: { flexDirection: 'row', gap: spacing.xs },
  dayBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 2,
  },
  dayBtnActive: { backgroundColor: colors.emeraldDim, borderColor: colors.emerald },
  dayBtnToday: { borderColor: colors.border },
  dayBtnFriday: { borderColor: colors.skyDim },
  dayAbbr: { fontSize: 10, color: colors.textMuted, fontWeight: fontWeight.medium },
  dayAbbrFriday: { color: colors.sky },
  dayNum: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.textSecondary },
  dayNumToday: { color: colors.emerald },
  dayTextActive: { color: colors.emeraldLight },

  loadingIndicator: { paddingVertical: spacing.xl },
  items: { gap: spacing.sm },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  logIconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logText: { flex: 1, gap: 2 },
  logLabel: { fontSize: fontSize.md, fontWeight: fontWeight.medium, color: colors.textPrimary },
  logSub: { fontSize: fontSize.xs, color: colors.textMuted },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
