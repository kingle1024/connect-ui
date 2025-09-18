import { Alert } from "react-native";
import Constants from "expo-constants";
import { POSTS } from "@/mock/data";
import { useMemo, useState } from "react";
import { Post } from "@/types";

const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL ?? "";

export const useBoard = () => {
  const [posts, setPosts] = useState<Post[]>(POSTS);
  const [titleInput, setTitleInput] = useState<string>("");
  const [contentInput, setContentInput] = useState<string>("");

  const titleInputErrorText = useMemo(() => {
    if (titleInput.length === 0) {
      return "제목을 입력해주세요.";
    }
    return null;
  }, [titleInput]);

  const contentInputErrorText = useMemo(() => {
    if (contentInput.length === 0) {
      return "내용을 입력해주세요.";
    }
    return null;
  }, [contentInput]);

  const resetTitleInput = () => setTitleInput("");
  const resetContenInput = () => setContentInput("");

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

      setPosts(formattedPosts);
    } catch (error: any) {
      console.error("게시글 데이터 불러오기 실패:", error);
      Alert.alert("오류", "게시글을 불러오는데 실패했습니다: " + error.message);
    }
  };

  const savePost = async () => {
    console.log("데이터 저장");
  };

  return {
    posts,
    setPosts,
    fetchPosts,
    titleInput,
    setTitleInput,
    titleInputErrorText,
    resetTitleInput,
    contentInput,
    setContentInput,
    contentInputErrorText,
    resetContenInput,
  };
};
