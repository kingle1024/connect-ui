import { Platform } from "react-native";
import { useCallback, useMemo, useRef, useState } from "react";
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
import {
  CATEGORY_CUSTOM,
  CATEGORY_FILTER_ALL,
  CATEGORY_PRESETS,
  CATEGORY_ETC,
  useCategories,
} from "@/hooks/useCategories";

type PostListResponse = {
  // 서버는 다음 페이지 번호를 내려준다 (없으면 null). BoardService.getAllBoards 참고
  nextPageToken: number | null;
  posts: Post[];
};

// 카테고리 관련 상수/조회는 useCategories 로 옮겼다 (수정 폼에서도 같은 목록을 쓴다).
// 기존 import 경로를 유지하기 위해 여기서 다시 내보낸다.
export {
  CATEGORY_PRESETS,
  CATEGORY_CUSTOM,
  CATEGORY_ETC,
  CATEGORY_FILTER_ALL,
} from "@/hooks/useCategories";

// 검색 대상 필드. key는 서버 쿼리 파라미터 이름과 동일하다 (BoardController.getBoards)
export const SEARCH_FIELD_OPTIONS = [
  { key: "title", label: "제목" },
  { key: "content", label: "내용" },
  { key: "destination", label: "장소" },
] as const;
export type SearchField = (typeof SEARCH_FIELD_OPTIONS)[number]["key"];

