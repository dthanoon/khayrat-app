import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { getRecentLogs } from '../services/logs'
import { lastNDays } from '../utils/date'
import { colors, spacing, fontSize, radius } from '../constants/theme'
import type { DailyLog } from '../types'

interface Props {
  userId: string
}

export function ActivityHeatmap({ userId }: Props) {
  const [logMap, setLogMap] = useState<Record<string, DailyLog>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getRecentLogs(userId, 30)
      .then(logs => {
        const map: Record<string, DailyLog> = {}
        logs.forEach(l => { map[l.log_date] = l })
        setLogMap(map)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [userId])

  // Build last 35 days (5 weeks x 7 days) grid — newest last
  const days = lastNDays(35).reverse() // oldest → newest

  const cellColor = (date: string) => {
    const log = logMap[date]
    if (!log) return colors.bgCardAlt
    const total = (log.quran_reading ? 1 : 0) + (log.fasting ? 1 : 0) + (log.qiyam ? 1 : 0)
    if (total === 3) return colors.emerald
    if (total === 2) return `${colors.emerald}99`
    if (total === 1) return `${colors.emerald}55`
    return colors.bgCardAlt
  }

  const weeks: string[][] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>30-Day Activity</Text>
        <View style={styles.legend}>
          {[
            { color: colors.bgCardAlt, label: 'None' },
            { color: `${colors.emerald}55`, label: '1' },
            { color: `${colors.emerald}99`, label: '2' },
            { color: colors.emerald, label: '3' },
          ].map(({ color, label }) => (
            <View key={label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: color }]} />
              <Text style={styles.legendLabel}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Day labels */}
      <View style={styles.dayLabels}>
        {dayLabels.map((d, i) => (
          <Text key={i} style={styles.dayLabel}>{d}</Text>
        ))}
      </View>

      {/* Grid */}
      <View style={styles.grid}>
        {weeks.map((week, wi) => (
          <View key={wi} style={styles.week}>
            {week.map((date) => (
              <View
                key={date}
                style={[
                  styles.cell,
                  { backgroundColor: loading ? colors.bgCardAlt : cellColor(date) },
                ]}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  legend: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  dayLabels: {
    flexDirection: 'row',
    paddingLeft: 2,
    gap: 4,
    marginBottom: 2,
  },
  dayLabel: {
    width: 14,
    fontSize: 9,
    color: colors.textMuted,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'column',
    gap: 4,
  },
  week: {
    flexDirection: 'row',
    gap: 4,
  },
  cell: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
})
