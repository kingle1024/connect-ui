import React, { useMemo, useState, useContext, useRef, useEffect } from "react";
import {
  View,
  Text,
  SafeAreaView,
  TextInput,
  SectionList,
  TouchableOpacity,
  Modal,
  Pressable,
  ActivityIndicator,
} from "react-native";
import Alert from '@blazejkustra/react-native-alert';
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { Feather, AntDesign } from "@expo/vector-icons";
import FriendItem from "@/components/FriendItem";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AuthContext from "@/components/auth/AuthContext";
import { useRootNavigation } from "@/hooks/useNavigation";
import { createOneToOneRoom, getOneToOneRoomsForUser } from "@/utils/chat";
import styles from './FriendsListScreen.styles';

type Friend = {
  id: string;
  name: string;
  avatar?: string;
  status?: string;
  online?: boolean;
  favorite?: boolean;

  requestId?: string;
  senderId?: string;
  receiverId?: string;
  requestStatus?: 'pending' | 'accepted' | 'rejected'; // friend_requests.status
};

type SectionData = {
  title: string;
  data: Friend[];
  type: 'friend' | 'request'; // 섹션 타입 추가
};

const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL || "";

const groupAllContacts = (friends: Friend[], pendingRequests: Friend[], query: string): SectionData[] => {
  const filteredFriends = friends.filter((f) => f.name.toLowerCase().includes(query.toLowerCase()));
  const filteredRequests = pendingRequests;

  const sections: SectionData[] = [];

  // 1. 친구 요청 섹션
  // friend_requests.sender_id를 사용하고, 해당 sender_id에 대한 닉네임과 아바타를 백엔드에서 가져와야 함.
  if (filteredRequests.length > 0) {
    sections.push({ title: "친구 요청", data: filteredRequests, type: 'request' });
  }

  // 2. 즐겨찾기 친구
  const favoriteFriends = filteredFriends.filter((f) => f.favorite);
  if (favoriteFriends.length > 0) {
    sections.push({ title: "즐겨찾기", data: favoriteFriends, type: 'friend' });
  }

  // 3. 일반 친구 (가나다순)
  const otherFriends = filteredFriends.filter((f) => !f.favorite);
  const friendMap: Record<string, Friend[]> = {};
  otherFriends.forEach((f) => {
    const key = f.name.charAt(0).toUpperCase();
    if (!friendMap[key]) friendMap[key] = [];
    friendMap[key].push(f); // Fix: friendMap[key].push(f);
  });
  // Fixed typo: map -> friendMap
  Object.keys(friendMap)
    .sort()
    .forEach((k) => sections.push({ title: k, data: friendMap[k], type: 'friend' }));

  return sections;
};

