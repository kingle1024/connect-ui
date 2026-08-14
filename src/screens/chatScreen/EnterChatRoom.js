import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import Alert from '@blazejkustra/react-native-alert';
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import InviteModal from "./InviteModal";
import Constants from "expo-constants";
import Icon from "react-native-vector-icons/Ionicons"; // 🌟 아이콘 사용을 위해 임포트 🌟
import localStyles from "./EnterChatRoom.styles";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SOCKET_URL = Constants.expoConfig.extra.API_BASE_URL + "/ws-chat";
const API_BASE_URL = SOCKET_URL.substring(0, SOCKET_URL.lastIndexOf('/'));

const MessageType = {
  CHAT: "CHAT",
  JOIN: "JOIN",
  LEAVE: "LEAVE", // 🌟 LEAVE 메시지 타입 사용
  INVITE: "INVITE",
  KICK: "KICK",
};

export default function EnterChatRoom({ route, navigation }) {
  const { 
    username, 
    roomId, 
    roomName: initialRoomName, 
    roomType 
  } = route.params;

  const [_roomName, set_roomName] = useState(initialRoomName); // 로컬에서 관리할 방 이름
  const [isEditingRoomName, setIsEditingRoomName] = useState(false); // 방 이름 편집 모드 토글
  const [tempRoomName, setTempRoomName] = useState(initialRoomName); // 편집 중인 임시 방 이름

  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");  

  const client = useRef(null);
  const flatListRef = useRef(null);
  // 🌟 onBlur / onSubmitEditing / 저장 버튼 onPress 가 연달아 발생해도
  //    저장이 한 번만 실행되도록 하는 가드
  const isSavingRoomName = useRef(false);

  // 🌟 화면을 벗어나는 것(뒤로가기/언마운트)은 '방 나가기'가 아니므로
  //    /app/chat.leaveUser 는 여기서 호출하지 않는다.
  //    (서버의 leaveUser 는 멤버십을 삭제하고, 남은 인원이 0명이면 방 자체를 지운다.)
  //    실제 방 나가기는 채팅방 목록 화면의 '나가기' 버튼에서만 수행한다.

  const fetchChatHistory = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/rooms/${roomId}/messages`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const history = await response.json();

      // 불러온 메시지들이 FlatList에서 사용할 수 있도록 'id'를 가지고 있는지 확인합니다.
      // 백엔드에서 id를 제공한다면 그대로 사용하고, 없다면 고유 id를 생성해줍니다.
      const formattedHistory = history.map(msg => ({
        ...msg,
        id: msg.id || (Date.now().toString() + Math.random().toString(36).substr(2, 9)),
      }));
      
      // 이전 메시지들을 먼저 설정하고, 이후 실시간 메시지가 추가되도록 합니다.
      setMessages(formattedHistory);
      
      // 로딩된 메시지들이 보일 수 있도록 스크롤을 맨 아래로 이동
      if (flatListRef.current) {
          flatListRef.current.scrollToEnd({ animated: true });
      }

    } catch (error) {
      console.error("채팅 기록 로드에 실패했습니다:", error);
      Alert.alert("오류", "이전 채팅 기록을 불러오는데 실패했습니다.");
    }
  }, [roomId, API_BASE_URL]); 
    
  // 🌟 방 이름 업데이트 API 호출 함수 🌟
  const handleSaveRoomName = useCallback(async () => {
    if (isSavingRoomName.current) {
      return;
    }

    if (tempRoomName.trim() === "" || tempRoomName === _roomName) {
      setIsEditingRoomName(false);
      return;
    }

    isSavingRoomName.current = true;
    try {
      const refreshToken = await AsyncStorage.getItem("refreshToken");
      const response = await fetch(`${API_BASE_URL}/api/chat/rooms/name`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refreshToken}`,
        },
        body: JSON.stringify({
          roomId: roomId,
          roomName: tempRoomName 
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedRoom = await response.json();
      set_roomName(updatedRoom.roomName || tempRoomName);
      setIsEditingRoomName(false); // 편집 모드 종료
      Alert.alert("알림", "방 제목이 성공적으로 변경되었습니다.");

    } catch (error) {
      console.error("방 이름 업데이트 실패:", error);
    } finally {
      isSavingRoomName.current = false;
    }
  }, [roomId, tempRoomName, _roomName, username, API_BASE_URL]);
    
  // 헤더 타이틀만 갱신 (STOMP 연결과 분리 — 방 이름 변경 시 재연결되면 안 됨)
  useEffect(() => {
    navigation.setOptions({
      headerTitle: _roomName, // 변경된 _roomName을 헤더 타이틀로 설정
    });
  }, [navigation, _roomName]);

  useEffect(() => {
    client.current = new Client({
      webSocketFactory: () => new SockJS(SOCKET_URL),
      onConnect: () => {
        console.log("STOMP 연결 성공!");
        fetchChatHistory().then(() => {
          joinRoom(); 
        });

        client.current.subscribe(`/topic/chat/${roomId}`, (message) => {
          const receivedMessage = JSON.parse(message.body);
          if (!receivedMessage.id) {
            receivedMessage.id =
              Date.now().toString() + Math.random().toString(36).substr(2, 9);
          }
          setMessages((prevMessages) => [...prevMessages, receivedMessage]);
        });

        client.current.subscribe(`/user/queue/errors`, (error) => {
          console.error("서버 오류 수신:", error.body);
          Alert.alert("오류", error.body);
        });

        client.current.subscribe(`/user/queue/invitations`, (invite) => {
          console.log("초대 메시지 수신:", invite.body);
          Alert.alert("초대 알림", invite.body);
        });
      },
      onStompError: (frame) => {
        console.error("Broker reported error: " + frame.headers["message"]);
        console.error("Additional details: " + frame.body);
        Alert.alert(
          "연결 오류",
          "채팅 서버와 연결하는 데 문제가 발생했습니다."
        );
      },
      debug: (str) => {
        // console.log(new Date(), str);
      },
      heartbeatIncoming: 0,
      heartbeatOutgoing: 20000,
    });
    client.current.activate();

    return () => {
      // 🌟 언마운트 시에는 소켓만 끊는다. (퇴장 메시지를 보내면 방에서 탈퇴 처리됨) 🌟
      if (client.current && client.current.connected) {
        client.current.deactivate();
      }
      console.log("STOMP 연결 해제 완료!");
    };
  }, [roomId,
    username,
    fetchChatHistory
  ]);

  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const joinRoom = () => {
    if (client.current && client.current.connected) {
      client.current.publish({
        destination: "/app/chat.addUser",
        body: JSON.stringify({
          type: MessageType.JOIN,
          roomId: roomId,
          roomType: roomType,
          sender: username,
          roomName: _roomName,
        }),
      });
    } else {
      console.warn("STOMP 클라이언트가 연결되지 않았습니다.");
    }
  };

  const sendMessage = () => {
    if (currentMessage.trim() === "") return;

    if (client.current && client.current.connected) {
      client.current.publish({
        destination: "/app/chat.sendMessage",
        body: JSON.stringify({
          type: MessageType.CHAT,
          roomId: roomId,
          sender: username,
          content: currentMessage,
        }),
      });
      setCurrentMessage("");
    } else {
      console.warn("STOMP 클라이언트가 연결되지 않았습니다.");
    }
  };

  const handleKeyDown = (e) => {
    if (Platform.OS === "web") {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    }
  };

  const inviteUser = () => {
    // Open the friend-selection modal (use same modal for web and mobile).
    setModalMode("invite");
    openInviteModal();
  };

  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState("invite");
  const openInviteModal = () => setInviteModalVisible(true);
  const closeInviteModal = () => setInviteModalVisible(false);

  const kickUser = () => {
    setModalMode("kick");
    openInviteModal();
  };

  const renderMessageItem = ({ item }) => {
    let messageContent = "";

    if (item.type !== MessageType.CHAT) {
      if (item.type === MessageType.JOIN) {
        messageContent = `${item.sender}님이 입장했습니다.`;
      } else if (item.type === MessageType.INVITE) {
        messageContent = `${item.sender}님이 ${item.recipient}님을 초대했습니다.`;
      } else if (item.type === MessageType.KICK) {
        messageContent = `${item.sender}님이 ${item.recipient}님을 강퇴했습니다.`;
      } else if (item.type === MessageType.LEAVE) {
        // 🌟 LEAVE 메시지 타입 추가
        messageContent = `${item.sender}님이 퇴장했습니다.`;
      }

      if (messageContent) {
        return (
          <View style={localStyles.systemMessage}>
            <Text style={localStyles.systemText}>{messageContent}</Text>
          </View>
        );
      } else {
        return null;
      }
    }

    const isMyMessage = item.sender === username;
    return (
      <View
        style={[
          localStyles.messageContainer,
          isMyMessage ? localStyles.myMessage : localStyles.otherMessage,
        ]}
      >
        {!isMyMessage && (
          <Text style={localStyles.senderText}>{item.sender}</Text>
        )}
        <Text style={isMyMessage ? localStyles.myMessageText : localStyles.messageText}>
          {item.content}
        </Text>
      </View>
    );
  };

  // 🌟 뒤로가기 버튼 핸들러 🌟
  const handleGoBack = () => {
    // 채팅방 상세 화면에서 채팅 목록 (메인 탭)으로 돌아감
    // 'MainTabs' 내비게이터로 이동하면서 '채팅' 탭이 활성화되도록 함
    navigation.navigate("BottomTab", { screen: "Chat" });
  };

  return (
    <KeyboardAvoidingView
      style={localStyles.screenContainer}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      {/* 🌟 헤더를 View로 감싸고 뒤로가기 버튼 추가 🌟 */}
      <View style={localStyles.headerContainer}>
        <TouchableOpacity style={localStyles.backButton} onPress={handleGoBack}>
          <Icon name="chevron-back" size={28} color="#333" />
        </TouchableOpacity>
        <View style={localStyles.roomNameEditContainer}>
          {isEditingRoomName ? (
            <TextInput
              style={localStyles.headerTextInput}
              value={tempRoomName}
              onChangeText={setTempRoomName}
              onBlur={handleSaveRoomName}
              autoFocus={true}
              onSubmitEditing={handleSaveRoomName}
              returnKeyType="done"
            />
          ) : (
            <Text style={localStyles.headerText}>
              방: {_roomName}
            </Text>
          )}
          <TouchableOpacity
            onPress={() => {
              if (isEditingRoomName) {
                handleSaveRoomName(); // 저장 버튼 클릭 시
              } else {
                setIsEditingRoomName(true); // 편집 모드 시작
                setTempRoomName(_roomName); // 현재 방 이름으로 임시 설정
              }
            }}
            style={localStyles.editSaveButton}
          >
            <Icon
              name={isEditingRoomName ? "checkmark-circle" : "create-outline"} // 편집 중이면 체크마크, 아니면 연필 아이콘
              size={24}
              color="#333"
            />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessageItem}
        keyExtractor={(item) => item.id.toString()}
        style={localStyles.chatArea}
        contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-end" }}
      />

      <View style={localStyles.inputContainer}>
        <TextInput
          style={localStyles.input}
          value={currentMessage}
          onChangeText={setCurrentMessage}
          placeholder="메시지를 입력하세요..."
          multiline
          onKeyPress={handleKeyDown}
        />
        <TouchableOpacity style={localStyles.sendButton} onPress={sendMessage}>
          <Text style={localStyles.sendButtonText}>전송</Text>
        </TouchableOpacity>
      </View>

      <View style={localStyles.leaderFunctionContainer}>
        <TouchableOpacity style={localStyles.leaderButton} onPress={inviteUser}>
          <Text style={localStyles.leaderButtonText}>사용자 초대</Text>
        </TouchableOpacity>
        <TouchableOpacity style={localStyles.leaderButton} onPress={kickUser}>
          <Text style={localStyles.leaderButtonText}>사용자 강퇴</Text>
        </TouchableOpacity>
      </View>

      <InviteModal
        visible={inviteModalVisible}
        onClose={closeInviteModal}
        roomId={roomId}
        username={username}
        client={client}
        SOCKET_URL={SOCKET_URL}
        API_BASE_URL={API_BASE_URL}
        roomName={_roomName}
        mode={modalMode}
      />
    </KeyboardAvoidingView>
  );
}
