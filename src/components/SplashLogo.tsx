import React, { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Animated } from 'react-native'

// ─── Change this to 1, 2, or 3 to preview each option ────────────────────────
export const ACTIVE_LOGO_VARIANT: 1 | 2 | 3 = 1

// ─── Option 1: Crescent & Stars ───────────────────────────────────────────────
function CrescentLogo() {
  return (
    <View style={styles.logoWrap}>
      {/* Crescent: emerald circle with dark circle offset to carve out the crescent */}
      <View style={styles.crescentOuter}>
        <View style={styles.crescentInner} />
        {/* Stars */}
        <Text style={[styles.star, { top: 6, right: 6, fontSize: 13 }]}>✦</Text>
        <Text style={[styles.star, { top: 26, right: -4, fontSize: 9 }]}>✦</Text>
        <Text style={[styles.star, { top: 48, right: 8, fontSize: 7 }]}>✦</Text>
      </View>

      <View style={styles.nameBlock}>
        <Text style={styles.nameEn}>KHAYRAT</Text>
        <Text style={styles.nameAr}>خيرات</Text>
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.tagline}>GOOD DEEDS TRACKER</Text>
          <View style={styles.dividerLine} />
        </View>
      </View>
    </View>
  )
}

// ─── Option 2: Tasbeeh Ring ───────────────────────────────────────────────────
function TasbeehLogo() {
  const BEAD_COUNT = 12
  const RING_R = 52
  const CONTAINER = 130

  return (
    <View style={styles.logoWrap}>
      <View style={{ width: CONTAINER, height: CONTAINER }}>
        {/* Center emblem */}
        <View style={[styles.tasbeehCenter, {
          left: CONTAINER / 2 - 22,
          top: CONTAINER / 2 - 22,
        }]}>
          <Text style={styles.tasbeehCenterText}>خ</Text>
        </View>

        {/* Beads */}
        {Array.from({ length: BEAD_COUNT }).map((_, i) => {
          const angle = (i / BEAD_COUNT) * 2 * Math.PI - Math.PI / 2
          const x = CONTAINER / 2 + RING_R * Math.cos(angle)
          const y = CONTAINER / 2 + RING_R * Math.sin(angle)
          const isMarker = i === 0
          const size = isMarker ? 16 : 11
          return (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: x - size / 2,
                top: y - size / 2,
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: isMarker ? '#f59e0b' : '#10b981',
                opacity: isMarker ? 1 : 0.55 + (i / BEAD_COUNT) * 0.45,
              }}
            />
          )
        })}
      </View>

      <View style={styles.nameBlock}>
        <Text style={[styles.nameEn, { color: '#ffffff' }]}>KHAYRAT</Text>
        <Text style={styles.nameAr}>خيرات</Text>
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.tagline}>GOOD DEEDS TRACKER</Text>
          <View style={styles.dividerLine} />
        </View>
      </View>
    </View>
  )
}

// ─── Option 3: Three Deed Cards ───────────────────────────────────────────────
function DeedCardsLogo() {
  return (
    <View style={styles.logoWrap}>
      <View style={styles.cardsContainer}>
        {/* Back card — Qiyam (purple) */}
        <View style={[styles.card, styles.cardBack]}>
          <Text style={styles.cardEmoji}>🌟</Text>
        </View>

        {/* Middle card — Fasting (amber) */}
        <View style={[styles.card, styles.cardMid]}>
          <Text style={styles.cardEmoji}>🌙</Text>
        </View>

        {/* Front card — Quran (emerald) */}
        <View style={[styles.card, styles.cardFront]}>
          <Text style={styles.cardFrontEmoji}>📖</Text>
          <View style={styles.cardLine} />
          <View style={[styles.cardLine, { width: '55%' }]} />
          <Text style={styles.cardAr}>خير</Text>
        </View>
      </View>

      <View style={styles.nameBlock}>
        <Text style={[styles.nameEn, { color: '#ffffff', letterSpacing: 4 }]}>KHAYRAT</Text>
        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: '#10b981' }]} />
          <Text style={[styles.nameAr, { marginTop: 0 }]}>خيرات</Text>
          <View style={[styles.dividerLine, { backgroundColor: '#10b981' }]} />
        </View>
        <Text style={styles.tagline}>GOOD DEEDS TRACKER</Text>
      </View>
    </View>
  )
}

// ─── Animated wrapper ─────────────────────────────────────────────────────────
export function AppSplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.88)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 45,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  const Logo =
    ACTIVE_LOGO_VARIANT === 1
      ? CrescentLogo
      : ACTIVE_LOGO_VARIANT === 2
      ? TasbeehLogo
      : DeedCardsLogo

  return (
    <View style={styles.screen}>
      <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
        <Logo />
      </Animated.View>

      {/* Subtle bottom glow */}
      <View style={styles.glow} />
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: '#10b981',
    opacity: 0.03,
  },

  logoWrap: { alignItems: 'center', gap: 32 },

  // ── Option 1: Crescent ──
  crescentOuter: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#10b981',
    overflow: 'hidden',
  },
  crescentInner: {
    position: 'absolute',
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#0a0a0a',
    top: -14,
    right: -14,
  },
  star: {
    position: 'absolute',
    color: '#f59e0b',
    fontWeight: '900',
  },

  // ── Option 2: Tasbeeh ──
  tasbeehCenter: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
  },
  tasbeehCenterText: {
    color: '#000',
    fontSize: 20,
    fontWeight: '900',
  },

  // ── Option 3: Cards ──
  cardsContainer: {
    width: 120,
    height: 130,
    position: 'relative',
  },
  card: {
    position: 'absolute',
    width: 82,
    height: 100,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 12,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  cardBack: {
    left: 20,
    top: 16,
    backgroundColor: '#2e1065',
    borderColor: '#8b5cf6',
    transform: [{ rotate: '-9deg' }],
  },
  cardMid: {
    left: 14,
    top: 10,
    backgroundColor: '#451a03',
    borderColor: '#f59e0b',
    transform: [{ rotate: '-3deg' }],
  },
  cardFront: {
    left: 8,
    top: 4,
    backgroundColor: '#022c22',
    borderColor: '#10b981',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    gap: 7,
  },
  cardEmoji: { fontSize: 22 },
  cardFrontEmoji: { fontSize: 24 },
  cardLine: {
    width: '80%',
    height: 2,
    backgroundColor: '#10b98133',
    borderRadius: 1,
  },
  cardAr: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    color: '#10b981',
    fontWeight: '800',
    fontSize: 13,
  },

  // ── Shared text ──
  nameBlock: { alignItems: 'center', gap: 8 },
  nameEn: {
    fontSize: 38,
    fontWeight: '800',
    color: '#10b981',
    letterSpacing: 5,
  },
  nameAr: {
    fontSize: 20,
    color: '#f59e0b',
    fontWeight: '600',
    marginTop: 2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  dividerLine: {
    width: 24,
    height: 1,
    backgroundColor: '#333',
  },
  tagline: {
    fontSize: 11,
    color: '#4b5563',
    letterSpacing: 2.5,
    fontWeight: '500',
  },
})
