import { StyleSheet, Platform, StatusBar } from 'react-native';
import theme from '@/modules/theme';

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  headerContainer: { // 🌟 헤더 전체를 감싸는 View
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    position: 'relative', // 뒤로가기 버튼 위치 조정을 위해
    paddingLeft: 50, // 뒤로가기 버튼 공간 확보
    paddingRight: 15, // 사용자명 표시를 위한 오른쪽 여백
  },
  backButton: { // 🌟 뒤로가기 버튼 스타일
    position: 'absolute',
    left: 15,
    padding: 5,
    zIndex: 1,
  },
  roomNameEditContainer: { // 🌟 방 이름과 편집/저장 버튼을 감싸는 컨테이너
    flex: 1, // 남은 공간을 차지하도록
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // 내부 텍스트 및 버튼 중앙 정렬
  },
  headerText: { // 🌟 헤더 텍스트 스타일
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    letterSpacing: -0.2,
  },
  headerTextInput: { // 🌟 편집 모드 시 TextInput 스타일
    flex: 1, // 최대한 공간을 차지
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingVertical: Platform.OS === 'ios' ? 5 : 0, // OS별 패딩 조절
    marginHorizontal: 5,
    textAlign: 'center', // 입력 중인 텍스트 중앙 정렬
  },
  editSaveButton: { // 🌟 편집/저장 버튼 스타일
    padding: 5,
    marginLeft: 5, // 방 이름 텍스트/인풋과의 간격
  },
  headerUsername: { // 🌟 사용자명 텍스트 스타일
    fontSize: 13,
    color: theme.colors.textMuted,
    marginLeft: 10,
  },
  chatArea: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  messageContainer: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 18,
    marginVertical: 3,
    maxWidth: '80%',
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderBottomLeftRadius: 4,
  },
  systemMessage: {
    alignSelf: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 2,
    marginVertical: 2,
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
  systemText: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  senderText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginBottom: 3,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme.colors.surface,
    minHeight: 56,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.field,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    fontSize: 15,
    color: theme.colors.text,
    maxHeight: 120,
  },
  sendButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    color: theme.colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
  leaderFunctionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  leaderButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: theme.radius.sm,
  },
  leaderButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  }
});

export default styles;
