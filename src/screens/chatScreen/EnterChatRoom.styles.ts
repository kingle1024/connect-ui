import { StyleSheet, Platform, StatusBar } from 'react-native';
import theme from '@/modules/theme';

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },

  // ── 헤더 ─────────────────────────────
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 4,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerIconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.pill,
  },
  roomNameEditContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    paddingHorizontal: 4,
  },
  headerText: {
    flexShrink: 1,
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text,
    letterSpacing: -0.2,
  },
  headerTextInput: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text,
    backgroundColor: theme.colors.field,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === 'ios' ? 6 : 4,
  },
  editSaveButton: {
    padding: 6,
    marginLeft: 2,
  },

  // ── 메시지 영역 ──────────────────────
  chatArea: {
    flex: 1,
  },
  chatContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
  },
  dateDivider: {
    alignSelf: 'center',
    backgroundColor: 'rgba(25, 31, 40, 0.06)',
    borderRadius: theme.radius.pill,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginVertical: 12,
  },
  dateDividerText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  systemMessage: {
    alignSelf: 'center',
    maxWidth: '85%',
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginVertical: 6,
  },
  systemText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 3,
  },
  rowGroupStart: {
    marginTop: 12,
  },
  rowMine: {
    justifyContent: 'flex-end',
  },
  rowOther: {
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  avatarSlot: {
    width: 36,
    marginRight: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: theme.colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  otherColumn: {
    flexShrink: 1,
    maxWidth: '78%',
  },
  otherBubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  senderText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
    marginLeft: 2,
  },
  bubble: {
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: 18,
    flexShrink: 1,
  },
  myBubble: {
    backgroundColor: theme.colors.primary,
    borderTopRightRadius: 6,
    maxWidth: '75%',
  },
  otherBubble: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 6,
    ...theme.shadow.card,
  },
  messageText: {
    fontSize: 15,
    color: theme.colors.text,
    lineHeight: 21,
  },
  myMessageText: {
    fontSize: 15,
    color: theme.colors.white,
    lineHeight: 21,
  },
  timeText: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginHorizontal: 6,
    marginBottom: 2,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },

  // ── 입력창 ───────────────────────────
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme.colors.surface,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.field,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    marginRight: 8,
    fontSize: 15,
    lineHeight: 20,
    color: theme.colors.text,
    minHeight: 40,
    maxHeight: 120,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.textDisabled,
  },
});

export default styles;
