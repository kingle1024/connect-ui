import React, { useState, useEffect, useContext, useCallback, useRef } from "react";
import {
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import Constants from "expo-constants";
import { useFocusEffect } from "@react-navigation/native";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import localStyles from "./ChatRoomListScreen.styles.ts";
import AuthContext from "@/components/auth/AuthContext";
import axios from "axios";
const API_BASE_URL = Constants.expoConfig.extra.API_BASE_URL;
const SOCKET_URL = API_BASE_URL + "/ws-chat";
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

const MessageType = {
  LEAVE: "LEAVE",
};

const USER_ID_KEY = "chatAppUserId";

export default function ChatRoomsListScreen({ navigation }) {
  const [userId, setUserId] = useState(null);
  const [isUserIdLoading, setIsUserIdLoading] = useState(true); // 🌟 사용자 ID 로딩 상태
  const [isRoomsLoading, setIsRoomsLoading] = useState(false); // 🌟 채팅방 목록 로딩 상태
  const [rooms, setRooms] = useState([]);
  const { user: me } = useContext(AuthContext);

  const stompClient = useRef(null);

  useEffect(() => {
    const loadUserId = async () => {
      try {
        let storedUserId;
        if (me) {
          storedUserId = me.email;
          setUserId(storedUserId);
        } else {
          const newId = `user_${Math.random()
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
  }, []);

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
      // 🌟 userId가 없거나 ID 로딩 중이면 바로 리턴
      setRooms([]);
      return;
    }
    if (isRoomsLoading) return; // 🌟 이미 목록 로딩 중이면 중복 요청 방지

    setIsRoomsLoading(true); // 🌟 목록 로딩 시작
    try {
      // console.log(me);
      const refreshToken = await AsyncStorage.getItem("refreshToken");
      const response = await axiosInstance.get(
        `${API_BASE_URL}/api/chat/rooms?userId=${userId}`, {
          headers: { Authorization: `Bearer ${refreshToken}` },
        });
      if (!response.data) {
        throw new Error(`HTTP 오류! 상태: ${response.status}`);
      }
      const data = response.data;
      setRooms(data);
    } catch (error) {
      console.error("채팅방 목록 불러오기 실패:", error);
      Alert.alert("오류", "채팅방 목록을 불러오는데 실패했습니다.");
      setRooms([]);
    } finally {
      setIsRoomsLoading(false); // 🌟 목록 로딩 완료
    }
  }, [userId, isUserIdLoading]); // 🌟 이제 userId와 isUserIdLoading에만 의존!

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
            fetchUserRooms();
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

  const renderRoomItem = ({ item }) => (
    <TouchableOpacity
      style={localStyles.roomItem}
      onPress={() => handleJoinExistingRoom(item)}
    >
      <Text style={localStyles.roomName}>
        {item.name} (ID: {item.id})
      </Text>
      <TouchableOpacity
        style={localStyles.leaveButton}
        onPress={() => handleLeaveRoom(item.id, item.name)}
      >
        <Text style={localStyles.leaveButtonText}>나가기</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // 🌟 전체 화면 로딩 상태는 isUserIdLoading이 담당 🌟
  if (isUserIdLoading) {
    return (
      <View style={localStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>사용자 ID 로딩 중...</Text>
      </View>
    );
  }

  return (
    <View style={localStyles.container}>
      <Text style={localStyles.header}>내 채팅방 목록</Text>
      <View style={localStyles.buttonContainer}>
        <TouchableOpacity
          style={localStyles.button}
          onPress={handleCreateAndJoinNewRoom}
        >
          <Text style={localStyles.buttonText}>새로운 채팅방 만들기</Text>
        </TouchableOpacity>
      </View>

      {isRoomsLoading ? ( // 🌟 채팅방 목록 로딩 상태를 보여줌 🌟
        <View style={localStyles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text>채팅방 목록 불러오는 중...</Text>
        </View>
      ) : rooms.length === 0 ? (
        <Text style={localStyles.emptyListText}>
          아직 참여하고 있는 채팅방이 없습니다.
        </Text>
      ) : (
        <FlatList
          data={rooms}
          renderItem={renderRoomItem}
          keyExtractor={(item) => item.id.toString()}
        />
      )}
    </View>
  );
}
