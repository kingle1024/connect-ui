import {
  FlatList,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from "react-native";
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import Alert from '@blazejkustra/react-native-alert';
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Reply } from "@/types";
import { MaterialIcons } from "@expo/vector-icons";
import { formatRelativeTime } from "@/utils/formatRelativeTime";
import { useReply } from "@/hooks/useReply";
import CustomBottomSheet, {
  CustomBottomSheetRef,
} from "@/components/modals/CustomBottomSheet";
import { useRootNavigation, useRootRoute } from "@/hooks/useNavigation";
import AuthContext from "@/components/auth/AuthContext";
import { createOneToOneRoom, getOneToOneRoomsForUser } from "@/utils/chat";
import { useDetailBoard } from "@/hooks/useDetailBoard";
import { CATEGORY_CUSTOM, useCategories } from "@/hooks/useCategories";
import CustomDateTimePicker from "@/components/CustomDateTimePicker";
import dayjs from "dayjs";
import Constants from "expo-constants";
import axios from "axios";
import theme from "@/modules/theme";
import VerifiedBadge from "@/components/VerifiedBadge";

const screenHeight = Dimensions.get("window").height;

const editStyles = StyleSheet.create({
  input: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.field,
    color: theme.colors.text,
    fontSize: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  // 라벨 + 입력란 묶음. 값이 채워지면 placeholder 가 사라져서 어떤 항목인지 알 수 없으므로
  // 수정 폼에서는 모든 항목에 라벨을 붙인다.
  field: {
    gap: 6,
  },
  // 카테고리 칩. 글쓰기 시트(NewPostSheet)와 같은 모양/동작을 쓴다.
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.field,
  },
  chipSelected: {
    backgroundColor: theme.colors.primary,
  },
  chipText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  chipTextSelected: {
    color: theme.colors.white,
    fontWeight: "600",
  },
  datePickerText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  primaryButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
  },
  primaryButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  secondaryButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.field,
  },
  secondaryButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    fontWeight: "bold",
  },
});

