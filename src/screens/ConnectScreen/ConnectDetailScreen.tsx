import {
  FlatList,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  TextInput,
  RefreshControl,
  Alert,
} from "react-native";
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
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

const screenHeight = Dimensions.get("window").height;

const ConnectDetail = () => {
  const navigation = useRootNavigation<"ConnectDetail" | "BottomTab">();
  const { user: me } = useContext(AuthContext);
  const routes = useRootRoute<"ConnectDetail">();
  const { reply, loadReply, replyInput, setReplyInput, replyInputErrorText } =
    useReply();
  const [expandedReplies, setExpandedReplies] = useState<number[]>([]);
  const [replyInputHeight, setReplyInputHeight] = useState(0);

  const refSheet = useRef<CustomBottomSheetRef>(null);
  const inputRef = useRef<TextInput>(null);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);

  const toggleExpand = (id: number) => {
    setExpandedReplies((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    if (routes.params.parentId) {
      loadReply(routes.params.parentId);
    }
  }, [routes.params.parentId, loadReply]);

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
  }, [routes.params.parentId, loadReply]);

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
            <Text
              style={{
                fontWeight: "bold",
                fontSize: 18,
                color: "#111827",
              }}
            >
              {reply.userName}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: "#6B7280",
                paddingTop: 5,
              }}
            >
              {formatRelativeTime(reply.insertDts)}
            </Text>
          </View>
        </View>

        {/* 본문 */}
        <View style={{ marginTop: 10 }}>
          {reply.title && (
            <View style={{ paddingBottom: 20 }}>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "bold",
                  marginBottom: 8,
                  color: "#111827",
                }}
              >
                {reply.title}
              </Text>
            </View>
          )}
          <Text style={{ fontSize: 16, marginBottom: 24, color: "#6B7280" }}>
            {reply.content}
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
              onPress={() => reply.userId && startPrivateChat(reply.userId, reply.userName)}
            >
              <FontAwesome6
                name="comment-dots"
                size={18}
                color="#6B7280"
                style={{ marginRight: 4 }}
              />
              <Text style={{ fontSize: 14, color: "#6B7280" }}>대화하기1</Text>
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
                <Text style={{ fontSize: 12, color: "#6B7280" }}>대화하기2</Text>
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
                      대화하기3
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
        data={reply.replies}
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
        extraContentHeight={replyInputHeight}
        onOpen={() => setBottomSheetOpen(true)}
        onClose={() => setBottomSheetOpen(false)}
      >
        <View style={{ padding: 20 }}>
          <TextInput
            ref={inputRef}
            value={replyInput}
            onChangeText={setReplyInput}
            placeholder="댓글을 남겨주세요."
            multiline={true}
            style={{
              color: "black",
              borderRadius: 8,
            }}
            onContentSizeChange={(e) => {
              const height = Math.min(
                150,
                Math.max(40, e.nativeEvent.contentSize.height)
              );
              setReplyInputHeight(height);
            }}
          />
        </View>
        {/* 버튼은 절대 위치 고정 */}
        {bottomSheetOpen && !replyInputErrorText && (
          <TouchableOpacity
            style={{
              position: "absolute",
              bottom: 40,
              right: 20,
              backgroundColor: "rgba(255, 99, 71, 1)",
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: 8,
            }}
            onPress={() => console.log("등록")}
          >
            <Text style={{ color: "white", fontWeight: "bold" }}>등록</Text>
          </TouchableOpacity>
        )}
      </CustomBottomSheet>
    </SafeAreaView>
  );
};

export default ConnectDetail;