import React, { useState } from 'react'
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Input } from '../../src/components/ui/Input'
import { Button } from '../../src/components/ui/Button'
import { sendPasswordReset } from '../../src/services/profiles'
import { useStore } from '../../src/store/useStore'
import { colors, spacing, fontSize, fontWeight } from '../../src/constants/theme'

export default function ForgotPasswordScreen() {
  const { showToast } = useStore()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSend = async () => {
    if (!email.trim()) {
      showToast('Please enter your email', 'error')
      return
    }
    setLoading(true)
    try {
      await sendPasswordReset(email.trim().toLowerCase())
      setSent(true)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to send reset email'
      showToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successIcon}>
          <Ionicons name="mail-open-outline" size={40} color={colors.emerald} />
        </View>
        <Text style={styles.successTitle}>Check your inbox</Text>
        <Text style={styles.successText}>
          We sent a password reset link to{'\n'}
          <Text style={styles.emailHighlight}>{email}</Text>
        </Text>
        <Text style={styles.successNote}>
          Click the link in the email to reset your password. The link opens the Khayrat app directly.
        </Text>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.description}>
          Enter the email address associated with your account. We'll send you a link to reset your password.
        </Text>

        <Input
          label="Email Address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          textContentType="emailAddress"
          autoComplete="email"
          placeholder="you@example.com"
          onSubmitEditing={handleSend}
        />

        <Button
          title="Send Reset Link"
          onPress={handleSend}
          loading={loading}
          fullWidth
          size="lg"
        />
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  inner: {
    padding: spacing.xl,
    gap: spacing.xl,
    paddingTop: spacing.xxl,
  },
  description: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  successContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.emeraldDim,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: `${colors.emerald}40`,
  },
  successTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  successText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  emailHighlight: {
    color: colors.emerald,
    fontWeight: fontWeight.semibold,
  },
  successNote: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
})