const ConnectDetail = () => {
  const navigation = useRootNavigation<"ConnectDetail" | "BottomTab" | "Signin">();
  const { user: me } = useContext(AuthContext);
  const [isSendingFriendRequest, setIsSendingFriendRequest] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{
    userId: string;
    userName: string;
  } | null>(null);
  const routes = useRootRoute<"ConnectDetail">();
  const {
    boardDetail,
    loadingBoardDetail,
    boardDetailError,
    loadBoardDetail,
    updateBoardDetail,
    deleteBoardDetail,
  } = useDetailBoard();
  const [isEditing, setIsEditing] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  // 카테고리는 글쓰기 시트와 동일하게 서버에서 받은 칩 + '직접입력'으로 고른다
  const { categories, loadCategories } = useCategories();
  const [editCategoryPreset, setEditCategoryPreset] = useState("");
  const [editCustomCategory, setEditCustomCategory] = useState("");
  const isEditCustomCategory = editCategoryPreset === CATEGORY_CUSTOM;
  const editCategory = isEditCustomCategory
    ? editCustomCategory.trim()
    : editCategoryPreset;
  const [editDestination, setEditDestination] = useState("");
  const [editMaxCapacity, setEditMaxCapacity] = useState("");
  const [editDeadline, setEditDeadline] = useState(new Date());
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);
  const isAuthor = !!me && !!boardDetail && me.userId === boardDetail.userId;
  const { reply, loadReply, replyInput, setReplyInput, replyInputErrorText, submitReply, deleteComment } =
    useReply();
  const [expandedReplies, setExpandedReplies] = useState<number[]>([]);
  // 대댓글을 달 대상 댓글. null 이면 게시글에 대한 일반 댓글이다.
  const [replyTarget, setReplyTarget] = useState<{ id: number; userName: string } | null>(null);
  const [replyInputHeight, setReplyInputHeight] = useState(0);
  const refSheet = useRef<CustomBottomSheetRef>(null);
  const openProfileBottomSheet = useCallback(
    (userId: string, userName: string) => {
      setSelectedUser({ userId, userName });
      refSheet.current?.open();
    },
    []
  );
  const closeProfileBottomSheet = useCallback(() => {
    setSelectedUser(null);
  }, []);
  const inputRef = useRef<TextInput>(null);

  const [refreshing, setRefreshing] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const currentBoardId = routes.params.parentId;

  const promptCommentLogin = useCallback(() => {
    Alert.alert(
      "로그인이 필요합니다.",
      "댓글을 작성하려면 로그인이 필요합니다.",
      [
        {
          text: "로그인",
          onPress: () => navigation.navigate("Signin"),
        },
        { text: "닫기" },
      ]
    );
  }, [navigation]);

  const handleRegisterReply = useCallback(async () => {
    // 대댓글 대상이 지정돼 있으면 그 댓글의 자식으로, 없으면 게시글 직속 댓글로 등록한다.
    const parentReplyIdForSubmit = replyTarget?.id ?? null;

    if (!me) {
      promptCommentLogin();
      return;
    }
    if (!currentBoardId) {
      Alert.alert("오류", "게시글 ID를 찾을 수 없습니다.");
      return;
    }
    if (!replyInput.trim()) {
      Alert.alert("알림", "댓글 내용을 입력해주세요.");
      return;
    }

    try {
      await submitReply(currentBoardId, parentReplyIdForSubmit, replyInput);
      // 방금 쓴 대댓글이 접힌 목록(기본 3개만 노출) 뒤에 숨지 않도록 대상 댓글을 펼쳐둔다
      if (parentReplyIdForSubmit !== null) {
        setExpandedReplies((prev) =>
          prev.includes(parentReplyIdForSubmit) ? prev : [...prev, parentReplyIdForSubmit]
        );
      }
      setReplyTarget(null);
      if (refSheet.current) {
        refSheet.current.close();
      }
    } catch (error) {
      console.error("댓글 등록 중 최종 에러:", error);
    }
  }, [me, promptCommentLogin, currentBoardId, replyInput, submitReply, replyTarget]);

  const toggleExpand = (id: number) => {
    setExpandedReplies((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };
  const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL ?? "";
  const tempAxiosInstance = axios.create({ baseURL: API_BASE_URL });

  const sendFriendRequest = useCallback(async (targetUserId: string, targetUserDisplayName: string) => {
    if (isSendingFriendRequest) return;
    setIsSendingFriendRequest(true);

    const currentUserId = me?.userId || me?.email;
    if (!currentUserId) {
      Alert.alert("권한 오류", "로그인이 필요합니다.");
      setIsSendingFriendRequest(false);
      return;
    }

    if (targetUserId === currentUserId) {
      Alert.alert("알림", "자기 자신에게는 친구 요청을 보낼 수 없습니다.");
      setIsSendingFriendRequest(false);
      return;
    }
    try {
      const response = await tempAxiosInstance.post(`/api/friends/${currentUserId}/friend-requests`, {
        receiverUserId: targetUserId,
      });

      if (response.status === 200 || response.status === 201) {
        Alert.alert("친구 요청 완료", `${targetUserDisplayName}님에게 친구 요청을 보냈습니다.`);
      } else {
        Alert.alert("친구 요청 실패", "친구 요청 전송에 실패했습니다.");
      }
    } catch (error: any) {
      console.error("친구 요청 실패:", error);
      Alert.alert("오류", error.response?.data?.message || "친구 요청 중 오류가 발생했습니다.");
    } finally {
      setIsSendingFriendRequest(false);
      setSelectedUser(null); // 요청 후 바텀시트 닫기
      refSheet.current?.close(); // 요청 후 바텀시트 닫기
    }
  }, [isSendingFriendRequest, me]);

  useEffect(() => {
    if (routes.params.parentId) {
      loadBoardDetail(routes.params.parentId);
      loadReply(routes.params.parentId);
    }
  }, [routes.params.parentId, loadBoardDetail, loadReply]);

  // 수정 폼의 카테고리 칩 목록 (글쓰기 시트와 같은 서버 목록)
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const onTextInputContentSizeChange = useCallback((event: any) => {
    const height = Math.min(
      150,
      Math.max(40, event.nativeEvent.contentSize.height)
    );
    setReplyInputHeight(height);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (routes.params.parentId) {
      await loadReply(routes.params.parentId);
    }
    setRefreshing(false);
  }, [routes.params.parentId, loadBoardDetail, loadReply]);

  const startPrivateChat = useCallback(async (targetUserId: string, targetUserDisplayName: string) => {
    if (isStartingChat) return; // 이미 채팅 시작 중이면 무시
    setIsStartingChat(true);

    const currentUserId = me?.userId || me?.email; // 현재 로그인 유저의 고유 ID (userId나 email 중 하나)
    if (!currentUserId) {
      Alert.alert("권한 오류", "로그인이 필요합니다.");
      setIsStartingChat(false);
      return;
    }

    if (targetUserId === currentUserId) {
      Alert.alert("알림", "자기 자신과는 대화할 수 없습니다.");
      setIsStartingChat(false);
      return;
    }

    try {
      // 1) 서버에서 방 목록 조회
      let rooms;
      try {
        rooms = await getOneToOneRoomsForUser(currentUserId);
      } catch (err) {
        console.error("채팅 목록 조회 실패", err);
        Alert.alert("오류", "채팅 목록을 가져오지 못했습니다.");
        setIsStartingChat(false);
        return;
      }

      // 2) 기존 1:1 채팅방이 있는지 확인
      const existingOneToOne = findOneToOneRoom(rooms, currentUserId, targetUserId);
      let createdRoom;

      if (existingOneToOne) {
        createdRoom = existingOneToOne;
      } else {
        // 3) 없으면 새로운 1:1 채팅방 생성 시도
        try {
          createdRoom = await createOneToOneRoom(currentUserId, targetUserId, targetUserDisplayName);
        } catch (err) {
          console.error("채팅방 생성 실패", err);
          Alert.alert("오류", "채팅방 생성에 실패했습니다.");
          setIsStartingChat(false);
          return;
        }
      }

      if (!createdRoom || !createdRoom.roomId) { // createdRoom이 유효하고 roomId를 가지고 있는지 확인
        Alert.alert("오류", "채팅방을 열 수 없습니다.");
        setIsStartingChat(false);
        return;
      }

      const roomNameForDetail = targetUserDisplayName; // 채팅방 상세 화면에 표시될 이름

      // ChatRoomListScreen과 동일하게 동작하도록: 먼저 Chat 탭으로 이동한 다음,
      // 탭 내부에서 "채팅방 상세"로 진입하게 함. (딜레이로 탭 전환 안정화)
      navigation.navigate("BottomTab", {
        screen: "Chat",
      });
      setTimeout(() => {
        navigation.navigate("채팅방 상세" as any, { // 🌟 "채팅방 상세"의 정확한 스크린 이름을 사용하세요.
          username: currentUserId, // 현재 로그인 유저의 ID
          roomId: createdRoom.roomId,
          roomName: roomNameForDetail,
          roomType: "ONE_TO_ONE",
          // 추가적으로 대화 상대의 ID/이름을 넘겨줄 수 있습니다.
          targetUserId: targetUserId,
          targetUserDisplayName: targetUserDisplayName,
        });
      }, 50);

    } catch (err) {
      console.error("채팅 열기/생성 실패:", err);
      Alert.alert("오류", "채팅방을 열 수 없습니다. 다시 시도해 주세요.");
    } finally {
      setIsStartingChat(false);
    }
  }, [me?.userId, me?.email, isStartingChat, navigation]); // me.username 대신 me.userId/email 사용

  const startEdit = useCallback(() => {
    if (!boardDetail) return;
    setEditTitle(boardDetail.title ?? "");
    setEditContent(boardDetail.content ?? "");
    // 현재 카테고리가 칩 목록에 없으면(직접입력으로 만든 값) '직접입력'을 선택한 상태로 시작한다
    const current = boardDetail.category ?? "";
    if (current && !categories.includes(current)) {
      setEditCategoryPreset(CATEGORY_CUSTOM);
      setEditCustomCategory(current);
    } else {
      setEditCategoryPreset(current);
      setEditCustomCategory("");
    }
    setEditDestination(boardDetail.destination ?? "");
    setEditMaxCapacity(String(boardDetail.maxCapacity ?? ""));
    setEditDeadline(
      boardDetail.deadlineDts ? dayjs(boardDetail.deadlineDts).toDate() : new Date()
    );
    setIsEditing(true);
  }, [boardDetail, categories]);

  const handleEditDeadlineChange = useCallback((event: any, selectedDate?: Date) => {
    setShowEditDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setEditDeadline(selectedDate);
    }
  }, []);

  const cancelEdit = useCallback(() => setIsEditing(false), []);

  const saveEdit = useCallback(async () => {
    if (!boardDetail || savingEdit) return;
    if (!editTitle.trim() || !editContent.trim() || !editDestination.trim() || !editCategory.trim()) {
      Alert.alert("알림", "제목, 내용, 카테고리, 도착지를 모두 입력해주세요.");
      return;
    }
    const capacity = parseInt(editMaxCapacity || "0", 10);
    if (!capacity || capacity < boardDetail.currentParticipants) {
      Alert.alert(
        "알림",
        `최대 모집 인원은 현재 참여 인원(${boardDetail.currentParticipants}명)보다 적을 수 없습니다.`
      );
      return;
    }
    setSavingEdit(true);
    try {
      await updateBoardDetail({
        id: boardDetail.id,
        title: editTitle.trim(),
        content: editContent.trim(),
        category: editCategory.trim(),
        destination: editDestination.trim(),
        maxCapacity: capacity,
        deadlineDts: dayjs(editDeadline).format("YYYY-MM-DDTHH:mm:ss"),
      });
      setIsEditing(false);
      Alert.alert("완료", "게시글이 수정되었습니다.");
    } catch (error: any) {
      const message =
        typeof error.response?.data === "string"
          ? error.response.data
          : "게시글 수정 중 오류가 발생했습니다.";
      Alert.alert("수정 실패", message);
    } finally {
      setSavingEdit(false);
    }
  }, [boardDetail, savingEdit, editTitle, editContent, editCategory, editDestination, editMaxCapacity, editDeadline, updateBoardDetail]);

  const confirmDelete = useCallback(() => {
    if (!boardDetail) return;
    Alert.alert("게시글 삭제", "게시글을 삭제하시겠습니까?", [
      {
        text: "삭제",
        onPress: async () => {
          try {
            await deleteBoardDetail(boardDetail.id);
            navigation.goBack();
          } catch (error: any) {
            const message =
              typeof error.response?.data === "string"
                ? error.response.data
                : "게시글 삭제 중 오류가 발생했습니다.";
            Alert.alert("삭제 실패", message);
          }
        },
      },
      { text: "취소" },
    ]);
  }, [boardDetail, deleteBoardDetail, navigation]);

  // 대댓글 달기.
  // 예전에는 ConnectDetail 을 댓글 id 로 push 했지만, 댓글은 게시글과 다른 테이블/시퀀스라서
  // id 가 겹치면 엉뚱한 게시글이 열리고 안 겹치면 /api/boards/{id} 가 404 로 빈 화면이 됐다.
  // 화면 이동 없이 대상 댓글만 지정하고 입력창으로 포커스를 옮긴다.
  const onPressReply = useCallback(
    (item: Reply) => {
      if (!me) {
        promptCommentLogin();
        return;
      }
      setSelectedUser(null);
      setReplyTarget({ id: item.id, userName: item.userName });
      inputRef.current?.focus();
    },
    [me, promptCommentLogin]
  );

  // 주의: FlatList 의 ListHeaderComponent 에 "컴포넌트 함수"로 넘기면 안 된다.
  // 입력할 때마다 이 함수의 identity 가 바뀌어 FlatList 가 헤더를 새 타입으로 보고
  // 매 글자마다 언마운트/재마운트하기 때문에 TextInput 포커스가 풀린다.
  // 그래서 아래에서 renderListHeader() 를 호출해 "엘리먼트"로 넘긴다.
  const renderListHeader = useCallback(() => {
    // 헤더(게시글 본문)는 댓글이 아니라 게시글 자체에만 의존한다.
    // 예전엔 `!reply`로 막고 있어서 댓글 조회가 실패하면(CORS/500 등)
    // 게시글 내용까지 통째로 안 보였다.
    if (loadingBoardDetail) {
      return (
        <View style={{ paddingVertical: 40, alignItems: "center" }}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      );
    }

    if (!boardDetail) {
      return (
        <View style={{ paddingVertical: 40, alignItems: "center" }}>
          <Text style={{ color: theme.colors.textSecondary }}>
            {boardDetailError ?? "게시글을 불러오지 못했습니다."}
          </Text>
        </View>
      );
    }

    return (
      <>
        {/* 프로필 */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: "#F3F4F6",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 16,
            }}
          >
            <MaterialIcons name="person" size={36} color="#9CA3AF" />
          </View>
          <View>
            <TouchableOpacity
             onPress={() => boardDetail?.userId && boardDetail?.userName && openProfileBottomSheet(boardDetail.userId, boardDetail.userName)}
             style={{ flexDirection: "row", alignItems: "center" }}
            >
              <Text
                style={{
                  fontWeight: "bold",
                  fontSize: 18,
                  color: "#111827",
                }}
              >
                {boardDetail?.userName}
              </Text>
              {boardDetail?.verified ? (
                <VerifiedBadge size={16} style={{ marginLeft: 4 }} />
              ) : null}
            </TouchableOpacity>
            <Text
              style={{
                fontSize: 14,
                color: "#6B7280",
                paddingTop: 5,
              }}
            >
              {boardDetail && formatRelativeTime(boardDetail.insertDts)}
            </Text>
          </View>
        </View>

        {/* 본문 (작성자가 수정 중이면 입력 폼) */}
        {isEditing ? (
          <View style={{ marginTop: 10, gap: 14 }}>
            <View style={editStyles.field}>
              <Text style={editStyles.fieldLabel}>카테고리</Text>
              <View style={editStyles.chipRow}>
                {[...categories, CATEGORY_CUSTOM].map((option) => {
                  const selected = editCategoryPreset === option;
                  return (
                    <TouchableOpacity
                      key={option}
                      style={[editStyles.chip, selected && editStyles.chipSelected]}
                      onPress={() => setEditCategoryPreset(option)}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Text
                        style={[
                          editStyles.chipText,
                          selected && editStyles.chipTextSelected,
                        ]}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {isEditCustomCategory && (
                <TextInput
                  value={editCustomCategory}
                  onChangeText={setEditCustomCategory}
                  placeholder="카테고리 직접 입력"
                  placeholderTextColor={theme.colors.textMuted}
                  style={editStyles.input}
                />
              )}
            </View>
            <View style={editStyles.field}>
              <Text style={editStyles.fieldLabel}>제목</Text>
              <TextInput
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="제목"
                placeholderTextColor={theme.colors.textMuted}
                style={editStyles.input}
              />
            </View>
            <View style={editStyles.field}>
              <Text style={editStyles.fieldLabel}>내용</Text>
              <TextInput
                value={editContent}
                onChangeText={setEditContent}
                placeholder="내용"
                placeholderTextColor={theme.colors.textMuted}
                multiline
                textAlignVertical="top"
                style={[editStyles.input, { height: 120 }]}
              />
            </View>
            <View style={editStyles.field}>
              <Text style={editStyles.fieldLabel}>도착지</Text>
              <TextInput
                value={editDestination}
                onChangeText={setEditDestination}
                placeholder="도착지"
                placeholderTextColor={theme.colors.textMuted}
                style={editStyles.input}
              />
            </View>
            <View style={editStyles.field}>
              <Text style={editStyles.fieldLabel}>최대 모집 인원(본인 포함)</Text>
              <TextInput
                value={editMaxCapacity}
                onChangeText={(text) => setEditMaxCapacity(text.replace(/[^0-9]/g, ""))}
                placeholder="최대 모집 인원(본인 포함)"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="numeric"
                style={editStyles.input}
              />
            </View>
            <View style={editStyles.field}>
              <Text style={editStyles.fieldLabel}>마감일</Text>
              <CustomDateTimePicker
                testID="editDateTimePicker"
                value={editDeadline}
                mode="date"
                is24Hour={true}
                onChange={handleEditDeadlineChange}
                datePickerButtonComponentStyle={editStyles.input}
                datePickerTextComponentStyle={editStyles.datePickerText}
                showDatePicker={showEditDatePicker}
                setShowDatePicker={setShowEditDatePicker}
              />
            </View>
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 24 }}>
              <TouchableOpacity
                style={[editStyles.primaryButton, savingEdit && { opacity: 0.6 }]}
                onPress={saveEdit}
                disabled={savingEdit}
              >
                {savingEdit ? (
                  <ActivityIndicator color={theme.colors.white} />
                ) : (
                  <Text style={editStyles.primaryButtonText}>저장</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={editStyles.secondaryButton} onPress={cancelEdit}>
                <Text style={editStyles.secondaryButtonText}>취소</Text>
              </TouchableOpacity>
            </View>
            <View style={{ height: 200 }} />
          </View>
        ) : (
          <View style={{ marginTop: 10 }}>
            {boardDetail?.title && (
              <View style={{ paddingBottom: 20 }}>
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: "bold",
                    marginBottom: 8,
                    color: "#111827",
                  }}
                >
                  {boardDetail.title}
                </Text>
              </View>
            )}
            <Text style={{ fontSize: 16, marginBottom: 24, color: "#6B7280" }}>
              {boardDetail?.content}
            </Text>
            <View style={{ height: 200 }} />
          </View>
        )}

        {/* 구분선 + 액션 */}
        <View
          style={{
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: "#D1D5DB",
            paddingVertical: 12,
            marginBottom: 24,
            flexDirection: "row",
            gap: 16,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <TouchableOpacity
              style={{ flexDirection: "row", alignItems: "center" }}
              onPress={() => inputRef.current?.focus()}
            >
              <MaterialIcons
                name="subdirectory-arrow-right"
                size={18}
                color="#6B7280"
                style={{ marginRight: 4 }}
              />
              <Text style={{ fontSize: 14, color: "#6B7280" }}>댓글</Text>
            </TouchableOpacity>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <TouchableOpacity
              style={{ flexDirection: "row", alignItems: "center" }}
              onPress={() => boardDetail?.userId && startPrivateChat(boardDetail.userId, boardDetail.userName)}
            >
              <FontAwesome6
                name="comment-dots"
                size={18}
                color="#6B7280"
                style={{ marginRight: 4 }}
              />
              <Text style={{ fontSize: 14, color: "#6B7280" }}>대화하기</Text>
            </TouchableOpacity>
          </View>

          {/* 본인 글일 때만 수정/삭제 노출 */}
          {isAuthor && !isEditing && (
            <>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <TouchableOpacity
                  style={{ flexDirection: "row", alignItems: "center" }}
                  onPress={startEdit}
                >
                  <MaterialIcons
                    name="edit"
                    size={18}
                    color={theme.colors.primary}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={{ fontSize: 14, color: theme.colors.primary }}>수정</Text>
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <TouchableOpacity
                  style={{ flexDirection: "row", alignItems: "center" }}
                  onPress={confirmDelete}
                >
                  <MaterialIcons
                    name="delete"
                    size={18}
                    color={theme.colors.danger}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={{ fontSize: 14, color: theme.colors.danger }}>삭제</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </>
    );
  }, [
    boardDetail,
    loadingBoardDetail,
    boardDetailError,
    inputRef,
    startPrivateChat,
    isAuthor,
    isEditing,
    startEdit,
    confirmDelete,
    saveEdit,
    cancelEdit,
    savingEdit,
    editTitle,
    editContent,
    categories,
    editCategoryPreset,
    editCustomCategory,
    isEditCustomCategory,
    editDestination,
    editMaxCapacity,
    editDeadline,
    showEditDatePicker,
    handleEditDeadlineChange,
  ]);

  const renderItem = useCallback(({ item }: { item: Reply }) => {
    const maxVisibleReplies = 3;
    const isExpanded = expandedReplies.includes(item.id);
    const displayedReplies = isExpanded
      ? item.replies
      : item.replies?.slice(0, maxVisibleReplies);
    return (
      <View style={{ gap: 8 }}>
        {/* 댓글 박스 */}
        <View
          style={{
            backgroundColor: "#F9FAFB", // bg-card-light
            padding: 16,
            borderRadius: 12,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
            <View style={{ flex: 1 }}>
              {/* 사용자 이름 + 시간 */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <TouchableOpacity
                  onPress={() => item.userId && item.userName && openProfileBottomSheet(item.userId, item.userName)}
                >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "bold",
                    color: "#111827",
                    marginRight: 8,
                  }}
                >
                  {item.userName}
                </Text>
                </TouchableOpacity>
                <Text style={{ fontSize: 12, color: "#6B7280" }}>
                  {formatRelativeTime(item.insertDts)}
                </Text>
              </View>

              {/* 댓글 내용 */}
              <Text style={{ fontSize: 14, color: "#111827" }}>
                {item.content}
              </Text>
            </View>

            {/* 버튼 영역 */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                marginTop: 24,
                gap: 16,
              }}
            >
            {me?.userId === item.userId && ( // ✨ 현재 로그인 사용자와 최상위 댓글 작성자 ID 일치 여부 확인
              <TouchableOpacity
                style={{ flexDirection: "row", alignItems: "center" }}
                onPress={() => deleteComment(currentBoardId, item.id)}
              >
                <MaterialIcons name="delete" style={{ fontSize: 16, color: "#EF4444", marginRight: 4 }} />
                <Text style={{ fontSize: 12, color: "#EF4444" }}>삭제</Text>
              </TouchableOpacity>
            )}
              <TouchableOpacity
                style={{ flexDirection: "row", alignItems: "center" }}
                onPress={() => onPressReply(item)}
              >
                <MaterialIcons
                  name="subdirectory-arrow-right"
                  style={{ fontSize: 16, color: "#6B7280", marginRight: 4 }}
                />
                <Text style={{ fontSize: 12, color: "#6B7280" }}>대댓글</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flexDirection: "row", alignItems: "center" }}
                onPress={() => item.userId && startPrivateChat(item.userId, item.userName)}
              >
                <FontAwesome6
                  name="comment-dots"
                  style={{ fontSize: 16, color: "#6B7280", marginRight: 4 }}
                />
                <Text style={{ fontSize: 12, color: "#6B7280" }}>대화하기</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 대댓글 리스트 */}
          <View
            style={{
              marginTop: 16,
              paddingLeft: 16,
              borderLeftWidth: 2,
              borderLeftColor: "#E5E7EB",
              gap: 12,
            }}
          >
            {/* 대댓글 박스 */}
            {displayedReplies?.map((reply) => (
              <View
                key={reply.id}
                style={{
                  backgroundColor: "#FFFFFF",
                  padding: 12,
                  borderRadius: 8,
                }}
              >
                <View
                  style={{ flexDirection: "row", alignItems: "flex-start" }}
                >
                  <View style={{ flex: 1 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 4,
                      }}
                    >
                      <TouchableOpacity
                        onPress={() => reply.userId && reply.userName && openProfileBottomSheet(reply.userId, reply.userName)}
                      >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "bold",
                          color: "#111827",
                          marginRight: 8,
                        }}
                      >
                        {reply.userName}
                      </Text>
                      </TouchableOpacity>
                      <Text style={{ fontSize: 12, color: "#6B7280" }}>
                        {formatRelativeTime(reply.insertDts)}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 14, color: "#111827" }}>
                      {reply.content}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      alignSelf: "flex-end",
                    }}
                    onPress={() => reply.userId && startPrivateChat(reply.userId, reply.userName)}
                  >
                    <FontAwesome6
                      name="comment-dots"
                      style={{ fontSize: 14, color: "#6B7280", marginRight: 4 }}
                    />
                    <Text style={{ fontSize: 12, color: "#6B7280" }}>
                      대화하기
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          {/* 더보기 버튼 */}
          {item.replies && item.replies.length > maxVisibleReplies && (
            <TouchableOpacity
              style={{ marginTop: 12 }}
              onPress={() => toggleExpand(item.id)}
            >
              {isExpanded ? (
                <Text
                  style={{ fontSize: 14, fontWeight: "600", color: theme.colors.primary }}
                >
                  대댓글 접기
                </Text>
              ) : (
                <Text
                  style={{ fontSize: 14, fontWeight: "600", color: theme.colors.primary }}
                >
                  대댓글 {item.replies.length - maxVisibleReplies}개 더보기 ...
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }, [expandedReplies, startPrivateChat, onPressReply, me, currentBoardId, deleteComment]);

  const ListFooterComponent = () => {
    return (
      <View
        style={{
          height:
            screenHeight * 0.1 + (refSheet.current?.bottomSheetHeight ?? 0),
        }}
      ></View>
    );
  };

  // 클릭한 친구와 1:1 채팅방이 이미 있는지 찾기
  const findOneToOneRoom = (rooms: any[], currentUserId: string, friendId: string) => {
    const foundRoom = rooms.find(room => {
        return room.userId == friendId; 
    });

    return foundRoom; 
  };

  return (
    <SafeAreaView
      edges={["right", "left"]}
      style={{ flex: 1, padding: 10, backgroundColor: "white" }}
    >
      <FlatList
        data={reply}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={renderListHeader()}
        ListFooterComponent={ListFooterComponent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
      <CustomBottomSheet
        ref={refSheet}
        minClosingHeight={screenHeight * 0.1}
        // 댓글 입력 모드에서는 입력창 높이 + 위아래 padding(20*2) 만큼 필요하다.
        // padding 을 빼먹으면 시트가 내용보다 짧아져 입력창/등록 버튼이 화면 밖으로 잘린다.
        extraContentHeight={
          selectedUser
            ? 200
            : Math.max(40, replyInputHeight) + 40 + (replyTarget ? 26 : 0)
        }
        onOpen={() => {
            if (selectedUser) {
            } else {
                inputRef.current?.focus();
            }
        }}
        onClose={() => {

        }}
      >
        {selectedUser ? ( // ✨ selectedUser가 있으면 프로필 액션 모드
          <View style={{ padding: 20, gap: 15 }}>
            <TouchableOpacity
              onPress={closeProfileBottomSheet} // closeProfileBottomSheet 함수 호출
              style={{ position: 'absolute', top: 15, right: 20, zIndex: 1 }} // 오른쪽 상단에 위치
            >
              <MaterialIcons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 10 }}>
              {selectedUser.userName}님의 프로필
            </Text>

            {me?.userId !== selectedUser.userId && ( // 본인 프로필이 아닐 때만
              <>
                {/* 친구 요청 버튼 */}
                <TouchableOpacity
                  style={{
                    backgroundColor: theme.colors.primary,
                    padding: 15,
                    borderRadius: theme.radius.md,
                    alignItems: 'center',
                  }}
                  onPress={() => sendFriendRequest(selectedUser.userId, selectedUser.userName)}
                  disabled={isSendingFriendRequest}
                >
                  {isSendingFriendRequest ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
                      친구 요청
                    </Text>
                  )}
                </TouchableOpacity>

                {/* 1:1 대화하기 버튼 */}
                <TouchableOpacity
                  style={{
                    backgroundColor: theme.colors.field,
                    padding: 15,
                    borderRadius: theme.radius.md,
                    alignItems: 'center',
                  }}
                  onPress={() => startPrivateChat(selectedUser.userId, selectedUser.userName)}
                  disabled={isStartingChat}
                >
                  {isStartingChat ? (
                    <ActivityIndicator color={theme.colors.textSecondary} />
                  ) : (
                    <Text style={{ color: theme.colors.textSecondary, fontSize: 16, fontWeight: 'bold' }}>
                      1:1 대화하기
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}
            {me?.userId === selectedUser.userId && ( // 본인 프로필일 경우
                <Text style={{ fontSize: 16, color: '#6c757d', textAlign: 'center', marginTop: 10 }}>
                    나의 프로필
                </Text>
            )}

          </View>
        ) : ( // ✨ selectedUser가 없으면 댓글 입력 모드
          <View
            style={{
              padding: 20,
              flexDirection: "row",
              alignItems: "flex-end",
              gap: 10,
            }}
          >
            <View style={{ flex: 1 }}>
            {/* 지금 어떤 댓글에 대댓글을 쓰는 중인지 알려주고, 일반 댓글로 되돌릴 수단을 준다 */}
            {replyTarget && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 6,
                  gap: 6,
                }}
              >
                <MaterialIcons
                  name="subdirectory-arrow-right"
                  size={14}
                  color={theme.colors.primary}
                />
                <Text
                  numberOfLines={1}
                  style={{ flex: 1, fontSize: 13, color: theme.colors.primary }}
                >
                  {replyTarget.userName}님에게 대댓글
                </Text>
                <TouchableOpacity
                  onPress={() => setReplyTarget(null)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialIcons
                    name="close"
                    size={16}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            )}
            <TextInput
              ref={inputRef}
              value={replyInput}
              onChangeText={(text) => {
                  setReplyInput(text);
              }}
              onFocus={() => {
                if (!me) {
                  inputRef.current?.blur();
                  promptCommentLogin();
                }
              }}
              placeholder={
                replyTarget ? "대댓글을 남겨주세요." : "댓글을 남겨주세요."
              }
              multiline={true}
              style={{
                color: theme.colors.text,
                borderRadius: theme.radius.md,
                backgroundColor: theme.colors.field,
                borderWidth: 1,
                borderColor: replyInputErrorText ? theme.colors.danger : theme.colors.field,
                paddingHorizontal: 14,
                paddingVertical: 10,
                minHeight: 40,
                maxHeight: 150,
              }}
              onContentSizeChange={(e) => {
                const height = Math.min(
                  150,
                  Math.max(40, e.nativeEvent.contentSize.height)
                );
                setReplyInputHeight(height);
              }}
            />
            {replyInputErrorText && (
              <Text style={{ color: theme.colors.danger, fontSize: 13, marginTop: 5 }}>
                {replyInputErrorText}
              </Text>
            )}
            </View>
            {/* 등록 버튼. 예전에는 absolute 로 띄우고 "바텀시트 열림" state 로 가렸지만,
                그 state 를 갱신하는 곳이 없어 버튼이 영원히 보이지 않았다.
                시트는 항상 하단에 붙어 있으니 입력창 옆에 같이 배치한다. */}
            <TouchableOpacity
              style={{
                backgroundColor: theme.colors.primary,
                paddingVertical: 10,
                paddingHorizontal: 18,
                borderRadius: theme.radius.pill,
                opacity: (replyInput.trim() && boardDetail) ? 1 : 0.5,
              }}
              onPress={handleRegisterReply}
              disabled={!replyInput.trim() || !boardDetail}
            >
              <Text style={{ color: "white", fontWeight: "bold" }}>등록</Text>
            </TouchableOpacity>
          </View>
        )}
      </CustomBottomSheet>
    </SafeAreaView>
  );
};

export default ConnectDetail;