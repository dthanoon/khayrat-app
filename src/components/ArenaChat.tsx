import React, { useRef, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LoadingSpinner } from './ui/LoadingSpinner'
import { useArenaChat } from '../hooks/useArenas'
import { timeAgo } from '../utils/date'
import { colors, spacing, fontSize, fontWeight, radius } from '../constants/theme'
import type { ArenaMessage } from '../types'

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🤲', '🌟', '💪', '🥇', '🤩']

// ─── Message bubble ───────────────────────────────────────────────────────────

interface MessageBubbleProps {
  message: ArenaMessage
  isMe: boolean
  onLongPress: (message: ArenaMessage) => void
  currentUserId: string
}

function MessageBubble({ message, isMe, onLongPress, currentUserId }: MessageBubbleProps) {
  // Group reactions by emoji
  const reactionGroups: Record<string, { count: number; mine: boolean }> = {}
  message.reactions?.forEach(r => {
    if (!reactionGroups[r.emoji]) reactionGroups[r.emoji] = { count: 0, mine: false }
    reactionGroups[r.emoji].count++
    if (r.user_id === currentUserId) reactionGroups[r.emoji].mine = true
  })
  const reactionEntries = Object.entries(reactionGroups)

  // @mention highlighting
  const contentParts = message.content.split(/(@\w+)/g)

  return (
    <View style={[styles.msgRow, isMe && styles.msgRowMe]}>
      {/* Avatar — only for others */}
      {!isMe && (
        <View style={styles.msgAvatar}>
          <Text style={styles.msgAvatarText}>
            {(message.profiles?.username ?? '?')[0].toUpperCase()}
          </Text>
        </View>
      )}

      {/* Bubble + reactions stacked */}
      <View style={[styles.bubbleCol, isMe && styles.bubbleColMe]}>
        <TouchableOpacity
          onLongPress={() => onLongPress(message)}
          delayLongPress={400}
          activeOpacity={0.85}
          style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}
        >
          {!isMe && (
            <Text style={styles.senderName}>{message.profiles?.username ?? 'Unknown'}</Text>
          )}
          <Text style={[styles.messageText, isMe && styles.messageTextMe]}>
            {contentParts.map((part, i) =>
              part.startsWith('@')
                ? <Text key={i} style={styles.mention}>{part}</Text>
                : part
            )}
          </Text>
          <Text style={[styles.timeText, isMe && styles.timeTextMe]}>
            {timeAgo(message.created_at)}
          </Text>
        </TouchableOpacity>

        {/* Reaction pills */}
        {reactionEntries.length > 0 && (
          <View style={[styles.reactionsRow, isMe && styles.reactionsRowMe]}>
            {reactionEntries.map(([emoji, { count, mine }]) => (
              <View key={emoji} style={[styles.reactionPill, mine && styles.reactionPillMine]}>
                <Text style={styles.reactionPillText}>{emoji} {count}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  arenaId: string
  currentUserId: string
}

export function ArenaChat({ arenaId, currentUserId }: Props) {
  const { messages, loading, sending, send, react } = useArenaChat(arenaId)
  const [content, setContent] = useState('')
  const [reactionTarget, setReactionTarget] = useState<ArenaMessage | null>(null)
  const flatListRef = useRef<FlatList>(null)

  const hasText = content.trim().length > 0

  const handleSend = async () => {
    if (!hasText) return
    const text = content.trim()
    setContent('')
    await send(text)
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80)
  }

  const handleReact = async (emoji: string) => {
    if (!reactionTarget) return
    await react(reactionTarget.id, emoji)
    setReactionTarget(null)
  }

  if (loading) return <LoadingSpinner message="Loading chat…" />

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <MessageBubble
            message={item}
            isMe={item.user_id === currentUserId}
            onLongPress={setReactionTarget}
            currentUserId={currentUserId}
          />
        )}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptyText}>Be the first to say Salam!</Text>
          </View>
        }
      />

      {/* Input bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={content}
          onChangeText={setContent}
          placeholder="Type a message…"
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.emerald}
          multiline
          maxLength={1000}
          returnKeyType="default"
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={sending || !hasText}
          style={[styles.sendBtn, hasText && styles.sendBtnActive]}
          activeOpacity={0.8}
        >
          <Ionicons
            name={sending ? 'ellipsis-horizontal' : 'send'}
            size={17}
            color={hasText ? '#000' : colors.textMuted}
          />
        </TouchableOpacity>
      </View>

      {/* Emoji reaction picker */}
      <Modal
        visible={!!reactionTarget}
        transparent
        animationType="fade"
        onRequestClose={() => setReactionTarget(null)}
      >
        <Pressable style={styles.overlay} onPress={() => setReactionTarget(null)}>
          <View style={styles.emojiSheet}>
            <View style={styles.emojiSheetHandle} />
            <Text style={styles.emojiSheetTitle}>React</Text>
            <View style={styles.emojiGrid}>
              {QUICK_EMOJIS.map(emoji => (
                <TouchableOpacity
                  key={emoji}
                  onPress={() => handleReact(emoji)}
                  style={styles.emojiBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.emojiChar}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
    gap: 2,
  },

  // Message row
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  msgRowMe: { flexDirection: 'row-reverse' },

  msgAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.bgCardAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    flexShrink: 0,
  },
  msgAvatarText: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: colors.textSecondary,
  },

  bubbleCol: {
    flex: 1,
    alignItems: 'flex-start',
    gap: 4,
    maxWidth: '82%',
  },
  bubbleColMe: { alignItems: 'flex-end' },

  bubble: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    gap: 3,
  },
  bubbleOther: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
    alignSelf: 'flex-start',
  },
  bubbleMe: {
    backgroundColor: colors.emeraldDim,
    borderWidth: 1,
    borderColor: `${colors.emerald}50`,
    borderBottomRightRadius: 4,
    alignSelf: 'flex-end',
  },
  senderName: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.emerald,
  },
  messageText: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  messageTextMe: { color: '#d1fae5' },
  mention: { color: colors.amber, fontWeight: fontWeight.semibold },
  timeText: {
    fontSize: 10,
    color: colors.textMuted,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  timeTextMe: { alignSelf: 'flex-end' },

  // Reactions
  reactionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    paddingLeft: 2,
  },
  reactionsRowMe: { paddingLeft: 0, paddingRight: 2, justifyContent: 'flex-end' },
  reactionPill: {
    backgroundColor: colors.bgCardAlt,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reactionPillMine: {
    borderColor: `${colors.emerald}80`,
    backgroundColor: `${colors.emerald}15`,
  },
  reactionPillText: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? spacing.sm : spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  input: {
    flex: 1,
    backgroundColor: colors.bgInput,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    maxHeight: 120,
    minHeight: 40,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  sendBtnActive: {
    backgroundColor: colors.emerald,
    borderColor: colors.emerald,
  },

  // Empty state
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    gap: spacing.sm,
  },
  emptyIcon: { fontSize: 40 },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  emptyText: { fontSize: fontSize.sm, color: colors.textMuted },

  // Emoji modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  emojiSheet: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.xl,
    paddingBottom: 36,
    gap: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  emojiSheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
  },
  emojiSheetTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
  },
  emojiBtn: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.bgCardAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emojiChar: { fontSize: 26 },
})
