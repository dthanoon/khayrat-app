import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Input } from '../../src/components/ui/Input'
import { Button } from '../../src/components/ui/Button'
import { registerUser, upsertProfile } from '../../src/services/profiles'
import { supabase } from '../../src/services/supabase'
import { useStore } from '../../src/store/useStore'
import { colors, spacing, fontSize, fontWeight, radius } from '../../src/constants/theme'

// ── Islamic name generation ────────────────────────────────────────────────────

const ISLAMIC_ATTRIBUTES = [
  'Muhajirun', 'Ansar', 'Sabiqun', 'Muqarrabun', 'Abrar',
  'Siddiqun', 'Shuhada', 'Salihun', 'Muttaqun', 'Muhsinun',
  'Muflihun', 'Rabbaniyun', 'Qanitin', 'Khashi', 'Mukhlis',
  'Tawwabun', 'Mutatahhirun', 'Mutawakkilun', 'Munibun', 'Sabbirun',
  'Shakirun', 'Dhakirun', 'Mutafakkirun', 'Mujahidun', 'Murabitun',
  'Hanif', 'Halim', 'Awwab', 'Mukhbit', 'Zahid',
  'Siddiq', 'Wali', 'Amin', 'Ihsan', 'Taqwa',
  'Furqan', 'Sabr', 'Noor', 'Fajr', 'Rashid',
  'Zafar', 'Nasr', 'Hadi', 'Hilal', 'Badr',
]

const ISLAMIC_ANIMALS = [
  'Nahl', 'Naml', 'Hudhud', 'Asad', 'Faras',
  'Hisan', 'Uqab', 'Saqr', 'Shaheen', 'Hamama',
  'Tawus', 'Qata', 'Dhulul', 'Kabsh', 'Fahd',
  'Nimr', 'Ghazal', 'Reem', 'Saluqi', 'Maha',
  'Nasr', 'Ababeel', 'Oryx', 'Thawr',
]

function generateMuslimUsername(): string {
  const pool = [...ISLAMIC_ATTRIBUTES, ...ISLAMIC_ANIMALS]
  const word = pool[Math.floor(Math.random() * pool.length)]
  const suffix = Math.floor(100 + Math.random() * 9900)
  return `${word}${suffix}`
}

function generateUsernameSuggestions(count = 10): string[] {
  const suggestions: string[] = []
  const used = new Set<string>()
  while (suggestions.length < count) {
    const u = generateMuslimUsername()
    if (!used.has(u)) { used.add(u); suggestions.push(u) }
  }
  return suggestions
}

// ── Countries ──────────────────────────────────────────────────────────────────

const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Argentina', 'Australia',
  'Austria', 'Azerbaijan', 'Bahrain', 'Bangladesh', 'Belgium',
  'Bosnia and Herzegovina', 'Brazil', 'Brunei', 'Canada', 'Chad',
  'China', 'Comoros', 'Djibouti', 'Egypt', 'Ethiopia',
  'France', 'Gambia', 'Germany', 'Ghana', 'Guinea',
  'Guinea-Bissau', 'India', 'Indonesia', 'Iran', 'Iraq',
  'Italy', 'Jordan', 'Kazakhstan', 'Kenya', 'Kosovo',
  'Kuwait', 'Kyrgyzstan', 'Lebanon', 'Libya', 'Malaysia',
  'Maldives', 'Mali', 'Mauritania', 'Morocco', 'Mozambique',
  'Niger', 'Nigeria', 'Oman', 'Pakistan', 'Palestine',
  'Philippines', 'Qatar', 'Russia', 'Saudi Arabia', 'Senegal',
  'Sierra Leone', 'Somalia', 'South Africa', 'Spain', 'Sudan',
  'Syria', 'Tajikistan', 'Tanzania', 'Tunisia', 'Turkey',
  'Turkmenistan', 'Uganda', 'United Arab Emirates', 'United Kingdom',
  'United States', 'Uzbekistan', 'Yemen', 'Other',
].sort()

