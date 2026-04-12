import React from 'react'
import { View, StyleSheet, type ViewStyle, type ViewProps } from 'react-native'
import { colors, radius, spacing } from '../../constants/theme'

interface CardProps extends ViewProps {
  style?: ViewStyle
  padding?: number
  variant?: 'default' | 'alt'
}

export function Card({ style, padding = spacing.lg, variant = 'default', children, ...rest }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        variant === 'alt' && styles.cardAlt,
        { padding },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardAlt: {
    backgroundColor: colors.bgCardAlt,
  },
})
