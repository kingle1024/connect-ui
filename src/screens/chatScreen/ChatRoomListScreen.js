import React, { useState, useEffect, useContext, useCallback, useRef } from "react";
import {
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,  
} from "react-native";
import Alert from '@blazejkustra/react-native-alert';
import Constants from "expo-constants";
import { useFocusEffect } from "@react-navigation/native";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import localStyles from "./ChatRoomListScreen.styles.ts";
import AuthContext from "@/components/auth/AuthContext";
import { getRoomsForUser } from "@/utils/chat";
import theme from "@/modules/theme";
const API_BASE_URL = Constants.expoConfig.extra.API_BASE_URL;
const SOCKET_URL = API_BASE_URL + "/ws-chat";

const MessageType = {
  LEAVE: "LEAVE",
};

const USER_ID_KEY = "chatAppUserId";

// 방 이름으로 아바타 색을 고른다 (같은 방은 항상 같은 색)
const AVATAR_COLORS = ["#FF8A65", "#4FC3F7", "#81C784", "#BA68C8", "#FFB74D", "#7986CB", "#4DB6AC"];
const avatarColor = (name = "") => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

export default function ChatRoomsListScreen({ navigation }) {
  const [userId, setUserId] = useState(null);
  const [isUserIdLoading, setIsUserIdLoading] = useState(true); // 🌟 사용자 ID 로딩 상태
  const [isRoomsLoading, setIsRoomsLoading] = useState(false); // 🌟 채팅방 목록 로딩 상태
  const [rooms, setRooms] = useState([]);
  const { user: member, guest, ensureActor, initialized } = useContext(AuthContext);
  // 로그인하지 않았다면 쿠키로 식별되는 게스트로 채팅한다
  const me = member ?? guest;

  const stompClient = useRef(null);

  useEffect(() => {
    // 🌟 인증 복구가 끝나기 전에는 판단하지 않는다.
    //    (여기서 임시 ID를 만들어버리면 로그인 유저의 채팅방을 못 찾는다)
    if (!initialized) return;

    const loadUserId = async () => {
      try {
        // 🌟 친구/모집 화면과 동일한 식별자를 써야 멤버십(user_id)이 일치한다.
        //    로그인 직후에는 email이 빈 문자열이므로 userId를 우선 사용.
        // 회원도 게스트도 아니면 이때 게스트(랜덤 닉네임)를 발급받는다
        const actor = me ?? (await ensureActor());
        const currentUserId = actor?.userId || actor?.email;
        if (currentUserId) {
          setUserId(currentUserId);
        } else {
          const storedId = await AsyncStorage.getItem(USER_ID_KEY);
          const newId =
            storedId ||
            `user_${Math.random()
              .toString(36)
              .substr(2, 6)}_${Date.now().toString().substr(-4)}`;
          await AsyncStorage.setItem(USER_ID_KEY, newId);
          setUserId(newId);
        }
      } catch (e) {
        console.error("사용자 ID 로드/생성 실패", e);
        Alert.alert("오류", "사용자 ID를 불러오거나 생성하는데 실패했습니다.");
        setUserId(`temp_user_${Date.now().toString().substr(-4)}`); // 임시 ID
      } finally {
        setIsUserIdLoading(false); // 🌟 사용자 ID 로딩 완료
      }
    };
    loadUserId();
  }, [initialized, me?.userId, me?.email]);

  const connectWebSocket = useCallback(() => {
    if (stompClient.current && stompClient.current.connected) {
      return;
    }
    stompClient.current = new Client({
      webSocketFactory: () => new SockJS(SOCKET_URL),
      onConnect: () => {
        console.log(
          "ChatRoomsListScreen: WebSocket connected for leave messages."
        );
      },
      onStompError: (frame) => {
        console.error("ChatRoomsListScreen: WebSocket error", frame);
      },
    });
    stompClient.current.activate();
  }, []);

  const disconnectWebSocket = useCallback(() => {
    if (stompClient.current && stompClient.current.connected) {
      stompClient.current.deactivate();
      console.log("ChatRoomsListScreen: WebSocket disconnected.");
    }
  }, []);

  // 🌟 의존성 배열에서 'loading' (isRoomsLoading) 제거 🌟
  const fetchUserRooms = useCallback(async () => {
    if (!userId || isUserIdLoading) {
      setRooms([]);
      return;
    }
    if (isRoomsLoading) return;

    setIsRoomsLoading(true);
    try {
      const data = await getRoomsForUser(userId);
      setRooms(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("채팅방 목록 불러오기 실패:", error);
      Alert.alert("오류", "채팅방 목록을 불러오는데 실패했습니다.");
      setRooms([]);
    } finally {
      setIsRoomsLoading(false);
    }
  }, [userId, isUserIdLoading]);

  useFocusEffect(
    useCallback(() => {
      if (!isUserIdLoading && userId) {
        // 🌟 ID 로딩 완료 후 userId가 있을 때만 호출
        connectWebSocket();
        fetchUserRooms();
      }
      return () => {
        // disconnectWebSocket();
      };
    }, [userId, isUserIdLoading, fetchUserRooms, connectWebSocket]) // 🌟 의존성 배열에 isUserIdLoading 추가 🌟
  );

  const handleCreateAndJoinNewRoom = () => {
    // 비회원(게스트)은 새 채팅방을 만들지 않는다. 초대할 친구가 없으니 모집글에서 대화를 시작하도록 안내한다.
    if (!member) {
      Alert.alert(
        "대화를 시작하려면",
        "모집 탭에서 글을 열고 '대화하기' 버튼을 눌러 주세요.\n로그인하면 친구 목록에서도 대화할 수 있어요.",
        [
          { text: "닫기", style: "cancel" },
          { text: "로그인", onPress: () => navigation.navigate("Signin", { redirectTab: "Chat" }) },
          { text: "모집 보러 가기", onPress: () => navigation.navigate("Connect") },
        ]
      );
      return;
    }

    if (isUserIdLoading || !userId) {
      Alert.alert(
        "알림",
        "사용자 ID를 로드하는 중입니다. 잠시만 기다려주세요."
      );
      return;
    }

    const newRoomId = `${userId}_${Date.now()}`;
    const newRoomName = `새 채팅방(${Date.now().toString().slice(-4)})`;

    navigation.navigate("채팅방 상세", {
      username: userId,
      roomId: newRoomId,
      roomName: newRoomName,
      // 서버엔 아직 방이 없다. 첫 메시지를 보내거나 친구를 초대할 때 만든다.
      isNewRoom: true,
    });
  };

  const handleJoinExistingRoom = (roomItem) => {
    if (isUserIdLoading || !userId) {
      Alert.alert(
        "알림",
        "사용자 ID를 로드하는 중입니다. 잠시만 기다려주세요."
      );
      return;
    }
    navigation.navigate("채팅방 상세", {
      username: userId,
      roomId: roomItem.id,
      roomName: roomItem.name,
    });
  };

  const handleLeaveRoom = (roomIdToLeave, roomName) => {
    if (isUserIdLoading || !userId) {
      Alert.alert("오류", "사용자 ID가 설정되지 않았습니다.");
      return;
    }
    Alert.alert("채팅방 나가기", `'${roomName}' 방을 정말 나가시겠습니까?`, [
      { text: "취소", style: "cancel" },
      {
        text: "나가기",
        onPress: () => {
          if (stompClient.current && stompClient.current.connected) {
            stompClient.current.publish({
              destination: "/app/chat.leaveUser",
              body: JSON.stringify({
                type: MessageType.LEAVE,
                roomId: roomIdToLeave,
                sender: userId,
                content: `${userId}님이 나갔습니다.`,
              }),
            });
            Alert.alert("알림", `'${roomName}' 방에서 나갔습니다.`);
            setRooms(prevRooms => prevRooms.filter(room => room.id !== roomIdToLeave));
          } else {
            Alert.alert(
              "오류",
              "서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요."
            );
          }
        },
      },
    ]);
  };

  const renderRoomItem = ({ item }) => {
    const name = item.name || "이름 없는 채팅방";
    return (
      <TouchableOpacity
        style={localStyles.roomItem}
        onPress={() => handleJoinExistingRoom(item)}
        activeOpacity={0.7}
      >
        <View style={[localStyles.roomAvatar, { backgroundColor: avatarColor(name) }]}>
          <Text style={localStyles.roomAvatarText}>
            {(name.trim()[0] || "?").toUpperCase()}
          </Text>
        </View>
        <View style={localStyles.roomInfo}>
          <Text style={localStyles.roomName} numberOfLines={1}>
            {name}
          </Text>
          {item.participantsCount != null && (
            <View style={localStyles.roomMeta}>
              <Ionicons name="people-outline" size={13} color={theme.colors.textMuted} />
              <Text style={localStyles.roomMetaText}>{item.participantsCount}명 참여 중</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={localStyles.leaveButton}
          onPress={() => handleLeaveRoom(item.id, name)}
          accessibilityLabel="채팅방 나가기"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="exit-outline" size={20} color={theme.colors.textMuted} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // 🌟 전체 화면 로딩 상태는 isUserIdLoading이 담당 🌟
  if (isUserIdLoading) {
    return (
      <View style={localStyles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={localStyles.loadingText}>불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={localStyles.container}>
      {isRoomsLoading && rooms.length === 0 ? (
        <View style={localStyles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={localStyles.loadingText}>채팅방 목록 불러오는 중...</Text>
        </View>
      ) : (
        <FlatList
          data={rooms}
          renderItem={renderRoomItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={localStyles.listContent}
          refreshing={isRoomsLoading}
          onRefresh={fetchUserRooms}
          ListHeaderComponent={
            rooms.length > 0 ? (
              <Text style={localStyles.sectionTitle}>참여 중인 채팅방 {rooms.length}</Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={localStyles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={48} color={theme.colors.textDisabled} />
              <Text style={localStyles.emptyTitle}>아직 참여 중인 채팅방이 없어요</Text>
              <Text style={localStyles.emptyListText}>
                {member
                  ? "모집글에서 대화를 시작하거나\n오른쪽 아래 버튼으로 새 채팅방을 만들어 보세요."
                  : "모집 탭에서 글을 열고 '대화하기'를 눌러 보세요.\n로그인하면 친구 목록에서도 대화할 수 있어요."}
              </Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        style={localStyles.fab}
        onPress={handleCreateAndJoinNewRoom}
        accessibilityLabel="새로운 채팅방 만들기"
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color={theme.colors.white} />
      </TouchableOpacity>
    </View>
  );
}
