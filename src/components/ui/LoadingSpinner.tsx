import React from 'react'
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native'
import { colors, fontSize } from '../../constants/theme'

interface Props {
  message?: string
  size?: 'small' | 'large'
  fullScreen?: boolean
}

export function LoadingSpinner({ message, size = 'large', fullScreen = false }: Props) {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size={size} color={colors.emerald} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  message: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
})