const FriendsListScreen = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const rootNavigation = useRootNavigation();
  const { user: me } = useContext(AuthContext);

  // 초기값을 빈 배열로 변경 (이후 fetch로 채움)
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]); // 친구 요청 목록 상태

  const [query, setQuery] = useState("");
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [actionVisible, setActionVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [openingChat, setOpeningChat] = useState(false); // <- 추가: 채팅 열기/생성 중 상태
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  const getAuthToken = async () => {
    const accessToken = await AsyncStorage.getItem("accessToken");
    const refreshToken = await AsyncStorage.getItem("refreshToken");
    return accessToken || refreshToken;
  };

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
      const token = await getAuthToken();

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

  const fetchFriendRequests = async () => {
    const currentUserId = me?.userId || me?.email;
    if (!currentUserId) { 
      setPendingRequests([]); return; 
    }

    try {
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE_URL}/api/friends/${encodeURIComponent(currentUserId)}/friend-requests/received`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        const data = await res.json();
        const mapped: Friend[] = Array.isArray(data)
          ? data.map((d: any) => ({
              id: String(d.id),
              name: d.name,
              avatar: d.avatar,
              senderId: d.senderId,
              receiverId: d.receiverId,
              status: d.status,
            }))
          : [];
        setPendingRequests(mapped);
      } else {
        console.warn("fetchFriendRequests failed:", res.status);
      }
    } catch (err) {
      console.warn("fetchFriendRequests error:", err);
    }
  };

  // 마운트 시 및 me 변경 시 친구 목록 로드
  useEffect(() => {
    fetchFriends();
    fetchFriendRequests();
  }, [me?.userId, me?.email]);

  // 클릭한 친구와 1:1 채팅방이 이미 있는지 찾기
  const findOneToOneRoom = (rooms: any[], currentUserId: string, friendId: string) => {
    const foundRoom = rooms.find(room => {
        return room.userId == friendId; 
    });

    return foundRoom; 
  };

  const sections = useMemo(() => groupAllContacts(friends, pendingRequests, query), [friends, pendingRequests, query]);

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

      const roomName = selectedFriend.name;

      // ChatRoomListScreen과 동일하게 동작하도록: 먼저 Chat 탭으로 이동한 다음,
      // 탭 내부에서 "채팅방 상세"로 진입하게 함. (딜레이로 탭 전환 안정화)
      rootNavigation.navigate("BottomTab" as any, {
        screen: "Chat",
      });
      setTimeout(() => {
        navigation.navigate("채팅방 상세" as any, {
          username: currentUserId,
          roomId: created.roomId,
          roomName,
          roomType: "ONE_TO_ONE",
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

    Alert.alert(
      "친구 삭제",
      `'${selectedFriend.name}' 님을 친구 목록에서 삭제하시겠습니까?`,
      [
        {
          text: "취소",
          style: "cancel",
          onPress: () => setDeleting(false),
        },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            try {
              const currentUserId = me?.userId;
              if (!currentUserId) {
                Alert.alert("권한 오류", "작업을 수행하려면 로그인되어 있어야 합니다.");
                setDeleting(false);
                return;
              }

              const token = await getAuthToken();
              if (!token) {
                Alert.alert("권한 오류", "작업을 수행하려면 로그인되어 있어야 합니다.");
                setDeleting(false);
                return;
              }

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
          },
        },
      ]
    );
  };

  type FriendRequestStatus = "ACCEPTED" | "REJECTED";
  const handleProcessFriendRequest = async (item: Friend, status: FriendRequestStatus) => {
    // 요청 ID와 현재 로그인한 사용자가 일치하는지 추가 확인 (선택 사항이지만 안전함)
    if (!item.senderId) {
      return;
    }
    setProcessingRequestId(item.senderId);

    try {
      const currentUserId = me?.userId || me?.email;
      if (!currentUserId) {
        Alert.alert("권한 오류", "로그인이 필요합니다.");
        setProcessingRequestId(null);
        return;
      }
      const token = await getAuthToken();
      if (!token) {
        Alert.alert("권한 오류", "작업을 수행하려면 로그인되어 있어야 합니다.");
        setProcessingRequestId(null);
        return;
      }
      if (!item.senderId) {
        Alert.alert("오류", "친구의 아이디가 잘못되었습니다.");
        setProcessingRequestId(null);
        return;
      }

      // DB 구조에 따라, requestId는 friend_requests 테이블의 id입니다.
      // receiver_id가 현재 사용자와 일치하는지 백엔드에서 반드시 확인해야 합니다.
      const endpoint = `${API_BASE_URL}/api/friends/${currentUserId}/friend-requests/${item.senderId}/process`

      const res = await fetch(endpoint, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        // 백엔드의 FriendRequestProcessDto에 맞게 body 구성
        body: JSON.stringify({
          status: status, // 친구 요청 수락 또는 거절을 의미하는 상태
        }),
      });


      if (res.ok) {
        if (status === "ACCEPTED") {
          Alert.alert("알림", `'${item.name}' 님의 친구 요청을 수락했습니다.`);
        } else {
          Alert.alert("알림", `'${item.name}' 님의 친구 요청을 거절했습니다.`);
        }
        
        setPendingRequests(prev => prev.filter(req => req.requestId !== item.requestId));
        fetchFriends();
      } else {
        const json = await res.json().catch(() => null);
        const message = json?.error || json?.message || "친구 요청 수락에 실패했습니다.";
        Alert.alert("오류", message);
      }
    } catch (err) {
      console.error("친구 요청 수락 실패:", err);
      Alert.alert("네트워크 오류", "서버에 연결할 수 없습니다.");
    } finally {
      setProcessingRequestId(null);
    }
  };

  const renderSectionHeader = ({ section }: any) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
    </View>
  );

  function openActions(item: Friend): void {
    if (item.requestStatus === 'pending') {
      return; // 친구 요청인 경우 액션 시트 안 띄움
    }
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
          placeholder="친구 검색"
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          clearButtonMode="while-editing"
        />
      </View>

      {(isLoadingFriends) && (
        <View style={{ paddingVertical: 10 }}>
          <ActivityIndicator size="small" color="#0000ff" />
        </View>
      )}
      
      <SectionList
        sections={sections}
        keyExtractor={(item, index) => item.requestId ? `req-${item.requestId}` : `friend-${item.id}-${index}`}
        renderItem={({ item, section }) => (
          <FriendItem
            friend={item}
            onPress={() => openActions(item)}
            type={section.type}
            onAccept={section.type === 'request' ? () => handleProcessFriendRequest(item, "ACCEPTED") : undefined}
            onReject={section.type === 'request' ? () => handleProcessFriendRequest(item, "REJECTED") : undefined}
            isProcessing={item.requestId === processingRequestId}
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

export default FriendsListScreen;