import React, { useState, useEffect } from 'react'
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
import { Input } from '../src/components/ui/Input'
import { Button } from '../src/components/ui/Button'
import { Card } from '../src/components/ui/Card'
import { useAuth } from '../src/hooks/useAuth'
import { useStore } from '../src/store/useStore'
import { upsertProfile, updatePassword } from '../src/services/profiles'
import { colors, spacing, fontSize, fontWeight, radius } from '../src/constants/theme'

const COUNTRIES = [
  'Saudi Arabia', 'Egypt', 'UAE', 'Jordan', 'Kuwait', 'Qatar', 'Bahrain', 'Oman',
  'Morocco', 'Tunisia', 'Algeria', 'Libya', 'Sudan', 'Yemen', 'Iraq', 'Syria',
  'Lebanon', 'Palestine', 'Pakistan', 'Bangladesh', 'India', 'Indonesia', 'Malaysia',
  'Turkey', 'United Kingdom', 'United States', 'Canada', 'Australia', 'Germany',
  'France', 'Netherlands', 'Other',
]

export default function SettingsScreen() {
  const router = useRouter()
  const { profile, userId, setProfile: updateStoreProfile } = useAuth()
  const { showToast } = useStore()

  // Profile fields
  const [username, setUsername] = useState(profile?.username ?? '')
  const [firstName, setFirstName] = useState(profile?.first_name ?? '')
  const [lastName, setLastName] = useState(profile?.last_name ?? '')
  const [age, setAge] = useState(profile?.age?.toString() ?? '')
  const [gender, setGender] = useState<'male' | 'female' | ''>(profile?.gender ?? '')
  const [country, setCountry] = useState(profile?.country ?? '')
  const [city, setCity] = useState(profile?.city ?? '')

  // Password fields
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')

  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (profile) {
      setUsername(profile.username ?? '')
      setFirstName(profile.first_name ?? '')
      setLastName(profile.last_name ?? '')
      setAge(profile.age?.toString() ?? '')
      setGender(profile.gender ?? '')
      setCountry(profile.country ?? '')
      setCity(profile.city ?? '')
    }
  }, [profile])

  const handleSaveProfile = async () => {
    if (!userId) return

    const e: Record<string, string> = {}
    if (!username.trim()) e.username = 'Username is required'
    else if (username.trim().length < 3) e.username = 'At least 3 characters'
    else if (!/^[a-zA-Z0-9_]+$/.test(username)) e.username = 'Letters, numbers and _ only'
    setErrors(e)
    if (Object.keys(e).length) return

    setSavingProfile(true)
    try {
      const updated = await upsertProfile(userId, {
        username: username.trim().toLowerCase(),
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        age: age ? parseInt(age, 10) : null,
        gender: gender || null,
        country: country || null,
        city: city.trim() || null,
      })
      useStore.getState().setProfile(updated)
      showToast('Profile updated', 'success')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to update profile'
      showToast(msg, 'error')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async () => {
    if (!newPass) {
      setErrors(prev => ({ ...prev, newPass: 'Enter a new password' }))
      return
    }
    if (newPass.length < 8) {
      setErrors(prev => ({ ...prev, newPass: 'Min. 8 characters' }))
      return
    }
    if (newPass !== confirmPass) {
      setErrors(prev => ({ ...prev, confirmPass: 'Passwords do not match' }))
      return
    }

    setSavingPassword(true)
    try {
      await updatePassword(newPass)
      setNewPass('')
      setConfirmPass('')
      showToast('Password changed', 'success')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to change password'
      showToast(msg, 'error')
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
        {/* Profile section */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>

          <Input
            label="Username *"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            error={errors.username}
          />
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
          <View style={styles.row}>
            <View style={styles.half}>
              <Input
                label="Age"
                value={age}
                onChangeText={setAge}
                keyboardType="number-pad"
                placeholder="Optional"
              />
            </View>
            <View style={styles.half}>
              <Input
                label="City"
                value={city}
                onChangeText={setCity}
                autoCapitalize="words"
                placeholder="Optional"
              />
            </View>
          </View>

          {/* Gender */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Gender</Text>
            <View style={styles.genderRow}>
              {(['male', 'female'] as const).map(g => (
                <TouchableOpacity
                  key={g}
                  style={[styles.genderBtn, gender === g && styles.genderBtnActive]}
                  onPress={() => setGender(g)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.genderBtnText, gender === g && styles.genderBtnTextActive]}>
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Country */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Country</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.countryRow}
            >
              {COUNTRIES.map(c => (
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

          <Button
            title="Save Profile"
            onPress={handleSaveProfile}
            loading={savingProfile}
            fullWidth
          />
        </Card>

        {/* Password section */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Change Password</Text>

          <Input
            label="New Password"
            value={newPass}
            onChangeText={setNewPass}
            isPassword
            textContentType="newPassword"
            placeholder="Min. 8 characters"
            error={errors.newPass}
          />
          <Input
            label="Confirm New Password"
            value={confirmPass}
            onChangeText={setConfirmPass}
            isPassword
            textContentType="newPassword"
            placeholder="Repeat new password"
            error={errors.confirmPass}
          />

          <Button
            title="Change Password"
            onPress={handleChangePassword}
            loading={savingPassword}
            variant="secondary"
            fullWidth
          />
        </Card>

        {/* Legal */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <TouchableOpacity
            style={styles.legalRow}
            onPress={() => router.push('/privacy')}
            activeOpacity={0.7}
          >
            <Text style={styles.legalText}>Privacy Policy</Text>
            <Text style={styles.legalChevron}>›</Text>
          </TouchableOpacity>
        </Card>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.lg, gap: spacing.xl },
  section: { gap: spacing.lg },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  row: { flexDirection: 'row', gap: spacing.md },
  half: { flex: 1 },
  field: { gap: 8 },
  fieldLabel: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '500' },
  genderRow: { flexDirection: 'row', gap: spacing.md },
  genderBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.bgInput,
  },
  genderBtnActive: { borderColor: colors.emerald, backgroundColor: colors.emeraldDim },
  genderBtnText: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.textMuted,
  },
  genderBtnTextActive: { color: colors.emeraldLight },
  countryRow: { gap: spacing.sm, paddingVertical: 4 },
  countryChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.bgInput,
  },
  countryChipActive: { borderColor: colors.emerald, backgroundColor: colors.emeraldDim },
  countryChipText: { fontSize: fontSize.sm, color: colors.textMuted },
  countryChipTextActive: { color: colors.emeraldLight },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  legalText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  legalChevron: {
    fontSize: 22,
    color: colors.textMuted,
    lineHeight: 26,
  },
})
