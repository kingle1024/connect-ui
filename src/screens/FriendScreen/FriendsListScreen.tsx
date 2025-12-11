import React, { useMemo, useState, useContext, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  SectionList,
  TouchableOpacity,
  Modal,
  Pressable,
  Alert,
} from "react-native";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { Feather, AntDesign } from "@expo/vector-icons";
import FriendItem from "@/components/FriendItem";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AuthContext from "@/components/auth/AuthContext";
import { useRootNavigation } from "@/hooks/useNavigation";
import { getRoomsForUser, createOneToOneRoom, getOneToOneRoomsForUser } from "@/utils/chat";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const SOCKET_URL = (Constants.expoConfig?.extra?.API_BASE_URL || "") + "/ws-chat";

type Friend = {
  id: string;
  name: string;
  avatar?: string;
  status?: string;
  online?: boolean;
  favorite?: boolean;
};

const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL || "";

const groupFriends = (items: Friend[], query: string) => {
  const filtered = items.filter((f) => f.name.toLowerCase().includes(query.toLowerCase()));
  const favorites = filtered.filter((f) => f.favorite);
  const rest = filtered.filter((f) => !f.favorite);

  const map: Record<string, Friend[]> = {};
  rest.forEach((f) => {
    const key = f.name.charAt(0).toUpperCase();
    if (!map[key]) map[key] = [];
    map[key].push(f);
  });

  const sections: { title: string; data: Friend[] }[] = [];
  if (favorites.length) sections.push({ title: "즐겨찾기", data: favorites });
  Object.keys(map)
    .sort()
    .forEach((k) => sections.push({ title: k, data: map[k] }));
  return sections;
};

