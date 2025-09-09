import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity } from 'react-native';

export default function App() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {

        setPosts([
          { id: '1', title: '오늘 점심 뭐 먹지?', content: '오미용, 점심 메뉴 추천해줄 수 있어?', category: '일상', comments: 15 },
          { id: '2', title: 'Kotlin Spring Boot 질문 있어요!', content: '트랜잭션 관리 관련해서 궁금한 게 있는데...', category: '개발', comments: 22 },
          { id: '3', title: 'React Native FlatList 사용법', content: '목록 스크롤 최적화 어떻게 하는지 알려줘', category: '개발', comments: 8 },
          { id: '4', title: '감기 조심하세요!', content: '요즘 감기 기운이 있어서 고생 중이에요 ㅠㅠ', category: '일상', comments: 3 },
          { id: '5', title: '주말에 뭐하지?', content: '같이 요리할 사람~', category: '취미', comments: 10 },
        ]);
      } catch (error) {
        console.error("데이터 불러오기 실패:", error);
      }
    };
    fetchPosts();
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.postItem}>
      <Text style={styles.postCategory}>[{item.category}]</Text>
      <Text style={styles.postTitle}>{item.title}</Text>
      <Text style={styles.postContent}>{item.content.substring(0, 50)}...</Text> {/* 블라인드처럼 짧게 보여주기 */}
      <Text style={styles.postInfo}>댓글 {item.comments}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>새 소식</Text>
      <FlatList
        data={posts}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
      />
      {/* 하단 메뉴 버튼이 여기에 들어갈 거야 */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5', // 배경색
    paddingTop: 50, // 상단 패딩
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  listContainer: {
    paddingHorizontal: 15,
  },
  postItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000', // 그림자 효과
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  postCategory: {
    fontSize: 12,
    color: '#888',
    marginBottom: 5,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  postContent: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  postInfo: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
  },
});
