import { Alert, Platform } from "react-native";
import Constants from "expo-constants";
import { POSTS } from "@/mock/data";
import { useEffect, useMemo, useState } from "react";
import { Post } from "@/types";
import dayjs from "dayjs";

const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL ?? "";

export const useBoard = () => {
  const [posts, setPosts] = useState<Post[]>(POSTS);
  const [titleInput, setTitleInput] = useState<string>("");
  const [contentInput, setContentInput] = useState<string>("");
  const [destinationInput, setDestinationInput] = useState("");
  const [maxCapacityInput, setMaxCapacityInput] = useState("");
  const [deadlineDts, setDeadlineDts] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

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

  const destinationInputErrorText = useMemo(() => {
    if (destinationInput.length === 0) {
      return "도착지를 입력해주세요.";
    }
    return null;
  }, [destinationInput]);

  const maxCapacityInputErrorText = useMemo(() => {
    if (maxCapacityInput.length === 0) {
      return "최대 모집 인원을 입력해주세요.";
    }
    if (!/^[1-9]\d*$/.test(maxCapacityInput)) {
      return "1 이상의 정수를 입력해주세요";
    }
    return null;
  }, [maxCapacityInput]);

  const handleDeadlineDtsChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setDeadlineDts(selectedDate);
    }
  };

  const resetTitleInput = () => setTitleInput("");
  const resetContenInput = () => setContentInput("");
  const resetDestinationInput = () => setDestinationInput("");
  const resetMaxCapacityInput = () => setMaxCapacityInput("");

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
    destinationInput,
    setDestinationInput,
    destinationInputErrorText,
    resetDestinationInput,
    maxCapacityInput,
    setMaxCapacityInput,
    maxCapacityInputErrorText,
    resetMaxCapacityInput,
    deadlineDts,
    setDeadlineDts,
    showDatePicker,
    setShowDatePicker,
    handleDeadlineDtsChange,
  };
};
