import React from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { colors, spacing, fontSize, fontWeight, radius } from '../src/constants/theme'

export default function PrivacyPolicyScreen() {
  const router = useRouter()

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.label}>Legal</Text>
        <Text style={styles.pageTitle}>Privacy Policy</Text>
        <Text style={styles.meta}>Last updated: April 17, 2026</Text>

        <Section title="1. Introduction">
          <P>
            Khayrat ("we", "our", or "us") is an Islamic practice tracker that helps Muslims
            record their daily Quran reading, fasting, and Qiyam, and compete with one another
            in leaderboards and arenas. This Privacy Policy explains what personal data we
            collect, how we use it, and the rights you have over it.
          </P>
          <P>
            By using Khayrat — through our website or this mobile application — you agree to
            the practices described in this policy.
          </P>
        </Section>

        <Section title="2. Data We Collect">
          <P>We collect only what is necessary to provide the service:</P>
          <Bullet label="Account information:">
            Your email address and password (stored as a secure hash), used for authentication.
          </Bullet>
          <Bullet label="Profile information:">
            Username, first name, last name, country, city, age, and gender — provided
            voluntarily to personalise your public profile.
          </Bullet>
          <Bullet label="Activity data:">
            Daily logs of Quran pages read, fasting days, and Qiyam sessions that you submit
            within the app.
          </Bullet>
          <Bullet label="Arena & social data:">
            Arenas you create or join, messages posted in arena chats, and invitation activity.
          </Bullet>
          <Bullet label="Technical data:">
            Basic request metadata (IP address, device type, timestamps) collected automatically
            by our hosting infrastructure for security and performance.
          </Bullet>
          <P>
            We do <Text style={styles.bold}>not</Text> collect payment information, precise
            location beyond country/city, or any biometric data.
          </P>
        </Section>

        <Section title="3. How We Use Your Data">
          <Bullet>To create and manage your account and authenticate you securely.</Bullet>
          <Bullet>To calculate leaderboard scores and display rankings.</Bullet>
          <Bullet>To power arena features including group progress and chat.</Bullet>
          <Bullet>
            To send transactional notifications (e.g., arena invitations) where you have opted in.
          </Bullet>
          <Bullet>To detect and prevent abuse or fraudulent activity.</Bullet>
          <Bullet>To improve the service through anonymised, aggregated usage analysis.</Bullet>
          <P>
            We do <Text style={styles.bold}>not</Text> sell, rent, or trade your personal
            data to third parties for marketing purposes.
          </P>
        </Section>

        <Section title="4. Legal Basis for Processing">
          <P>
            If you are in the EEA or United Kingdom, we process your data under the following
            lawful bases:
          </P>
          <Bullet label="Contract:">Processing necessary to provide the service you signed up for.</Bullet>
          <Bullet label="Legitimate interests:">Security monitoring and aggregate analytics.</Bullet>
          <Bullet label="Consent:">Optional notifications, which you can withdraw at any time.</Bullet>
        </Section>

        <Section title="5. Data Sharing">
          <P>We share data only with the sub-processors necessary to operate the service:</P>
          <Bullet label="Supabase, Inc.">
            Our database and authentication provider (SOC 2 Type II certified), hosting data
            on AWS.
          </Bullet>
          <Bullet label="Vercel, Inc.">
            Our web hosting provider. Edge request logs are retained briefly for debugging.
          </Bullet>
          <Bullet label="Apple / Google:">
            For mobile app distribution. Your app store account is governed by their respective
            privacy policies.
          </Bullet>
          <P>
            We may also disclose information if required by law, court order, or to protect
            the rights or safety of our users.
          </P>
        </Section>

        <Section title="6. Public Information">
          <P>
            Your username, country, and aggregated activity statistics (total points,
            consistency percentage, active days) are visible to other users on leaderboards
            and inside arenas you join. Arena chat messages are visible to all members of
            that arena. You can choose a pseudonymous username to limit identifiability.
          </P>
        </Section>

        <Section title="7. Data Retention">
          <P>
            We retain your personal data for as long as your account is active. If you delete
            your account, we will delete or anonymise your personal data within 30 days, except
            where retention is required by law or for fraud prevention.
          </P>
        </Section>

        <Section title="8. Your Rights">
          <P>Depending on your jurisdiction you may have the right to:</P>
          <Bullet label="Access">the personal data we hold about you.</Bullet>
          <Bullet label="Correct">inaccurate data via your account settings.</Bullet>
          <Bullet label="Delete">your account and associated data.</Bullet>
          <Bullet label="Export">your data in a portable format.</Bullet>
          <Bullet label="Object">to or restrict certain processing.</Bullet>
          <Bullet label="Withdraw consent">for notifications at any time.</Bullet>
          <P>
            To exercise any of these rights, contact us at the address below. We will respond
            within 30 days.
          </P>
        </Section>

        <Section title="9. Children's Privacy">
          <P>
            Khayrat is not directed at children under 13. We do not knowingly collect personal
            data from anyone under 13. If you believe a child has provided us with personal
            data, please contact us and we will delete it promptly.
          </P>
        </Section>

        <Section title="10. Security">
          <P>
            We implement industry-standard security measures including TLS encryption in
            transit, hashed passwords, and row-level security policies in our database. No
            system is completely secure; in the event of a data breach affecting your rights
            we will notify you as required by applicable law.
          </P>
        </Section>

        <Section title="11. Cookies & Tracking">
          <P>
            The mobile app does not use browser cookies. Authentication uses a secure token
            stored in your device's secure storage. We do not use advertising SDKs or
            third-party analytics trackers.
          </P>
        </Section>

        <Section title="12. Changes to This Policy">
          <P>
            We may update this policy from time to time. When we make material changes, we
            will update the "Last updated" date and notify you by in-app message or email
            where appropriate. Continued use of Khayrat after changes constitutes acceptance
            of the updated policy.
          </P>
        </Section>

        <Section title="13. Contact Us">
          <P>
            If you have any questions, requests, or concerns about this Privacy Policy or
            how we handle your data, please contact:
          </P>
          <View style={styles.contactCard}>
            <Text style={styles.contactName}>Khayrat</Text>
            <TouchableOpacity
              onPress={() => Linking.openURL('mailto:david.thanoon@gmail.com')}
            >
              <Text style={styles.contactEmail}>david.thanoon@gmail.com</Text>
            </TouchableOpacity>
          </View>
        </Section>

        <View style={{ height: spacing.xxxl }} />
      </ScrollView>
    </View>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={sectionStyles.container}>
      <Text style={sectionStyles.title}>{title}</Text>
      {children}
    </View>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return <Text style={pStyles.text}>{children}</Text>
}

function Bullet({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <View style={bulletStyles.row}>
      <Text style={bulletStyles.dot}>•</Text>
      <Text style={bulletStyles.text}>
        {label ? <Text style={bulletStyles.label}>{label} </Text> : null}
        {children}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: 56,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.emerald,
    marginBottom: spacing.sm,
    opacity: 0.7,
  },
  pageTitle: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  meta: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.xxl,
  },
  bold: {
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  contactCard: {
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  contactName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  contactEmail: {
    fontSize: fontSize.md,
    color: colors.emerald,
  },
})

const sectionStyles = StyleSheet.create({
  container: {
    marginBottom: spacing.xxl,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
})

const pStyles = StyleSheet.create({
  text: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: spacing.md,
  },
})

const bulletStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    paddingLeft: spacing.sm,
  },
  dot: {
    fontSize: fontSize.md,
    color: colors.emerald,
    marginRight: spacing.sm,
    marginTop: 1,
  },
  text: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  label: {
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
})
