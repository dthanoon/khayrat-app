import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Input } from '../../src/components/ui/Input'
import { Button } from '../../src/components/ui/Button'
import { registerUser } from '../../src/services/profiles'
import { useStore } from '../../src/store/useStore'
import { colors, spacing, fontSize } from '../../src/constants/theme'

export default function RegisterScreen() {
  const router = useRouter()
  const { showToast } = useStore()
  const [loading, setLoading] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!email.trim()) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email'
    if (!password) e.password = 'Password is required'
    else if (password.length < 8) e.password = 'Password must be at least 8 characters'
    if (password !== confirm) e.confirm = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleContinue = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      const { sessionReady } = await registerUser(email.trim().toLowerCase(), password)
      if (sessionReady) {
        // Signed in — route guard will detect no profile and send to /onboarding
        // Navigate explicitly so it's instant with no flicker
        router.replace('/onboarding' as any)
      } else {
        showToast('Account created! Check your email to confirm, then sign in.', 'success')
        router.replace('/(auth)/login')
      }
    } catch (e: unknown) {
      showToast((e as any)?.message ?? 'Registration failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Step 1 of 2 — Account Details</Text>

        <View style={styles.form}>
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
            placeholder="you@example.com"
            error={errors.email}
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            isPassword
            textContentType="newPassword"
            placeholder="Min. 8 characters"
            error={errors.password}
          />
          <Input
            label="Confirm Password"
            value={confirm}
            onChangeText={setConfirm}
            isPassword
            textContentType="newPassword"
            placeholder="Repeat your password"
            error={errors.confirm}
          />
          <Button
            title="Continue"
            onPress={handleContinue}
            loading={loading}
            fullWidth
            size="lg"
            style={styles.actionBtn}
          />
          <Text style={styles.loginLink}>
            Already have an account?{' '}
            <Text style={styles.loginLinkBold} onPress={() => router.push('/(auth)/login')}>
              Sign In
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: {
    flexGrow: 1,
    padding: spacing.xl,
    gap: spacing.xl,
    paddingTop: spacing.xxl,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: -spacing.md,
  },
  form: { gap: spacing.lg },
  actionBtn: { marginTop: spacing.sm },
  loginLink: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  loginLinkBold: { color: colors.emerald, fontWeight: '600' },
})
