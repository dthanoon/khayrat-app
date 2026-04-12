import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, radius, fontSize } from '../../constants/theme'

type BadgeVariant = 'emerald' | 'amber' | 'purple' | 'rose' | 'sky' | 'gray'

interface BadgeProps {
  label: string
  variant?: BadgeVariant
  size?: 'sm' | 'md'
}

export function Badge({ label, variant = 'emerald', size = 'md' }: BadgeProps) {
  return (
    <View style={[styles.badge, styles[variant], size === 'sm' && styles.small]}>
      <Text style={[styles.text, styles[`text_${variant}`], size === 'sm' && styles.textSmall]}>
        {label}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  small: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },

  // Backgrounds (dim)
  emerald: { backgroundColor: colors.emeraldDim },
  amber: { backgroundColor: colors.amberDim },
  purple: { backgroundColor: colors.purpleDim },
  rose: { backgroundColor: colors.roseDim },
  sky: { backgroundColor: colors.skyDim },
  gray: { backgroundColor: '#1f2937' },

  text: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  textSmall: { fontSize: fontSize.xs },

  // Text colors
  text_emerald: { color: colors.emeraldLight },
  text_amber: { color: colors.amberLight },
  text_purple: { color: colors.purpleLight },
  text_rose: { color: '#fda4af' },
  text_sky: { color: '#7dd3fc' },
  text_gray: { color: colors.textSecondary },
})