// ─────────────────────────────────────────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear()

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

  // Step 2 – username picker
  const [suggestions, setSuggestions] = useState<string[]>(() => generateUsernameSuggestions(10))
  const [customMode, setCustomMode] = useState(false)
  const [intentConsent, setIntentConsent] = useState(false)
  const [username, setUsername] = useState('')

  // Step 2 – profile fields
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [birthYear, setBirthYear] = useState('')
  const [gender, setGender] = useState<'male' | 'female' | ''>('')
  const [country, setCountry] = useState('')
  const [city, setCity] = useState('')

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [createdUserId, setCreatedUserId] = useState<string | null>(null)
  const [sessionReady, setSessionReady] = useState(false)

  const regenerateSuggestions = () => {
    setSuggestions(generateUsernameSuggestions(10))
    setUsername('')
  }

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
    if (!username.trim()) e.username = 'Please choose a username'
    else if (username.trim().length < 3) e.username = 'At least 3 characters'
    else if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) e.username = 'Letters, numbers and _ only'
    if (birthYear) {
      const yr = parseInt(birthYear, 10)
      if (!/^\d{4}$/.test(birthYear) || yr < 1930 || yr > CURRENT_YEAR - 5)
        e.birthYear = 'Enter a valid birth year (e.g. 1995)'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleStep1 = async () => {
    if (!validateStep1()) return
    setLoading(true)
    try {
      const { userId, sessionReady: ready } = await registerUser(email.trim().toLowerCase(), password)
      setCreatedUserId(userId)
      setSessionReady(ready)
      setStep('profile')
    } catch (e: unknown) {
      showToast((e as any)?.message ?? 'Registration failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleStep2 = async () => {
    if (!validateStep2() || !createdUserId) return
    setLoading(true)
    try {
      if (!sessionReady) {
        showToast('Account created! Check your email to confirm, then sign in.', 'success')
        router.replace('/(auth)/login')
        return
      }

      // Check username uniqueness
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username.trim().toLowerCase())
        .neq('id', createdUserId)
        .maybeSingle()

      if (existing) {
        setErrors({ username: 'Username already taken — please choose another' })
        setLoading(false)
        return
      }

      const age = birthYear ? CURRENT_YEAR - parseInt(birthYear, 10) : null

      await upsertProfile(createdUserId, {
        username: username.trim().toLowerCase(),
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        age,
        gender: gender || null,
        country: country || null,
        city: city.trim() || null,
      })

      router.replace('/(tabs)')
    } catch (e: unknown) {
      showToast((e as any)?.message ?? 'Profile setup failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  const GenderBtn = ({ value, label }: { value: 'male' | 'female'; label: string }) => (
    <TouchableOpacity
      style={[styles.genderBtn, gender === value && styles.genderBtnActive]}
      onPress={() => setGender(g => g === value ? '' : value)}
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
        {/* Progress */}
        <View style={styles.progress}>
          <View style={[styles.progressStep, styles.progressStepDone]} />
          <View style={[styles.progressLine, step === 'profile' && styles.progressLineDone]} />
          <View style={[styles.progressStep, step === 'profile' && styles.progressStepDone]} />
        </View>
        <Text style={styles.stepLabel}>
          Step {step === 'account' ? '1' : '2'} of 2 — {step === 'account' ? 'Account Details' : 'Your Profile'}
        </Text>

        {/* ── Step 1: Email + Password ─────────────────────────── */}
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
          /* ── Step 2: Profile ──────────────────────────────────── */
          <View style={styles.form}>

            {/* Username picker */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>
                Username <Text style={{ color: colors.error }}>*</Text>
              </Text>

              {!customMode ? (
                <>
                  <View style={styles.suggestionsBox}>
                    <View style={styles.suggestionsHeader}>
                      <Text style={styles.suggestionsHint}>
                        Choose an Islamic name to protect your sincerity (ikhlas)
                      </Text>
                      <TouchableOpacity onPress={regenerateSuggestions} style={styles.regenBtn} activeOpacity={0.7}>
                        <Ionicons name="refresh-outline" size={13} color={colors.emerald} />
                        <Text style={styles.regenText}>New</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.suggestionsGrid}>
                      {suggestions.map(s => (
                        <TouchableOpacity
                          key={s}
                          onPress={() => { setUsername(s); setErrors(e => ({ ...e, username: '' })) }}
                          style={[styles.suggestionChip, username === s && styles.suggestionChipActive]}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.suggestionChipText, username === s && styles.suggestionChipTextActive]}>
                            {s}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    {username ? (
                      <Text style={styles.selectedLabel}>
                        Selected:{' '}
                        <Text style={{ color: colors.emeraldLight, fontWeight: fontWeight.bold }}>{username}</Text>
                      </Text>
                    ) : null}
                  </View>
                  {errors.username ? <Text style={styles.errorText}>{errors.username}</Text> : null}
                  <TouchableOpacity onPress={() => setCustomMode(true)} activeOpacity={0.7}>
                    <Text style={styles.switchLink}>I want to choose my own username instead</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {/* Ikhlas consent before unlocking custom username */}
                  <TouchableOpacity
                    style={[styles.consentBox, intentConsent && styles.consentBoxChecked]}
                    onPress={() => setIntentConsent(v => !v)}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.consentCheckbox, intentConsent && styles.consentCheckboxChecked]}>
                      {intentConsent && <Ionicons name="checkmark" size={12} color="#000" />}
                    </View>
                    <Text style={styles.consentText}>
                      I understand that using an anonymous name protects my sincerity (ikhlas) — keeping my worship between me and Allah. I commit to not revealing my identity through my username.
                    </Text>
                  </TouchableOpacity>

                  <Input
                    label=""
                    value={username}
                    onChangeText={t => { setUsername(t); setErrors(e => ({ ...e, username: '' })) }}
                    autoCapitalize="none"
                    placeholder={intentConsent ? 'your_username' : 'Tick the box above to unlock'}
                    hint="Letters, numbers and _ only"
                    error={errors.username}
                    editable={intentConsent}
                    style={!intentConsent ? { opacity: 0.4 } : undefined}
                  />

                  <TouchableOpacity
                    onPress={() => { setCustomMode(false); setIntentConsent(false); setUsername('') }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.switchLink}>← Back to suggested names</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* Real name — private note */}
            <View style={styles.privacyBox}>
              <Ionicons name="lock-closed-outline" size={13} color={colors.textMuted} />
              <Text style={styles.privacyNote}>
                Your real name is{' '}
                <Text style={{ color: colors.textSecondary, fontWeight: fontWeight.semibold }}>private</Text>
                {' '}— only visible to you when logged in. Never shown publicly.
              </Text>
            </View>

            <View style={styles.row}>
              <View style={styles.half}>
                <Input
                  label="First Name"
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                  placeholder="Optional"
                />
              </View>
              <View style={styles.half}>
                <Input
                  label="Last Name"
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                  placeholder="Optional"
                />
              </View>
            </View>

            <Input
              label="Year of Birth (optional)"
              value={birthYear}
              onChangeText={setBirthYear}
              keyboardType="number-pad"
              placeholder={`e.g. ${CURRENT_YEAR - 25}`}
              error={errors.birthYear}
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
              <Text style={styles.fieldLabel}>Country (optional)</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsScroll}
              >
                {COUNTRIES.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.chip, country === c && styles.chipActive]}
                    onPress={() => setCountry(c === country ? '' : c)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipText, country === c && styles.chipTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* City */}
            <Input
              label="City (optional)"
              value={city}
              onChangeText={setCity}
              autoCapitalize="words"
              placeholder="e.g. Riyadh"
            />

            <Text style={styles.legalConsent}>
              By creating an account you agree to our{' '}
              <Text style={styles.legalLink} onPress={() => router.push('/terms')}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={styles.legalLink} onPress={() => router.push('/privacy')}>Privacy Policy</Text>.
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
  progress: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  progressStep: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.border },
  progressStepDone: { backgroundColor: colors.emerald },
  progressLine: { flex: 1, height: 2, backgroundColor: colors.border },
  progressLineDone: { backgroundColor: colors.emerald },
  stepLabel: { fontSize: fontSize.sm, color: colors.textMuted },

  form: { gap: spacing.lg },
  row: { flexDirection: 'row', gap: spacing.md },
  half: { flex: 1 },
  field: { gap: 8 },
  fieldLabel: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '500' },

  // Username suggestions
  suggestionsBox: {
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: 'rgba(16,185,129,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.15)',
    gap: spacing.sm,
  },
  suggestionsHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  suggestionsHint: { flex: 1, fontSize: fontSize.xs, color: '#6ee7b7', lineHeight: 17 },
  regenBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, flexShrink: 0 },
  regenText: { fontSize: fontSize.xs, color: colors.emerald, fontWeight: fontWeight.medium },
  suggestionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  suggestionChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  suggestionChipActive: {
    backgroundColor: 'rgba(16,185,129,0.25)',
    borderColor: 'rgba(16,185,129,0.5)',
  },
  suggestionChipText: { fontSize: fontSize.xs, color: colors.textMuted },
  suggestionChipTextActive: { color: colors.emeraldLight, fontWeight: fontWeight.semibold },
  selectedLabel: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },

  switchLink: { fontSize: fontSize.xs, color: colors.textMuted, textDecorationLine: 'underline', marginTop: 4 },
  errorText: { fontSize: fontSize.sm, color: colors.error },

  // Custom username consent
  consentBox: {
    flexDirection: 'row',
    gap: spacing.sm,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: 'rgba(245,158,11,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.2)',
    alignItems: 'flex-start',
  },
  consentBoxChecked: {
    backgroundColor: 'rgba(16,185,129,0.06)',
    borderColor: 'rgba(16,185,129,0.2)',
  },
  consentCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  consentCheckboxChecked: { backgroundColor: colors.emerald, borderColor: colors.emerald },
  consentText: { flex: 1, fontSize: fontSize.xs, color: '#fde68a', lineHeight: 17 },

  // Real name privacy note
  privacyBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  privacyNote: { flex: 1, fontSize: fontSize.xs, color: colors.textMuted, lineHeight: 17 },

  // Gender
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
  genderBtnActive: { borderColor: colors.emerald, backgroundColor: colors.emeraldDim },
  genderBtnText: { fontSize: fontSize.md, color: colors.textMuted, fontWeight: '500' },
  genderBtnTextActive: { color: colors.emeraldLight },

  // Country / chip scroll
  chipsScroll: { gap: spacing.sm, paddingVertical: 4 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.bgInput,
  },
  chipActive: { borderColor: colors.emerald, backgroundColor: colors.emeraldDim },
  chipText: { fontSize: fontSize.sm, color: colors.textMuted },
  chipTextActive: { color: colors.emeraldLight },

  actionBtn: { marginTop: spacing.sm },
  legalConsent: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: spacing.sm,
  },
  legalLink: { color: colors.emerald, fontWeight: '600' },
})
