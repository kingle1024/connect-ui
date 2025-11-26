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
  Alert,
  StatusBar,
} from "react-native";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import Constants from "expo-constants";
import Icon from "react-native-vector-icons/Ionicons"; // 🌟 아이콘 사용을 위해 임포트 🌟
import localStyles from "./EnterChatRoom.styles";

const SOCKET_URL = Constants.expoConfig.extra.API_BASE_URL + "/ws-chat";

const MessageType = {
  CHAT: "CHAT",
  JOIN: "JOIN",
  LEAVE: "LEAVE", // 🌟 LEAVE 메시지 타입 사용
  INVITE: "INVITE",
  KICK: "KICK",
};

export default function EnterChatRoom({ route, navigation }) {
  // 🌟 navigation prop을 받도록 추가 🌟
  const { username, roomId, roomName = roomId } = route.params;

  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const currentUser = username;
  const currentRoomId = roomId;
  const currentRoomName = roomName;

  const client = useRef(null);
  const flatListRef = useRef(null);

  // 🌟 채팅방 퇴장 메시지 전송 함수 🌟
  const sendLeaveMessage = useCallback(() => {
    if (client.current && client.current.connected) {
      client.current.publish({
        destination: "/app/chat.leaveUser", // 백엔드에 구현된 퇴장 엔드포인트
        body: JSON.stringify({
          type: MessageType.LEAVE,
          roomId: currentRoomId,
          sender: currentUser,
          content: `${currentUser}님이 퇴장했습니다.`,
        }),
      });
      console.log(
        `${currentUser}님이 방 ${currentRoomId}에서 퇴장 메시지 보냄`
      );
    }
  }, [currentRoomId, currentUser]); // 의존성 추가

  useEffect(() => {
    client.current = new Client({
      webSocketFactory: () => new SockJS(SOCKET_URL),
      onConnect: () => {
        console.log("STOMP 연결 성공!");
        joinRoom();

        client.current.subscribe(`/topic/chat/${currentRoomId}`, (message) => {
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
      // 🌟 컴포넌트 언마운트 시 퇴장 메시지 보내고 연결 해제 🌟
      sendLeaveMessage(); // 퇴장 메시지 전송
      if (client.current && client.current.connected) {
        client.current.deactivate();
      }
      console.log("STOMP 연결 해제 및 퇴장 처리 완료!");
    };
  }, [currentRoomId, currentUser, sendLeaveMessage]); // sendLeaveMessage도 의존성 추가

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
          roomId: currentRoomId,
          sender: currentUser,
          content: "",
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
          roomId: currentRoomId,
          sender: currentUser,
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
    if (Platform.OS === "web") {
      // 웹 환경일 경우
      const inviteeName = window.prompt(
        "초대할 사용자의 닉네임 (ID)을 입력하세요."
      );
      if (inviteeName !== null) {
        // 사용자가 취소를 누르지 않았을 경우
        if (inviteeName.trim() !== "") {
          if (client.current && client.current.connected) {
            client.current.publish({
              destination: "/app/chat.inviteUser",
              body: JSON.stringify({
                type: MessageType.INVITE,
                roomId: currentRoomId,
                sender: currentUser,
                recipient: inviteeName.trim(),
                content: "",
              }),
            });
            console.log(
              `${currentUser}님이 ${inviteeName.trim()}님을 초대 메시지 보냄`
            );
          }
        } else {
          Alert.alert("입력 오류", "초대할 닉네임 (ID)을 입력해야 합니다.");
        }
      }
    } else {
      // 모바일 (iOS/Android) 환경일 경우
      Alert.prompt("사용자 초대", "초대할 사용자의 닉네임 (ID)을 입력하세요.", [
        { text: "취소", style: "cancel" },
        {
          text: "초대",
          onPress: (inviteeName) => {
            if (inviteeName && inviteeName.trim() !== "") {
              if (client.current && client.current.connected) {
                client.current.publish({
                  destination: "/app/chat.inviteUser",
                  body: JSON.stringify({
                    type: MessageType.INVITE,
                    roomId: currentRoomId,
                    sender: currentUser,
                    recipient: inviteeName.trim(),
                    content: "",
                  }),
                });
                console.log(
                  `${currentUser}님이 ${inviteeName.trim()}님을 초대 메시지 보냄`
                );
              }
            } else {
              Alert.alert("입력 오류", "초대할 닉네임 (ID)을 입력해야 합니다.");
            }
          },
        },
      ]);
    }
  };

  const kickUser = () => {
    if (Platform.OS === "web") {
      // 🌟 웹 환경 추가 🌟
      const kickedUserName = window.prompt(
        "강퇴할 사용자의 닉네임 (ID)을 입력하세요."
      );
      if (kickedUserName !== null) {
        // 사용자가 취소를 누르지 않았을 경우
        if (kickedUserName.trim() !== "") {
          if (client.current && client.current.connected) {
            client.current.publish({
              destination: "/app/chat.kickUser",
              body: JSON.stringify({
                type: MessageType.KICK,
                roomId: currentRoomId,
                sender: currentUser,
                recipient: kickedUserName.trim(),
                content: "",
                roomName: currentRoomName, // 🌟 roomName 추가 🌟
              }),
            });
            console.log(
              `${currentUser}님이 ${kickedUserName.trim()}님 강퇴 메시지 보냄`
            );
          }
        } else {
          Alert.alert("입력 오류", "강퇴할 닉네임 (ID)을 입력해야 합니다.");
        }
      }
    } else {
      // 모바일 (iOS/Android) 환경일 경우
      Alert.prompt("사용자 강퇴", "강퇴할 사용자의 닉네임 (ID)을 입력하세요.", [
        { text: "취소", style: "cancel" },
        {
          text: "강퇴",
          onPress: (kickedUserName) => {
            if (kickedUserName && kickedUserName.trim() !== "") {
              if (client.current && client.current.connected) {
                client.current.publish({
                  destination: "/app/chat.kickUser",
                  body: JSON.stringify({
                    type: MessageType.KICK,
                    roomId: currentRoomId,
                    sender: currentUser,
                    recipient: kickedUserName.trim(),
                    content: "",
                    roomName: currentRoomName, // 🌟 roomName 추가 🌟
                  }),
                });
                console.log(
                  `${currentUser}님이 ${kickedUserName.trim()}님 강퇴 메시지 보냄`
                );
              }
            } else {
              Alert.alert("입력 오류", "강퇴할 닉네임 (ID)을 입력해야 합니다.");
            }
          },
        },
      ]);
    }
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

    const isMyMessage = item.sender === currentUser;
    return (
      <View
        style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessage : styles.otherMessage,
        ]}
      >
        {!isMyMessage && (
          <Text style={localStyles.senderText}>{item.sender}</Text>
        )}
        <Text style={localStyles.messageText}>{item.content}</Text>
      </View>
    );
  };

  // 🌟 뒤로가기 버튼 핸들러 🌟
  const handleGoBack = () => {
    // 채팅방 상세 화면에서 채팅 목록 (메인 탭)으로 돌아감
    // 'MainTabs' 내비게이터로 이동하면서 '채팅' 탭이 활성화되도록 함
    navigation.navigate("BottomTab", { screen: "채팅" });
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
        <Text style={localStyles.headerText}>
          방: {currentRoomName} (나: {currentUser})
        </Text>
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
    </KeyboardAvoidingView>
  );
}
