import {
  FlatList,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  TextInput,
  RefreshControl,  
  ActivityIndicator,
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
import Constants from "expo-constants";
import axios from "axios";

const screenHeight = Dimensions.get("window").height;

const ConnectDetail = () => {
  const navigation = useRootNavigation<"ConnectDetail" | "BottomTab">();
  const { user: me } = useContext(AuthContext);
  const [isSendingFriendRequest, setIsSendingFriendRequest] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{
    userId: string;
    userName: string;
  } | null>(null);
  const routes = useRootRoute<"ConnectDetail">();
  const { boardDetail, loadingBoardDetail, boardDetailError, loadBoardDetail } = useDetailBoard();
  const { reply, loadReply, replyInput, setReplyInput, replyInputErrorText, submitReply, deleteComment } =
    useReply();
  const [expandedReplies, setExpandedReplies] = useState<number[]>([]);
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
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const currentBoardId = routes.params.parentId;

  const handleRegisterReply = useCallback(async () => {
    const parentReplyIdForSubmit = null;

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
      if (refSheet.current) {
        refSheet.current.close();
      }
    } catch (error) {
      console.error("댓글 등록 중 최종 에러:", error);
    }
  }, [currentBoardId, replyInput, submitReply]);

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
      const response = await tempAxiosInstance.post(`/api/friends/request`, {
        fromUserId: currentUserId,
        toUserId: targetUserId,
        status: "PENDING",
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

  useEffect(() => {
    if (!me) {
      navigation.navigate("BottomTab", {
        screen: "Connect",
      });
    }
  }, [me, navigation]);

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

  const onPressReply = useCallback(
    (replyId: number) => {
      navigation.push("ConnectDetail", { parentId: replyId });
    },
    [navigation]
  );

  const ListHeaderComponent = useCallback(() => {
    if (!reply) return null;

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

        {/* 본문 */}
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
        </View>
      </>
    );
  }, [reply, inputRef, startPrivateChat]);

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
                onPress={() => onPressReply(item.id)}
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
                  style={{ fontSize: 14, fontWeight: "500", color: "#FF4D00" }}
                >
                  대댓글 접기
                </Text>
              ) : (
                <Text
                  style={{ fontSize: 14, fontWeight: "500", color: "#FF4D00" }}
                >
                  대댓글 {item.replies.length - maxVisibleReplies}개 더보기 ...
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }, [expandedReplies, startPrivateChat]);

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
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={ListFooterComponent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
      <CustomBottomSheet
        ref={refSheet}
        minClosingHeight={screenHeight * 0.1}
        extraContentHeight={selectedUser ? 200 : replyInputHeight}
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
                    backgroundColor: '#007bff',
                    padding: 15,
                    borderRadius: 10,
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
                    backgroundColor: '#6c757d',
                    padding: 15,
                    borderRadius: 10,
                    alignItems: 'center',
                  }}
                  onPress={() => startPrivateChat(selectedUser.userId, selectedUser.userName)}
                  disabled={isStartingChat}
                >
                  {isStartingChat ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
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
          <View style={{ padding: 20 }}>
            <TextInput
              ref={inputRef}
              value={replyInput}
              onChangeText={(text) => {
                  setReplyInput(text);
              }}
              placeholder="댓글을 남겨주세요."
              multiline={true}
              style={{
                color: "black",
                borderRadius: 8,
                borderWidth: 1,
                borderColor: replyInputErrorText ? "red" : "#D1D5DB",
                padding: 10,
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
              <Text style={{ color: "red", marginTop: 5 }}>
                {replyInputErrorText}
              </Text>
            )}
          </View>
        )}
        {
        // 바텀시트가 열려 있고, selectedUser가 없으며, 댓글 입력 모드일 때만 등록 버튼 표시
        bottomSheetOpen && !selectedUser && (
          <TouchableOpacity
            style={{
              position: "absolute",
              bottom: 40,
              right: 20,
              backgroundColor: "rgba(255, 99, 71, 1)",
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: 8,
              opacity: (replyInput.trim() && boardDetail) ? 1 : 0.5,
            }}
            onPress={handleRegisterReply}
            disabled={!replyInput.trim() || !boardDetail}
          >
            <Text style={{ color: "white", fontWeight: "bold" }}>등록</Text>
          </TouchableOpacity>
        )}
      </CustomBottomSheet>
    </SafeAreaView>
  );
};

export default ConnectDetail;