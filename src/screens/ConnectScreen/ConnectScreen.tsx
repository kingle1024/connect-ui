import { NavigationProp, useNavigation } from "@react-navigation/native";
import { useState, useEffect, useCallback } from "react";
import { Text, View, FlatList, TouchableOpacity, Alert } from "react-native";
import Constants from "expo-constants";
import { Post } from "@/types";
import { POSTS } from "@/mock/data";
import localStyles from "./ConnectScreen.styles";

const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL ?? "";

export default function ConnectScreen() {
  const navigation = useNavigation<NavigationProp<any>>();
  const [posts, setPosts] = useState<Post[]>(POSTS);

  const onPressListItem = useCallback((item: Post) => {
    navigation.navigate("ConnectDetail", { item });
  }, []);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/boards`);

        if (!response.ok) {
          throw new Error(`HTTP 오류! 상태: ${response.status}`);
        }

        const data = await response.json();
        console.log("백엔드에서 가져온 데이터:", data);

        const formattedPosts = data.map((board: any) => ({
          id: board.id.toString(),
          title: board.title,
          content: board.content,
          category: "개발",
          comments: board.viewCount,
          author: board.author || "익명",
        }));

        setPosts(formattedPosts); // 상태 업데이트
        // --- API 호출 부분 끝 ---
      } catch (error: any) {
        console.error("게시글 데이터 불러오기 실패:", error);
        Alert.alert(
          "오류",
          "게시글을 불러오는데 실패했습니다: " + error.message
        ); // 사용자에게 알림
      }
    };
    fetchPosts();
  }, []); // [] : 컴포넌트가 처음 마운트될 때 한 번만 실행

  const renderItem = ({ item }: { item: Post }) => (
    <TouchableOpacity
      style={localStyles.postItem}
      onPress={() => onPressListItem(item)}
    >
      <Text style={localStyles.postCategory}>[{item.category}]</Text>
      <Text style={localStyles.postTitle}>{item.title}</Text>
      <Text style={localStyles.postContent}>
        {item.content.substring(0, 50)}...
      </Text>
      <Text style={localStyles.postInfo}>댓글 {item.comments}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={localStyles.screenContainer}>
      <FlatList
        data={posts}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={localStyles.listContainer}
      />
    </View>
  );
}
