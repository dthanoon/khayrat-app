import React from 'react'
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  type TouchableOpacityProps,
  type ViewStyle,
  type TextStyle,
} from 'react-native'
import { colors, radius, fontSize, fontWeight } from '../../constants/theme'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends TouchableOpacityProps {
  title: string
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
  style?: ViewStyle
  textStyle?: TextStyle
}

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  style,
  textStyle,
  disabled,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      disabled={isDisabled}
      activeOpacity={0.75}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'ghost' || variant === 'secondary' ? colors.emerald : colors.bg}
        />
      ) : (
        <Text style={[styles.text, styles[`textVariant_${variant}`], styles[`textSize_${size}`], textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.4 },

  // Variants
  primary: {
    backgroundColor: colors.emerald,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.emerald,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: colors.rose,
  },

  // Sizes
  size_sm: { paddingHorizontal: 12, paddingVertical: 7, minHeight: 34 },
  size_md: { paddingHorizontal: 16, paddingVertical: 11, minHeight: 44 },
  size_lg: { paddingHorizontal: 24, paddingVertical: 15, minHeight: 52 },

  // Text base
  text: {
    fontWeight: fontWeight.semibold,
  },
  textVariant_primary: { color: '#000' },
  textVariant_secondary: { color: colors.emerald },
  textVariant_ghost: { color: colors.textSecondary },
  textVariant_danger: { color: '#fff' },

  textSize_sm: { fontSize: fontSize.sm },
  textSize_md: { fontSize: fontSize.md },
  textSize_lg: { fontSize: fontSize.lg },
})
