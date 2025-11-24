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
    justifyContent: 'center', // 텍스트를 중앙에 두기 위함
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    position: 'relative', // 뒤로가기 버튼 위치 조정을 위해
  },
  backButton: { // 🌟 뒤로가기 버튼 스타일
    position: 'absolute',
    left: 15,
    padding: 5,
  },
  headerText: { // 🌟 헤더 텍스트 스타일 (이전 header 스타일에서 이름 변경)
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    // flex: 1, // 텍스트가 중앙에 오도록 flex 제거
    // textAlign: 'center', // 텍스트 중앙 정렬
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