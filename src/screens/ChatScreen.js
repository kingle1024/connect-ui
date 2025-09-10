// src/screens/ChatScreen.js

import { StyleSheet, Text, View } from 'react-native';

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    justifyContent: 'center', // 내용을 가운데 정렬
    alignItems: 'center', // 내용을 가운데 정렬
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default function ChatScreen() {
  return (
    <View style={styles.screenContainer}>
      <Text style={styles.header}>채팅 화면</Text>
      <Text style={{ fontSize: 16, color: '#666', marginTop: 10 }}>친구들과 이야기를 나눠보세요!</Text>
      {/* 여기에 채팅 목록이나 입력창 등 실제 채팅 UI를 구현 */}
    </View>
  );
}