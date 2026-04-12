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

interface MessageBubbleProps {
  message: ArenaMessage
  isMe: boolean
  onLongPress: (message: ArenaMessage) => void
  currentUserId: string
}

function MessageBubble({ message, isMe, onLongPress, currentUserId }: MessageBubbleProps) {
  // Highlight @mentions of current user's username
  const renderContent = (text: string) => {
    // Simple @mention highlighting
    const parts = text.split(/(@\w+)/g)
    return (
      <Text style={[styles.messageText, isMe && styles.messageTextMe]}>
        {parts.map((part, i) =>
          part.startsWith('@') ? (
            <Text key={i} style={styles.mention}>{part}</Text>
          ) : (
            part
          )
        )}
      </Text>
    )
  }

  return (
    <TouchableOpacity
      onLongPress={() => onLongPress(message)}
      delayLongPress={400}
      activeOpacity={0.9}
      style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}
    >
      {!isMe && (
        <Text style={styles.senderName}>{message.profiles?.username ?? 'Unknown'}</Text>
      )}
      {renderContent(message.content)}
      <Text style={[styles.time, isMe && styles.timeMe]}>{timeAgo(message.created_at)}</Text>
    </TouchableOpacity>
  )
}

interface Props {
  arenaId: string
  currentUserId: string
}

export function ArenaChat({ arenaId, currentUserId }: Props) {
  const { messages, loading, sending, send, react } = useArenaChat(arenaId)
  const [content, setContent] = useState('')
  const [reactionTarget, setReactionTarget] = useState<ArenaMessage | null>(null)
  const flatListRef = useRef<FlatList>(null)

  const handleSend = async () => {
    if (!content.trim()) return
    const text = content
    setContent('')
    await send(text)
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100)
  }

  const handleLongPress = (message: ArenaMessage) => {
    setReactionTarget(message)
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
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={120}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MessageBubble
            message={item}
            isMe={item.user_id === currentUserId}
            onLongPress={handleLongPress}
            currentUserId={currentUserId}
          />
        )}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbubbles-outline" size={32} color={colors.textMuted} />
            <Text style={styles.emptyText}>No messages yet. Say Salam!</Text>
          </View>
        }
      />

      {/* Input bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={content}
          onChangeText={setContent}
          placeholder="Message… (use @username to mention)"
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.emerald}
          multiline
          maxLength={1000}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={sending || !content.trim()}
          style={[styles.sendBtn, (!content.trim() || sending) && styles.sendBtnDisabled]}
          activeOpacity={0.8}
        >
          <Ionicons name="send" size={18} color={!content.trim() || sending ? colors.textMuted : colors.emerald} />
        </TouchableOpacity>
      </View>

      {/* Emoji reaction picker modal */}
      <Modal
        visible={!!reactionTarget}
        transparent
        animationType="fade"
        onRequestClose={() => setReactionTarget(null)}
      >
        <Pressable style={styles.overlay} onPress={() => setReactionTarget(null)}>
          <View style={styles.emojiPicker}>
            <Text style={styles.emojiTitle}>React to message</Text>
            <View style={styles.emojiRow}>
              {QUICK_EMOJIS.map(emoji => (
                <TouchableOpacity
                  key={emoji}
                  onPress={() => handleReact(emoji)}
                  style={styles.emojiBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.emoji}>{emoji}</Text>
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
  container: { flex: 1 },
  list: {
    padding: spacing.md,
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  bubble: {
    maxWidth: '80%',
    padding: spacing.md,
    borderRadius: radius.lg,
    gap: 4,
    marginBottom: 4,
  },
  bubbleOther: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  bubbleMe: {
    backgroundColor: colors.emeraldDim,
    borderWidth: 1,
    borderColor: `${colors.emerald}40`,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  senderName: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.emerald,
    marginBottom: 2,
  },
  messageText: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  messageTextMe: { color: '#e2fdf0' },
  mention: {
    color: colors.amber,
    fontWeight: fontWeight.semibold,
  },
  time: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    alignSelf: 'flex-start',
  },
  timeMe: { alignSelf: 'flex-end' },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.md,
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
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    maxHeight: 120,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendBtnDisabled: { opacity: 0.5 },

  empty: {
    alignItems: 'center',
    paddingTop: 40,
    gap: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiPicker: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.lg,
    width: 320,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emojiTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emojiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
  },
  emojiBtn: {
    padding: spacing.sm,
  },
  emoji: { fontSize: 28 },
})
