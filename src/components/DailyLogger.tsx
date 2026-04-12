import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Card } from './ui/Card'
import { Button } from './ui/Button'
import { useDailyLog } from '../hooks/useDailyLog'
import { colors, spacing, fontSize, fontWeight, radius } from '../constants/theme'

interface LogItemProps {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  subtitle: string
  checked: boolean
  onChange: (v: boolean) => void
  accentColor: string
}

function LogItem({ icon, label, subtitle, checked, onChange, accentColor }: LogItemProps) {
  return (
    <TouchableOpacity
      onPress={() => onChange(!checked)}
      style={[styles.logItem, checked && { borderColor: accentColor, backgroundColor: `${accentColor}15` }]}
      activeOpacity={0.7}
    >
      <View style={[styles.logIconBox, { backgroundColor: checked ? `${accentColor}30` : colors.bgCardAlt }]}>
        <Ionicons name={icon} size={22} color={checked ? accentColor : colors.textMuted} />
      </View>
      <View style={styles.logText}>
        <Text style={[styles.logLabel, checked && { color: accentColor }]}>{label}</Text>
        <Text style={styles.logSub}>{subtitle}</Text>
      </View>
      <View style={[styles.checkbox, checked && { backgroundColor: accentColor, borderColor: accentColor }]}>
        {checked && <Ionicons name="checkmark" size={14} color="#000" />}
      </View>
    </TouchableOpacity>
  )
}

export function DailyLogger() {
  const { log, loading, saving, saveLog } = useDailyLog()

  const [quran, setQuran] = useState(false)
  const [fasting, setFasting] = useState(false)
  const [qiyam, setQiyam] = useState(false)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (log) {
      setQuran(log.quran_reading)
      setFasting(log.fasting)
      setQiyam(log.qiyam)
    }
  }, [log])

  const handleChange = (setter: (v: boolean) => void, value: boolean) => {
    setter(value)
    setDirty(true)
  }

  const handleSave = async () => {
    await saveLog({ quran_reading: quran, fasting, qiyam })
    setDirty(false)
  }

  if (loading) {
    return (
      <Card style={styles.card}>
        <ActivityIndicator color={colors.emerald} />
      </Card>
    )
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Today's Log</Text>
        <Text style={styles.date}>{today}</Text>
      </View>

      <View style={styles.items}>
        <LogItem
          icon="book-outline"
          label="Quran Reading"
          subtitle="Did you read Quran today?"
          checked={quran}
          onChange={(v) => handleChange(setQuran, v)}
          accentColor={colors.emerald}
        />
        <LogItem
          icon="moon-outline"
          label="Fasting"
          subtitle="Did you fast today?"
          checked={fasting}
          onChange={(v) => handleChange(setFasting, v)}
          accentColor={colors.amber}
        />
        <LogItem
          icon="star-outline"
          label="Qiyam al-Layl"
          subtitle="Did you pray Qiyam tonight?"
          checked={qiyam}
          onChange={(v) => handleChange(setQiyam, v)}
          accentColor={colors.purple}
        />
      </View>

      <Button
        title={saving ? 'Saving…' : dirty ? 'Save Changes' : 'Saved'}
        onPress={handleSave}
        loading={saving}
        disabled={!dirty}
        fullWidth
        style={styles.saveBtn}
      />
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
  date: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
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
  logLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
  },
  logSub: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: { marginTop: spacing.xs },
})
