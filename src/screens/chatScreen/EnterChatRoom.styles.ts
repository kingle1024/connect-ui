import { StyleSheet, Platform, StatusBar } from 'react-native';

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  headerContainer: { // 🌟 헤더 전체를 감싸는 View
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
  headerText: { // 🌟 헤더 텍스트 스타일 (이전 header 스타일에서 이름 변경)
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    // flex: 1, // 텍스트가 중앙에 오도록 flex 제거
    // textAlign: 'center', // 텍스트 중앙 정렬
  },
  headerTextInput: { // 🌟 편집 모드 시 TextInput 스타일
    flex: 1, // 최대한 공간을 차지
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingVertical: Platform.OS === 'ios' ? 5 : 0, // OS별 패딩 조절
    marginHorizontal: 5,
    textAlign: 'center', // 입력 중인 텍스트 중앙 정렬
  },
  editSaveButton: { // 🌟 편집/저장 버튼 스타일
    padding: 5,
    marginLeft: 5, // 방 이름 텍스트/인풋과의 간격
  },
  headerUsername: { // 🌟 사용자명 텍스트 스타일
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    // position: 'absolute', // 사용자명을 절대 위치로 두어 오른쪽 끝에 배치
    // right: 15,
  },
  chatArea: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  messageContainer: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 15,
    marginVertical: 4,
    maxWidth: '80%',
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#ffe81e',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
  },
  systemMessage: {
    alignSelf: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 2,
    marginVertical: 2,
  },
  messageText: {
    fontSize: 16,
    color: '#333',
  },
  systemText: {
    fontSize: 12,
    color: '#888',
  },
  senderText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#fff',
    minHeight: 50,
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    fontSize: 16,
    maxHeight: 120,
  },
  sendButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#ffe81e',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 16,
  },
  leaderFunctionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  leaderButton: {
    backgroundColor: '#6200EE',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  leaderButtonText: {
    color: 'white',
    fontSize: 14,
  }
});

export default styles;