import { Platform } from "react-native";
import { useCallback, useMemo, useState } from "react";
import { Post } from "@/types";

import { useContext } from "react";
import AuthContext from "@/components/auth/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import dayjs from "dayjs";
import axios from "axios";
import Constants from "expo-constants";
import Toast from "react-native-toast-message";
import {
  useSafeAreaInsets,
} from "react-native-safe-area-context";

type PostListResponse = {
  nextPageToken: string;
  posts: Post[];
};

export const useBoard = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [hasNextPage, setHasNextPage] = useState<boolean>(true);
  const [nextPageCursor, setNextPageCursor] = useState<string | null>(null);
  const [titleInput, setTitleInput] = useState<string>("");
  const [contentInput, setContentInput] = useState<string>("");
  const [destinationInput, setDestinationInput] = useState("");
  const [maxCapacityInput, setMaxCapacityInput] = useState("");
  const [deadlineDts, setDeadlineDts] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const insets = useSafeAreaInsets();
  const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL ?? "";
  const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
  });

  const titleInputErrorText = useMemo(() => {
    if (titleInput.length === 0) {
      return "제목을 입력해주세요.";
    }
    return "";
  }, [titleInput]);

  const contentInputErrorText = useMemo(() => {
    if (contentInput.length === 0) {
      return "내용을 입력해주세요.";
    }
    return "";
  }, [contentInput]);

  const destinationInputErrorText = useMemo(() => {
    if (destinationInput.length === 0) {
      return "도착지를 입력해주세요.";
    }
    return "";
  }, [destinationInput]);

  const maxCapacityInputErrorText = useMemo(() => {
    if (maxCapacityInput.length === 0) {
      return "최대 모집 인원을 입력해주세요.";
    }
    if (!/^[2-9]\d*$/.test(maxCapacityInput)) {
      return "2명 이상의 인원을 입력해주세요";
    }
    return "";
  }, [maxCapacityInput]);

  const validateTitle = useCallback(() => {
    // titleInputErrorText가 존재하지 않으면 유효함
    return titleInputErrorText === '';
  }, [titleInputErrorText]);

  const validateContent = useCallback(() => {
    return contentInputErrorText === '';
  }, [contentInputErrorText]);

  const validateDestination = useCallback(() => {
    return destinationInputErrorText === '';
  }, [destinationInputErrorText]);

  const validateMaxCapacity = useCallback(() => {
    return maxCapacityInputErrorText === '';
  }, [maxCapacityInputErrorText]);

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

  const loadPosts = useCallback(async () => {
    try {
      const postResults = await axiosInstance.get<PostListResponse>(
        "/api/boards"
      );

      const postData = postResults.data;
      setPosts(
        postData.posts.map((item) => ({
          id: item.id,
          title: item.title,
          content: item.content,
          category: item.category,
          commentCount: item.commentCount,
          userId: item.userId,
          userName: item.userName,
          insertDts: item.insertDts,
          deadlineDts: item.deadlineDts,
          destination: item.destination,
          maxCapacity: item.maxCapacity,
          currentParticipants: item.currentParticipants,
        }))
      );
      setHasNextPage(!!postData.nextPageToken);
      setNextPageCursor(
        !!postData.nextPageToken ? postData.nextPageToken : null
      );
    } catch (ex) {
      console.error(ex);
    }
  }, []);

  const loadMorePosts = useCallback(async () => {
    const postResults = await axiosInstance.get<PostListResponse>(
      "/api/boards",
      {
        params: {
          pageToken: nextPageCursor,
        },
      }
    );
    const postData = postResults.data;
    setPosts((prevData) =>
      prevData.concat(
        postData.posts.map((item) => ({
          id: item.id,
          title: item.title,
          content: item.content,
          category: item.category,
          commentCount: item.commentCount,
          userId: item.userId,
          userName: item.userName,
          insertDts: item.insertDts,
          deadlineDts: item.deadlineDts,
          destination: item.destination,
          maxCapacity: item.maxCapacity,
          currentParticipants: item.currentParticipants,
        }))
      )
    );
    setHasNextPage(!!postData.nextPageToken);
    setNextPageCursor(!!postData.nextPageToken ? postData.nextPageToken : null);
  }, [nextPageCursor]);

  const { user } = useContext(AuthContext);

  const savePost = useCallback(async () => {
    try {
      const payload = {
        title: titleInput,
        content: contentInput,
        category: "기타",
        userId: user?.userId ?? "anonymous",
        userName: user?.name ?? "익명",
        deadlineDts: dayjs(deadlineDts).format("YYYY-MM-DDTHH:mm:ss"),
        destination: destinationInput,
        maxCapacity: parseInt(maxCapacityInput || "0", 10) || 0,
        currentParticipants: 1,
      };

      const resp = await axiosInstance.post("/api/boards", payload);
      const created = resp.data;

      const newPost: Post = {
        id: created.id,
        title: created.title,
        content: created.content,
        category: created.category ?? "기타",
        commentCount: created.commentCount ?? 0,
        userId: created.userId ?? payload.userId,
        userName: created.userName ?? payload.userName,
        insertDts: created.insertDts ?? new Date().toISOString(),
        deadlineDts: created.deadlineDts ?? payload.deadlineDts,
        destination: created.destination ?? payload.destination,
        maxCapacity: created.maxCapacity ?? payload.maxCapacity,
        currentParticipants: created.currentParticipants ?? payload.currentParticipants,
      };

      setPosts((prev) => [newPost, ...prev]);
      return newPost;
    } catch (ex) {
      console.error("savePost failed", ex);
      throw ex;
    }
  }, [
    titleInput,
    contentInput,
    destinationInput,
    maxCapacityInput,
    deadlineDts,
    user,
  ]);

  const deletePost = useCallback(
    async (id: number) => {
      try {
        const accessToken = await AsyncStorage.getItem("accessToken");
        await axiosInstance.delete(`/api/boards/${id}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });
        setPosts((prev) => prev.filter((p) => p.id !== id));
        Toast.show({
          type: 'success',
          text1: '게시글 삭제 완료',
          visibilityTime: 2000,
          topOffset: insets.top,
        });
      } catch (ex: any) {
        switch (ex.response.data.code) {
          case 'AUTHENTICATION_REQUIRED': {
            Toast.show({
              type: 'error',
              text1: '삭제 실패',
              text2: ex.response.data.message,
              visibilityTime: 3000,
              topOffset: insets.top,
            });
          }
          default: {
            Toast.show({
              type: 'error',
              text1: '삭제 실패',
              text2: '게시글 삭제 중 오류가 발생했습니다.',
              visibilityTime: 3000,
              topOffset: insets.top,
            });
          }
        }
      }
    },
    [user]
  );

  return {
    posts,
    setPosts,
    loadPosts,
    loadMorePosts,
    hasNextPage,
    titleInput,
    setTitleInput,
    titleInputErrorText,
    resetTitleInput,
    validateTitle,
    contentInput,
    setContentInput,
    contentInputErrorText,
    resetContenInput,
    validateContent,
    destinationInput,
    setDestinationInput,
    destinationInputErrorText,
    resetDestinationInput,
    validateDestination,
    maxCapacityInput,
    setMaxCapacityInput,
    maxCapacityInputErrorText,
    resetMaxCapacityInput,
    validateMaxCapacity,
    deadlineDts,
    setDeadlineDts,
    showDatePicker,
    setShowDatePicker,
    handleDeadlineDtsChange,
    savePost,
    deletePost,
  };
};
