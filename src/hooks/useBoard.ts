import { Platform } from "react-native";
import Constants from "expo-constants";
import { useCallback, useMemo, useState } from "react";
import { Post } from "@/types";
import axios from "axios";

type PostListResponse = {
  nextPageToken: string;
  posts: Post[];
};

const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL ?? "";
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

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
    if (!/^[1-9]\d*$/.test(maxCapacityInput)) {
      return "1 이상의 정수를 입력해주세요";
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

  const savePost = async () => {
    console.log("데이터 저장");
  };

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
  };
};