export const useBoard = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  // 카테고리 필터. CATEGORY_FILTER_ALL이면 전체 조회
  const [selectedCategory, setSelectedCategory] = useState<string>(CATEGORY_FILTER_ALL);
  // 검색 필터. 필터 시트에서 편집 중인 값(searchField/searchKeyword/openOnly)과
  // 실제 조회에 쓰는 값(appliedFilter)을 분리해서 '적용'을 눌렀을 때만 조회한다.
  const [searchField, setSearchField] = useState<SearchField>("title");
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  // 모집 미완료(정원 미달 + 마감 전)만 보기
  const [openOnly, setOpenOnly] = useState<boolean>(false);
  const [appliedFilter, setAppliedFilter] = useState<{
    field: SearchField;
    keyword: string;
    openOnly: boolean;
  }>({ field: "title", keyword: "", openOnly: false });
  const { categories, loadCategories: fetchCategories } = useCategories();
  // 첫 조회 전에는 다음 페이지가 있는지 알 수 없다. true로 두면 FlatList 마운트 직후
  // onEndReached가 발화해 0페이지를 한 번 더 붙여 목록 전체가 중복된다.
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);
  const [nextPageCursor, setNextPageCursor] = useState<number | null>(null);
  const loadingMoreRef = useRef(false);
  const [titleInput, setTitleInput] = useState<string>("");
  const [contentInput, setContentInput] = useState<string>("");
  const [destinationInput, setDestinationInput] = useState("");
  const [categoryPreset, setCategoryPreset] = useState<string>(CATEGORY_PRESETS[0]);
  const [customCategoryInput, setCustomCategoryInput] = useState("");
  const [maxCapacityInput, setMaxCapacityInputRaw] = useState("");
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

  const isCustomCategory = categoryPreset === CATEGORY_CUSTOM;
  const categoryInput = isCustomCategory
    ? customCategoryInput.trim()
    : categoryPreset;

  const categoryInputErrorText = useMemo(() => {
    if (isCustomCategory && customCategoryInput.trim().length === 0) {
      return "카테고리를 입력해주세요.";
    }
    return "";
  }, [isCustomCategory, customCategoryInput]);

  const maxCapacityInputErrorText = useMemo(() => {
    if (maxCapacityInput.length === 0) {
      return "본인 포함 최대 모집 인원을 입력해주세요.";
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

  const validateCategory = useCallback(() => {
    return categoryInputErrorText === '';
  }, [categoryInputErrorText]);

  const resetCategoryInput = () => {
    setCategoryPreset(categories[0] ?? CATEGORY_PRESETS[0]);
    setCustomCategoryInput("");
  };

  const handleDeadlineDtsChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setDeadlineDts(selectedDate);
    }
  };

  const resetTitleInput = () => setTitleInput("");
  const resetContenInput = () => setContentInput("");
  const resetDestinationInput = () => setDestinationInput("");
  const resetMaxCapacityInput = () => setMaxCapacityInputRaw("");

  // 인원수는 숫자만 허용 (웹에서는 keyboardType="numeric"이 입력을 막지 않음)
  const setMaxCapacityInput = useCallback((text: string) => {
    setMaxCapacityInputRaw(text.replace(/[^0-9]/g, ""));
  }, []);

  // 필터 칩 목록을 새로 받아온다.
  // 작성 폼의 선택값이 갱신된 목록에 없으면 첫 카테고리로 보정한다
  // (직접입력을 선택 중이면 그대로 둔다)
  const loadCategories = useCallback(async () => {
    const next = await fetchCategories();
    setCategoryPreset((prev) =>
      prev === CATEGORY_CUSTOM || next.includes(prev) ? prev : next[0]
    );
  }, [fetchCategories]);

  // 목록 조회에 쓰는 필터 파라미터 (카테고리 + 검색어 + 모집 미완료)
  const buildFilterParams = useCallback(() => {
    const params: Record<string, string | boolean> = {};
    if (selectedCategory !== CATEGORY_FILTER_ALL) {
      params.category = selectedCategory;
    }
    if (appliedFilter.keyword) {
      params[appliedFilter.field] = appliedFilter.keyword;
    }
    if (appliedFilter.openOnly) {
      params.openOnly = true;
    }
    return params;
  }, [selectedCategory, appliedFilter]);

  // 필터 시트의 '적용' 버튼. 편집 중인 값을 적용해 첫 페이지부터 다시 조회하게 한다
  const applySearch = useCallback(() => {
    setAppliedFilter({
      field: searchField,
      keyword: searchKeyword.trim(),
      openOnly,
    });
  }, [searchField, searchKeyword, openOnly]);

  // 필터 시트의 '초기화' 버튼. 편집 값과 적용 값을 모두 기본값으로 되돌린다
  const clearSearch = useCallback(() => {
    setSearchField("title");
    setSearchKeyword("");
    setOpenOnly(false);
    setAppliedFilter({ field: "title", keyword: "", openOnly: false });
  }, []);

  const loadPosts = useCallback(async () => {
    try {
      const postResults = await axiosInstance.get<PostListResponse>(
        "/api/boards",
        {
          params: buildFilterParams(),
        }
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
          verified: item.verified,
        }))
      );
      setHasNextPage(postData.nextPageToken != null);
      setNextPageCursor(postData.nextPageToken ?? null);
    } catch (ex) {
      console.error(ex);
    }
  }, [buildFilterParams]);

  const loadMorePosts = useCallback(async () => {
    // 다음 페이지가 없거나 이미 불러오는 중이면 중단.
    // (가드가 없으면 같은 페이지를 중복으로 붙여 FlatList key가 충돌한다)
    if (nextPageCursor == null || loadingMoreRef.current) {
      return;
    }
    loadingMoreRef.current = true;
    try {
      const postResults = await axiosInstance.get<PostListResponse>(
        "/api/boards",
        {
          params: {
            // 서버는 Spring Pageable을 쓰므로 page 파라미터로 보내야 한다
            page: nextPageCursor,
            ...buildFilterParams(),
          },
        }
      );
      const postData = postResults.data;
      setPosts((prevData) => {
        const seenIds = new Set(prevData.map((p) => p.id));
        const nextPagePosts = postData.posts
          .filter((item) => !seenIds.has(item.id))
          .map((item) => ({
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
            verified: item.verified,
          }));
        return prevData.concat(nextPagePosts);
      });
      setHasNextPage(postData.nextPageToken != null);
      setNextPageCursor(postData.nextPageToken ?? null);
    } catch (ex) {
      console.error(ex);
    } finally {
      loadingMoreRef.current = false;
    }
  }, [nextPageCursor, buildFilterParams]);

  const { user } = useContext(AuthContext);

  const savePost = useCallback(async () => {
    try {
      const payload = {
        title: titleInput,
        content: contentInput,
        category: categoryInput,
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
        category: created.category ?? payload.category,
        commentCount: created.commentCount ?? 0,
        userId: created.userId ?? payload.userId,
        userName: created.userName ?? payload.userName,
        insertDts: created.insertDts ?? new Date().toISOString(),
        deadlineDts: created.deadlineDts ?? payload.deadlineDts,
        destination: created.destination ?? payload.destination,
        maxCapacity: created.maxCapacity ?? payload.maxCapacity,
        currentParticipants: created.currentParticipants ?? payload.currentParticipants,
        verified: created.verified ?? false,
      };

      // 낙관적 추가로 즉시 노출한 뒤, 서버 기준 목록으로 동기화한다.
      // (정렬·commentCount·verified 등 서버에서 채워지는 값까지 새로고침 없이 반영)
      // 다른 카테고리로 필터 중이면 목록에 끼워 넣지 않는다.
      // '기타' 필터일 때는 직접입력 카테고리도 서버와 동일하게 포함시킨다.
      const isCustomCategoryPost = !categories.includes(newPost.category);
      if (
        selectedCategory === CATEGORY_FILTER_ALL ||
        selectedCategory === newPost.category ||
        (selectedCategory === CATEGORY_ETC && isCustomCategoryPost)
      ) {
        setPosts((prev) => [newPost, ...prev]);
      }
      await loadPosts();
      // 직접입력으로 새 카테고리가 생겼을 수 있으므로 필터 칩도 갱신
      loadCategories();
      return newPost;
    } catch (ex) {
      console.error("savePost failed", ex);
      throw ex;
    }
  }, [
    titleInput,
    contentInput,
    categoryInput,
    destinationInput,
    maxCapacityInput,
    deadlineDts,
    user,
    loadPosts,
    loadCategories,
    selectedCategory,
    categories,
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
    categories,
    loadCategories,
    selectedCategory,
    setSelectedCategory,
    searchField,
    setSearchField,
    searchKeyword,
    setSearchKeyword,
    openOnly,
    setOpenOnly,
    appliedFilter,
    applySearch,
    clearSearch,
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
    categoryPreset,
    setCategoryPreset,
    customCategoryInput,
    setCustomCategoryInput,
    isCustomCategory,
    categoryInputErrorText,
    resetCategoryInput,
    validateCategory,
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
