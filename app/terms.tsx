import React from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { colors, spacing, fontSize, fontWeight, radius } from '../src/constants/theme'

export default function TermsScreen() {
  const router = useRouter()

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.label}>Legal</Text>
        <Text style={styles.pageTitle}>Terms of Service</Text>
        <Text style={styles.meta}>Last updated: April 17, 2026</Text>

        <Section title="1. Acceptance of Terms">
          <P>
            By downloading, installing, or using the Khayrat mobile application ("App"), you
            agree to be bound by these Terms of Service ("Terms"). If you do not agree, do not
            use the App.
          </P>
          <P>
            These Terms apply to all users of Khayrat, including registered account holders.
          </P>
        </Section>

        <Section title="2. Description of Service">
          <P>
            Khayrat is an Islamic good-deeds tracking app that allows users to log daily
            Quran reading, fasting, and Qiyam, view personal statistics, participate in
            competitive leaderboards, and engage in group or team arenas.
          </P>
        </Section>

        <Section title="3. Eligibility">
          <P>
            You must be at least 13 years old to use Khayrat. By using the App you represent
            that you meet this age requirement. If you are under 18, you represent that a parent
            or guardian has reviewed and agrees to these Terms on your behalf.
          </P>
        </Section>

        <Section title="4. Account Registration">
          <Bullet>
            You must provide a valid email address and create a secure password to register.
          </Bullet>
          <Bullet>
            You are responsible for maintaining the confidentiality of your account credentials
            and for all activity that occurs under your account.
          </Bullet>
          <Bullet>
            You must notify us immediately of any unauthorized use of your account at
            david.thanoon@gmail.com.
          </Bullet>
          <Bullet>
            One person may not maintain more than one account.
          </Bullet>
        </Section>

        <Section title="5. Acceptable Use">
          <P>You agree not to:</P>
          <Bullet>
            Post false, misleading, or fraudulent log entries to gain an unfair advantage in
            leaderboards or arenas.
          </Bullet>
          <Bullet>
            Use the App to harass, abuse, threaten, or intimidate other users.
          </Bullet>
          <Bullet>
            Post offensive, obscene, hateful, or discriminatory content in arena chats.
          </Bullet>
          <Bullet>
            Attempt to circumvent, hack, or reverse-engineer any part of the App or its
            backend services.
          </Bullet>
          <Bullet>
            Use automated bots or scripts to interact with the App.
          </Bullet>
          <Bullet>
            Impersonate any person or entity, or misrepresent your affiliation with any person
            or organization.
          </Bullet>
        </Section>

        <Section title="6. User Content">
          <P>
            You retain ownership of any content you submit to Khayrat (such as arena chat
            messages or your username). By posting content, you grant Khayrat a non-exclusive,
            royalty-free, worldwide license to display that content within the App for the
            purpose of operating the service.
          </P>
          <P>
            We reserve the right to remove any content that violates these Terms or that we
            deem harmful to the community, without prior notice.
          </P>
        </Section>

        <Section title="7. Arena Participation">
          <P>
            Arenas are voluntary competitions between users. Scores and rankings are calculated
            based on self-reported data. Khayrat does not independently verify logs, and relies
            on users to act in good faith.
          </P>
          <P>
            Arena creators may set invite codes. Sharing an invite code outside the intended
            group is at the arena creator's discretion.
          </P>
        </Section>

        <Section title="8. Intellectual Property">
          <P>
            All intellectual property in the Khayrat App — including its design, code, logos,
            and branding — is owned by Khayrat. You may not copy, modify, distribute, sell, or
            lease any part of the App without written permission.
          </P>
        </Section>

        <Section title="9. Disclaimers">
          <P>
            Khayrat is provided "as is" and "as available" without warranties of any kind,
            express or implied. We do not warrant that the App will be uninterrupted, error-free,
            or free of viruses or other harmful components.
          </P>
          <P>
            Khayrat is a motivational tool. We make no religious, spiritual, or scholarly claims
            about the content. Users should consult qualified Islamic scholars for religious guidance.
          </P>
        </Section>

        <Section title="10. Limitation of Liability">
          <P>
            To the maximum extent permitted by applicable law, Khayrat and its developers shall
            not be liable for any indirect, incidental, special, consequential, or punitive
            damages arising out of or related to your use of the App, even if we have been
            advised of the possibility of such damages.
          </P>
          <P>
            Our total liability for any claim arising from these Terms or the App shall not
            exceed the amount you paid us (if any) in the 12 months preceding the claim.
          </P>
        </Section>

        <Section title="11. Account Termination">
          <P>
            You may delete your account at any time from the Settings screen. Upon deletion,
            your personal data will be removed within 30 days as described in our Privacy Policy.
          </P>
          <P>
            We reserve the right to suspend or terminate your account if you violate these Terms,
            without prior notice and without liability.
          </P>
        </Section>

        <Section title="12. Modifications to Terms">
          <P>
            We may update these Terms from time to time. We will notify you of material changes
            via in-app notification or email. Continued use of the App after changes become
            effective constitutes acceptance of the revised Terms.
          </P>
        </Section>

        <Section title="13. Governing Law">
          <P>
            These Terms are governed by and construed in accordance with applicable law. Any
            disputes shall be resolved by binding arbitration or in a court of competent
            jurisdiction, as required by applicable consumer protection law in your region.
          </P>
        </Section>

        <Section title="14. Contact">
          <P>For any questions about these Terms, please contact:</P>
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

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View style={bulletStyles.row}>
      <Text style={bulletStyles.dot}>•</Text>
      <Text style={bulletStyles.text}>{children}</Text>
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
})
