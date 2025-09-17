// src/screens/MyPageScreen.js

import { StyleSheet, Text, View } from 'react-native';

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default function MyPageScreen() {
  return (
    <View style={styles.screenContainer}>
      <Text style={styles.header}>마이페이지</Text>
      <Text style={{ fontSize: 16, color: '#666', marginTop: 10 }}></Text>
      {/* 여기에 사용자 프로필, 설정, 내 게시물 목록 등을 구현 */}
    </View>
  );
}