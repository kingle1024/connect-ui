import { StyleSheet } from 'react-native';

const localStyles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    paddingTop: 50,
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
    shadowColor: '#000',
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
  fab: {
    position: 'absolute', // 절대 위치 설정
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    right: 30, // 오른쪽에서 30px 떨어지게
    bottom: 90, // 하단 탭 바(높이 약 60px + 여백)보다 위로 (넉넉하게 90px)
    backgroundColor: '#FF6347', // 토마토 색상으로
    borderRadius: 30, // 동그랗게 만들기 (width/height의 절반)
    elevation: 8, // 안드로이드 그림자 효과
    shadowColor: '#000', // iOS 그림자 효과
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  fabText: {
    fontSize: 30, // + 기호 크기
    color: 'white', // 글자 색상
  },
});

export default localStyles;