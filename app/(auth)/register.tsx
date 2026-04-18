import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Linking,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Input } from '../../src/components/ui/Input'
import { Button } from '../../src/components/ui/Button'
import { registerUser, upsertProfile } from '../../src/services/profiles'
import { supabase } from '../../src/services/supabase'
import { useStore } from '../../src/store/useStore'
import { colors, spacing, fontSize, fontWeight, radius } from '../../src/constants/theme'

const COUNTRIES = [
  'Saudi Arabia', 'Egypt', 'UAE', 'Jordan', 'Kuwait', 'Qatar', 'Bahrain', 'Oman',
  'Morocco', 'Tunisia', 'Algeria', 'Libya', 'Sudan', 'Yemen', 'Iraq', 'Syria',
  'Lebanon', 'Palestine', 'Pakistan', 'Bangladesh', 'India', 'Indonesia', 'Malaysia',
  'Turkey', 'United Kingdom', 'United States', 'Canada', 'Australia', 'Germany',
  'France', 'Netherlands', 'Other',
]

type Step = 'account' | 'profile'

export default function RegisterScreen() {
  const router = useRouter()
  const { showToast } = useStore()

  const [step, setStep] = useState<Step>('account')
  const [loading, setLoading] = useState(false)

  // Step 1
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')

  // Step 2
  const [username, setUsername] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState<'male' | 'female' | ''>('')
  const [country, setCountry] = useState('')

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [createdUserId, setCreatedUserId] = useState<string | null>(null)

  const validateStep1 = () => {
    const e: Record<string, string> = {}
    if (!email.trim()) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email'
    if (!password) e.password = 'Password is required'
    else if (password.length < 8) e.password = 'Password must be at least 8 characters'
    if (password !== confirm) e.confirm = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const validateStep2 = () => {
    const e: Record<string, string> = {}
    if (!username.trim()) e.username = 'Username is required'
    else if (username.trim().length < 3) e.username = 'At least 3 characters'
    else if (!/^[a-zA-Z0-9_]+$/.test(username)) e.username = 'Letters, numbers and _ only'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleStep1 = async () => {
    if (!validateStep1()) return
    setLoading(true)
    try {
      const userId = await registerUser(email.trim().toLowerCase(), password)
      setCreatedUserId(userId)
      setStep('profile')
    } catch (e: unknown) {
      const msg = (e as any)?.message ?? 'Registration failed'
      showToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleStep2 = async () => {
    if (!validateStep2() || !createdUserId) return
    setLoading(true)
    try {
      // Sign in FIRST so auth.uid() is set — required for RLS to allow profile upsert
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

      if (signInError?.message?.toLowerCase().includes('email')) {
        showToast('Check your email to confirm your account, then sign in.', 'success')
        router.replace('/(auth)/login')
        return
      }
      if (signInError) throw new Error(signInError.message)

      // Now authenticated — upsert profile
      await upsertProfile(createdUserId, {
        username: username.trim().toLowerCase(),
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        age: age ? parseInt(age, 10) : null,
        gender: gender || null,
        country: country || null,
      })

      router.replace('/(tabs)')
    } catch (e: unknown) {
      const msg = (e as any)?.message ?? 'Profile setup failed'
      showToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const GenderBtn = ({ value, label }: { value: 'male' | 'female'; label: string }) => (
    <TouchableOpacity
      style={[styles.genderBtn, gender === value && styles.genderBtnActive]}
      onPress={() => setGender(value)}
      activeOpacity={0.8}
    >
      <Text style={[styles.genderBtnText, gender === value && styles.genderBtnTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  )

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
        {/* Progress indicator */}
        <View style={styles.progress}>
          <View style={[styles.progressStep, styles.progressStepDone]} />
          <View style={[styles.progressLine, step === 'profile' && styles.progressLineDone]} />
          <View style={[styles.progressStep, step === 'profile' && styles.progressStepDone]} />
        </View>
        <Text style={styles.stepLabel}>
          Step {step === 'account' ? '1' : '2'} of 2 — {step === 'account' ? 'Account Details' : 'Your Profile'}
        </Text>

        {step === 'account' ? (
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
              onPress={handleStep1}
              loading={loading}
              fullWidth
              size="lg"
              style={styles.actionBtn}
            />
          </View>
        ) : (
          <View style={styles.form}>
            <Input
              label="Username *"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              placeholder="e.g. Abdullah123"
              hint="Letters, numbers and _ only"
              error={errors.username}
            />
            <View style={styles.row}>
              <View style={styles.half}>
                <Input
                  label="First Name (optional)"
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                  placeholder="Optional"
                />
              </View>
              <View style={styles.half}>
                <Input
                  label="Last Name (optional)"
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                  placeholder="Optional"
                />
              </View>
            </View>
            <Input
              label="Year of Birth (optional)"
              value={age}
              onChangeText={setAge}
              keyboardType="number-pad"
              placeholder="e.g. 1995"
            />

            {/* Gender */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Gender (optional)</Text>
              <View style={styles.genderRow}>
                <GenderBtn value="male" label="Male" />
                <GenderBtn value="female" label="Female" />
              </View>
            </View>

            {/* Country */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Country</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.countryScroll}
              >
                {COUNTRIES.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.countryChip, country === c && styles.countryChipActive]}
                    onPress={() => setCountry(c)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.countryChipText, country === c && styles.countryChipTextActive]}>
                      {c}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <Text style={styles.legalConsent}>
              By creating an account you agree to our{' '}
              <Text style={styles.legalLink} onPress={() => router.push('/terms')}>
                Terms of Service
              </Text>
              {' '}and{' '}
              <Text style={styles.legalLink} onPress={() => router.push('/privacy')}>
                Privacy Policy
              </Text>
              .
            </Text>

            <Button
              title="Create Account"
              onPress={handleStep2}
              loading={loading}
              fullWidth
              size="lg"
              style={styles.actionBtn}
            />
          </View>
        )}
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
  progress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressStep: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.border,
  },
  progressStepDone: { backgroundColor: colors.emerald },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
  },
  progressLineDone: { backgroundColor: colors.emerald },
  stepLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  form: { gap: spacing.lg },
  row: { flexDirection: 'row', gap: spacing.md },
  half: { flex: 1 },
  field: { gap: 8 },
  fieldLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  genderRow: { flexDirection: 'row', gap: spacing.md },
  genderBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.bgInput,
  },
  genderBtnActive: {
    borderColor: colors.emerald,
    backgroundColor: colors.emeraldDim,
  },
  genderBtnText: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    fontWeight: '500',
  },
  genderBtnTextActive: { color: colors.emeraldLight },
  countryScroll: { gap: spacing.sm, paddingVertical: 4 },
  countryChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.bgInput,
  },
  countryChipActive: {
    borderColor: colors.emerald,
    backgroundColor: colors.emeraldDim,
  },
  countryChipText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  countryChipTextActive: { color: colors.emeraldLight },
  errorText: {
    fontSize: fontSize.sm,
    color: colors.error,
  },
  actionBtn: { marginTop: spacing.sm },
  legalConsent: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: spacing.sm,
  },
  legalLink: {
    color: colors.emerald,
    fontWeight: '600',
  },
})