const FriendsListScreen = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const rootNavigation = useRootNavigation();
  const { user: me } = useContext(AuthContext);

  // 초기값을 빈 배열로 변경 (이후 fetch로 채움)
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [actionVisible, setActionVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [openingChat, setOpeningChat] = useState(false); // <- 추가: 채팅 열기/생성 중 상태
  const client = useRef(null);

  // 친구 목록 API 호출 함수
  const fetchFriends = async () => {
    const currentUserId = me?.userId || me?.email;
    if (!currentUserId) {
      // 로그인 안된 상태면 빈 목록
      setFriends([]);
      return;
    }

    setIsLoadingFriends(true);
    try {
      const accessToken = await AsyncStorage.getItem("accessToken");
      const refreshToken = await AsyncStorage.getItem("refreshToken");
      const token = accessToken || refreshToken;

      const res = await fetch(`${API_BASE_URL}/api/friends/${encodeURIComponent(currentUserId)}/friends`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        const data = await res.json();
        // 서버 응답 구조에 맞춰 매핑 (유연 처리)
        const mapped: Friend[] = Array.isArray(data)
          ? data.map((d: any) => ({
              id: d.friendUserId,
              name: d.friendNickname,
              avatar: d.avatar,
              status: d.status,
              online: !!d.online,
              favorite: !!d.favorite,
            }))
          : [];
        setFriends(mapped);
      } else {
        console.warn("fetchFriends failed:", res.status);
        // 실패 시 기존 friends 유지 (현재 빈 배열) — 필요하면 fallback 로직 추가
      }
    } catch (err) {
      console.warn("fetchFriends error:", err);
    } finally {
      setIsLoadingFriends(false);
    }
  };

  // 마운트 시 및 me 변경 시 친구 목록 로드
  useEffect(() => {
    fetchFriends();
  }, [me?.userId, me?.email]);

  // 유틸: 방에서 참여자 아이디만 뽑아 비교하기 (응답 구조가 다양할 수 있으므로 유연하게 처리)
  const extractParticipantIds = (room: any): string[] => {
    // 유효한 필드들 확인
    const arr = room.participants || room.members || room.userIds || room.participantIds || [];
    return arr.map((p: any) => {
      if (!p) return "";
      // 객체일 경우 아이디 추출 시도
      if (typeof p === "object") {
        return p.id || p.userId || p.email || p.name || JSON.stringify(p);
      }
      // 문자열인 경우 그대로
      return String(p);
    }).filter(Boolean);
  };

  // 클릭한 친구와 1:1 채팅방이 이미 있는지 찾기
  const findOneToOneRoom = (rooms: any[], currentUserId: string, friendId: string) => {
    const foundRoom = rooms.find(room => {
        return room.userId == friendId; 
    });

    return foundRoom; 
  };

  const sections = useMemo(() => groupFriends(friends, query), [friends, query]);

  const handleChat = async () => {
    if (!selectedFriend || openingChat) return;
    setOpeningChat(true);

    try {
      const currentUserId = me?.userId || me?.email;
      if (!currentUserId) {
        Alert.alert("권한 오류", "로그인이 필요합니다.");
        setOpeningChat(false);
        return;
      }

      // 1) 서버에서 방 목록 조회
      let rooms;
      try {
        rooms = await getOneToOneRoomsForUser(currentUserId);
      } catch (err) {
        console.error("채팅 목록 조회 실패", err);
        Alert.alert("오류", "채팅 목록을 가져오지 못했습니다.");
        setOpeningChat(false);
        return;
      }

      const existingOneToOne = findOneToOneRoom(rooms, currentUserId, selectedFriend.id);
      let created;

      if (existingOneToOne) {
        created = existingOneToOne;
      } else {
        // 2) 서버에 방 생성 API가 없을 수 있으므로 utils.createOneToOneRoom이 로컬 fallback을 반환하도록 되어 있음
        try {
          created = await createOneToOneRoom(currentUserId, selectedFriend.id, selectedFriend.name);
        } catch (err) {
          console.error("채팅방 생성 실패", err);
          Alert.alert("오류", "채팅방 생성에 실패했습니다.");
          setOpeningChat(false);
          return;
        }
      }

      if (!created) {
        Alert.alert("오류", "채팅방을 열 수 없습니다.");
        setOpeningChat(false);
        return;
      }

      const targetRoomId = created.roomId;
      const roomName = created.name || selectedFriend.name || `채팅 ${targetRoomId}`;

      // ChatRoomListScreen과 동일하게 동작하도록: 먼저 Chat 탭으로 이동한 다음,
      // 탭 내부에서 "채팅방 상세"로 진입하게 함. (딜레이로 탭 전환 안정화)
      rootNavigation.navigate("BottomTab" as any, {
        screen: "Chat",
      });
      setTimeout(() => {
        navigation.navigate("채팅방 상세" as any, {
          username: currentUserId,
          roomId: targetRoomId,
          roomName,
        });
      }, 50);

      closeActions();
    } catch (err) {
      console.error("채팅 열기/생성 실패:", err);
      Alert.alert("오류", "채팅방을 열 수 없습니다. 다시 시도해 주세요.");
    } finally {
      setOpeningChat(false);
    }
  };

  // --- 변경된 부분: 서버 삭제 요청 후 성공하면 목록에서 제거 (Authorization + currentUserId 포함) ---
  const handleDelete = async () => {
    if (!selectedFriend || deleting) return;
    setDeleting(true);

    try {
      // 현재 로그인 사용자 ID 확인
      const currentUserId = me?.userId;
      if (!currentUserId) {
        Alert.alert("권한 오류", "작업을 수행하려면 로그인되어 있어야 합니다.");
        setDeleting(false);
        return;
      }

      // 토큰 획득: accessToken 우선, 없으면 refreshToken 사용
      const accessToken = await AsyncStorage.getItem("accessToken");
      const refreshToken = await AsyncStorage.getItem("refreshToken");
      const token = accessToken || refreshToken;

      if (!token) {
        Alert.alert("권한 오류", "작업을 수행하려면 로그인되어 있어야 합니다.");
        setDeleting(false);
        return;
      }

      // API 경로: /api/friends/{currentUserId}/friends/{friendId}
      const endpoint = `${API_BASE_URL}/api/friends/${currentUserId}/friends/${selectedFriend.id}`;

      const res = await fetch(endpoint, {
        method: "DELETE",
        headers:
          {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
      });

      if (res.ok) {
        // 성공하면 로컬에서 제거
        setFriends((prev) => prev.filter((f) => f.id !== selectedFriend.id));
        closeActions();
      } else if (res.status === 401 || res.status === 403) {
        Alert.alert("권한 오류", "로그인이 필요하거나 권한이 없습니다.");
      } else {
        const json = await res.json().catch(() => null);
        const message = json?.error || json?.message || "친구 삭제에 실패했습니다.";
        Alert.alert("오류", message);
      }
    } catch (err) {
      console.error("친구 삭제 실패:", err);
      Alert.alert("네트워크 오류", "서버에 연결할 수 없습니다. 다시 시도해 주세요.");
    } finally {
      setDeleting(false);
    }
  };

  const renderSectionHeader = ({ section }: any) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
    </View>
  );

  function openActions(item: Friend): void {
    setSelectedFriend(item);
    setActionVisible(true);
  }

  function closeActions(): void {
    setActionVisible(false);
    setSelectedFriend(null);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>친구</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn}>
            <Feather name="user-plus" size={20} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <AntDesign name="setting" size={20} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <Feather name="search" size={18} color="#777" />
        <TextInput
          placeholder="친구, 카카오톡 ID 검색"
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          clearButtonMode="while-editing"
        />
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FriendItem
            friend={item}
            onPress={() => openActions(item)} // 클릭 시 액션 시트 표시
          />
        )}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={{ paddingBottom: 32 }}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>검색 결과가 없습니다</Text>
          </View>
        )}
      />

      <Modal visible={actionVisible} transparent animationType="fade" onRequestClose={closeActions}>
        <Pressable style={styles.modalOverlay} onPress={closeActions}>
          <Pressable style={styles.actionSheet} onPress={() => {}}>
            <TouchableOpacity style={styles.actionButton} onPress={handleChat} disabled={openingChat}>
              <Text style={styles.actionText}>{openingChat ? "열기 중..." : "채팅"}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, deleting && { opacity: 0.6 }]}
              onPress={handleDelete}
              disabled={deleting}
            >
              <Text style={[styles.actionText, styles.deleteText]}>
                {deleting ? "삭제 중..." : "친구 삭제"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={closeActions}>
              <Text style={styles.actionText}>취소</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const publishInvite = (roomId: string, sender: string, recipient: string, roomName?: string) => {
  try {
    const client = new Client({
      webSocketFactory: () => new SockJS(SOCKET_URL),
      onConnect: () => {
        try {
          client.publish({
            destination: "/app/chat.inviteUser",
            body: JSON.stringify({
              type: "INVITE",
              roomId,
              sender,
              recipient,
              content: "",
              roomName: roomName ?? roomId,
            }),
          });
        } catch (e) {
          console.warn("invite publish failed:", e);
        }
        // 짧은 지연 후 연결 종료
        setTimeout(() => {
          try { client.deactivate(); } catch (e) {}
        }, 150);
      },
      onStompError: (frame) => {
        console.warn("STOMP error on invite:", frame);
      },
      debug: () => {},
    });
    client.activate();
  } catch (e) {
    console.warn("publishInvite error:", e);
  }
};
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  header: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { fontSize: 20, fontWeight: "700" },
  headerRight: { flexDirection: "row", alignItems: "center" },
  iconBtn: { marginLeft: 12 },

  searchWrap: {
    marginHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    paddingHorizontal: 12,
    borderRadius: 8,
    height: 42,
    marginBottom: 8,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15 },

  sectionHeader: { paddingHorizontal: 16, paddingVertical: 6, backgroundColor: "#fff" },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: "#666" },

  separator: { height: StyleSheet.hairlineWidth, backgroundColor: "#eee", marginLeft: 74 },

  empty: { alignItems: "center", paddingTop: 40 },
  emptyText: { color: "#888" },

  // Modal / action sheet
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  actionSheet: {
    padding: 16,
    backgroundColor: "#fff",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  actionButton: {
    paddingVertical: 14,
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
  actionText: { fontSize: 16 },
  deleteText: { color: "red", fontWeight: "700" },
});

export default FriendsListScreen;