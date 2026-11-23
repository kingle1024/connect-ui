import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Alert from '@blazejkustra/react-native-alert';
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import InviteModal from "./InviteModal";
import Constants from "expo-constants";
import Icon from "react-native-vector-icons/Ionicons"; // 🌟 아이콘 사용을 위해 임포트 🌟
import localStyles from "./EnterChatRoom.styles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import theme from "@/modules/theme";

const SOCKET_URL = Constants.expoConfig.extra.API_BASE_URL + "/ws-chat";
const API_BASE_URL = SOCKET_URL.substring(0, SOCKET_URL.lastIndexOf('/'));

const MessageType = {
  CHAT: "CHAT",
  JOIN: "JOIN",
  LEAVE: "LEAVE", // 🌟 LEAVE 메시지 타입 사용
  INVITE: "INVITE",
  KICK: "KICK",
};

// 서버 insertDts(LocalDateTime, 예: "2026-11-23T10:15:30" 또는 [2026,11,23,10,15,30]) → Date
const parseDate = (value) => {
  if (!value) return null;
  const d = Array.isArray(value)
    ? new Date(value[0], (value[1] || 1) - 1, value[2] || 1, value[3] || 0, value[4] || 0, value[5] || 0)
    : new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

const minuteKey = (value) => {
  const d = parseDate(value);
  return d ? Math.floor(d.getTime() / 60000) : null;
};

const formatTime = (value) => {
  const d = parseDate(value);
  if (!d) return "";
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h < 12 ? "오전" : "오후"} ${h % 12 === 0 ? 12 : h % 12}:${m}`;
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const formatDay = (d) =>
  `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${WEEKDAYS[d.getDay()]}요일`;

// 보낸 사람마다 같은 색이 나오도록 이름으로 아바타 색을 고른다
const AVATAR_COLORS = ["#FF8A65", "#4FC3F7", "#81C784", "#BA68C8", "#FFB74D", "#7986CB", "#4DB6AC"];
const avatarColor = (name = "") => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};
// 서버가 붙여 주는 표시 이름(게스트는 "용감한 코알라 12" 같은 닉네임). 없으면 userId 로 대신한다.
const senderNameOf = (m) => m?.senderName || m?.sender || "";
const recipientNameOf = (m) => m?.recipientName || m?.recipient || "";
const initialOf = (name = "") => (String(name).trim()[0] || "?").toUpperCase();

export default function EnterChatRoom({ route, navigation }) {
  const {
    username,
    roomId,
    roomName: initialRoomName,
    roomType,
    isNewRoom = false,
  } = route.params;

  const [_roomName, set_roomName] = useState(initialRoomName); // 로컬에서 관리할 방 이름
  const [isEditingRoomName, setIsEditingRoomName] = useState(false); // 방 이름 편집 모드 토글
  const [tempRoomName, setTempRoomName] = useState(initialRoomName); // 편집 중인 임시 방 이름

  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const canSend = currentMessage.trim() !== "";

  const client = useRef(null);
  const flatListRef = useRef(null);
  // 빈 방 정리 판단용: 최신 메시지 목록과 '이전 기록을 정상적으로 불러왔는지'
  const messagesRef = useRef([]);
  const historyLoadedRef = useRef(false);
  const leavingRef = useRef(false);
  const leaveAckRef = useRef(null);
  // 새로 만든 방(isNewRoom)은 화면을 연 것만으로 서버에 방을 만들지 않는다.
  // 첫 메시지를 보내거나 친구를 초대할 때 입장(addUser)하며 방이 생긴다. → 그냥 나가면 남는 게 없다.
  const joinedRef = useRef(!isNewRoom);
  const joinPromiseRef = useRef(null);
  const joinAckRef = useRef(null);
  // 🌟 onBlur / onSubmitEditing / 저장 버튼 onPress 가 연달아 발생해도
  //    저장이 한 번만 실행되도록 하는 가드
  const isSavingRoomName = useRef(false);

  // 🌟 화면을 벗어나는 것(뒤로가기/언마운트)은 '방 나가기'가 아니므로
  //    /app/chat.leaveUser 는 여기서 호출하지 않는다.
  //    (서버의 leaveUser 는 멤버십을 삭제하고, 남은 인원이 0명이면 방 자체를 지운다.)
  //    실제 방 나가기는 채팅방 목록 화면의 '나가기' 버튼에서만 수행한다.
  //    예외: 대화 없이 나 혼자 남은 빈 방은 화면을 벗어날 때 정리한다. (removeRoomIfEmpty)

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
      historyLoadedRef.current = true;

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

    // 아직 서버에 없는 새 방이면 이름만 바꿔 둔다. (입장할 때 이 이름으로 방이 만들어진다)
    if (!joinedRef.current) {
      set_roomName(tempRoomName);
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
          if (joinedRef.current) joinRoom();
        });

        client.current.subscribe(`/topic/chat/${roomId}`, (message) => {
          const receivedMessage = JSON.parse(message.body);
          if (
            receivedMessage.type === MessageType.LEAVE &&
            receivedMessage.sender === username &&
            leaveAckRef.current
          ) {
            leaveAckRef.current();
            leaveAckRef.current = null;
            return; // 화면을 떠나는 중이라 표시하지 않는다
          }
          if (
            receivedMessage.type === MessageType.JOIN &&
            receivedMessage.sender === username &&
            joinAckRef.current
          ) {
            joinAckRef.current();
            joinAckRef.current = null;
          }
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
      // 아직 연결 중이어도 끊는다. (안 끊으면 화면을 떠난 뒤에 연결돼 입장 처리될 수 있다)
      if (client.current) {
        client.current.deactivate();
      }
      console.log("STOMP 연결 해제 완료!");
    };
  }, [roomId,
    username,
    fetchChatHistory
  ]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // 🌟 빈 방 정리: 방을 만들고 아무도 초대하지 않은 채(대화도 없이) 나가면 방을 지운다.
  //    조건 — 이전 기록을 정상적으로 불러왔고, 주고받은 대화(CHAT)가 없고, 참여자가 나 혼자.
  //    서버 leaveUser 는 마지막 멤버가 나가면 방 자체를 삭제한다.
  //    기록을 못 불러온 경우엔 대화가 있는지 알 수 없으므로 지우지 않는다.
  const removeRoomIfEmpty = useCallback(async () => {
    const stomp = client.current;
    if (!joinedRef.current) return; // 서버에 만든 적 없는 새 방
    if (!stomp || !stomp.connected || !historyLoadedRef.current) return;
    if (messagesRef.current.some((m) => m.type === MessageType.CHAT)) return;

    const res = await fetch(`${API_BASE_URL}/api/chat/rooms/participants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId }),
    });
    if (!res.ok) return;
    const participants = (await res.json()) || [];
    const onlyMe =
      participants.length === 1 && String(participants[0].userId) === String(username);
    if (!onlyMe) return;

    // 서버가 멤버십·방을 지운 뒤 브로드캐스트하는 내 LEAVE 메시지를 받을 때까지 기다린다
    const leaveAck = new Promise((resolve) => {
      leaveAckRef.current = resolve;
    });
    stomp.publish({
      destination: "/app/chat.leaveUser",
      body: JSON.stringify({
        type: MessageType.LEAVE,
        roomId,
        sender: username,
        content: `${username}님이 나갔습니다.`,
      }),
    });
    await leaveAck;
  }, [roomId, username]);

  // 헤더 뒤로가기·휴대폰/브라우저 뒤로가기 모두 화면 제거 전에 빈 방을 정리한다.
  // 목록 화면이 다시 불러올 때 지워진 상태가 보이도록, 정리가 끝난 뒤(최대 2초) 이동한다.
  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      if (leavingRef.current) return;
      e.preventDefault();
      leavingRef.current = true;
      const timeout = new Promise((resolve) => setTimeout(resolve, 2000));
      Promise.race([removeRoomIfEmpty().catch((err) => console.warn("빈 방 정리 실패", err)), timeout])
        .finally(() => navigation.dispatch(e.data.action));
    });
    return unsubscribe;
  }, [navigation, removeRoomIfEmpty]);

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

  // 새 방이면 입장(=서버에 방 생성)하고, 서버가 내 JOIN 을 브로드캐스트할 때까지 기다린다.
  const ensureJoined = () => {
    if (joinedRef.current) return Promise.resolve();
    if (joinPromiseRef.current) return joinPromiseRef.current;
    const ack = new Promise((resolve) => {
      joinAckRef.current = resolve;
    });
    joinRoom();
    joinPromiseRef.current = Promise.race([
      ack,
      new Promise((resolve) => setTimeout(resolve, 3000)),
    ]).then(() => {
      joinAckRef.current = null;
      joinedRef.current = true;
    }).finally(() => {
      joinPromiseRef.current = null;
    });
    return joinPromiseRef.current;
  };

  const sendMessage = async () => {
    const content = currentMessage;
    if (content.trim() === "") return;

    if (client.current && client.current.connected) {
      setCurrentMessage("");
      await ensureJoined();
      if (!client.current || !client.current.connected) return;
      client.current.publish({
        destination: "/app/chat.sendMessage",
        body: JSON.stringify({
          type: MessageType.CHAT,
          roomId: roomId,
          sender: username,
          content,
        }),
      });
    } else {
      console.warn("STOMP 클라이언트가 연결되지 않았습니다.");
    }
  };

  const handleKeyDown = (e) => {
    if (Platform.OS === "web") {
      // 한글 조합 중(isComposing)의 Enter 는 글자 확정이지 전송이 아니다
      if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent?.isComposing) {
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

  // 시스템 메시지 문구
  const systemText = (item) => {
    switch (item.type) {
      case MessageType.JOIN:
        return `${senderNameOf(item)}님이 입장했습니다.`;
      case MessageType.INVITE:
        return `${senderNameOf(item)}님이 ${recipientNameOf(item)}님을 초대했습니다.`;
      case MessageType.KICK:
        return `${senderNameOf(item)}님이 ${recipientNameOf(item)}님을 강퇴했습니다.`;
      case MessageType.LEAVE:
        return `${senderNameOf(item)}님이 퇴장했습니다.`;
      default:
        return "";
    }
  };

  // 날짜 구분선 · 연속 메시지 묶음(같은 사람이 같은 분에 보낸 메시지)을 계산한 목록
  const listItems = useMemo(() => {
    const sameGroup = (a, b) =>
      !!a && !!b &&
      a.type === MessageType.CHAT && b.type === MessageType.CHAT &&
      a.sender === b.sender &&
      minuteKey(a.insertDts) === minuteKey(b.insertDts);

    const result = [];
    let lastDayKey = null;
    messages.forEach((msg, idx) => {
      const date = parseDate(msg.insertDts);
      const dayKey = date ? date.toDateString() : null;
      if (dayKey && dayKey !== lastDayKey) {
        result.push({ kind: "date", id: `date-${dayKey}`, label: formatDay(date) });
        lastDayKey = dayKey;
      }
      if (msg.type !== MessageType.CHAT) {
        const text = systemText(msg);
        if (text) result.push({ kind: "system", id: `sys-${msg.id}`, text });
        return;
      }
      result.push({
        kind: "chat",
        id: msg.id,
        msg,
        isFirst: !sameGroup(messages[idx - 1], msg),
        isLast: !sameGroup(msg, messages[idx + 1]),
      });
    });
    return result;
  }, [messages]);

  const renderMessageItem = ({ item }) => {
    if (item.kind === "date") {
      return (
        <View style={localStyles.dateDivider}>
          <Text style={localStyles.dateDividerText}>{item.label}</Text>
        </View>
      );
    }
    if (item.kind === "system") {
      return (
        <View style={localStyles.systemMessage}>
          <Text style={localStyles.systemText}>{item.text}</Text>
        </View>
      );
    }

    const { msg, isFirst, isLast } = item;
    const isMyMessage = msg.sender === username;
    // 시간은 묶음의 마지막 말풍선에만 표시
    const time = isLast ? formatTime(msg.insertDts) : "";

    if (isMyMessage) {
      return (
        <View style={[localStyles.row, localStyles.rowMine, isFirst && localStyles.rowGroupStart]}>
          {!!time && <Text style={localStyles.timeText}>{time}</Text>}
          <View style={[localStyles.bubble, localStyles.myBubble]}>
            <Text style={localStyles.myMessageText}>{msg.content}</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={[localStyles.row, localStyles.rowOther, isFirst && localStyles.rowGroupStart]}>
        <View style={localStyles.avatarSlot}>
          {isFirst && (
            <View style={[localStyles.avatar, { backgroundColor: avatarColor(msg.sender) }]}>
              <Text style={localStyles.avatarText}>{initialOf(senderNameOf(msg))}</Text>
            </View>
          )}
        </View>
        <View style={localStyles.otherColumn}>
          {isFirst && (
            <Text style={localStyles.senderText} numberOfLines={1}>{senderNameOf(msg)}</Text>
          )}
          <View style={localStyles.otherBubbleRow}>
            <View style={[localStyles.bubble, localStyles.otherBubble]}>
              <Text style={localStyles.messageText}>{msg.content}</Text>
            </View>
            {!!time && <Text style={localStyles.timeText}>{time}</Text>}
          </View>
        </View>
      </View>
    );
  };

  // 🌟 뒤로가기 버튼 핸들러 🌟
  const handleGoBack = () => {
    // 채팅방 상세 화면에서 채팅 목록 (메인 탭)으로 돌아감
    // 'MainTabs' 내비게이터로 이동하면서 '채팅' 탭이 활성화되도록 함
    // React Navigation v7 의 navigate 는 기존 화면으로 돌아가지 않고 새로 쌓는다.
    // (그러면 채팅방 화면이 스택에 남아 소켓도 안 끊기고, 빈 방 정리도 안 된다) → popTo 로 닫는다.
    if (typeof navigation.popTo === "function") {
      navigation.popTo("BottomTab", { screen: "Chat" });
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("BottomTab", { screen: "Chat" });
    }
  };

  return (
    <KeyboardAvoidingView
      style={localStyles.screenContainer}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      {/* 헤더: 뒤로가기 · 방 이름(수정) · 초대 · 강퇴 */}
      <View style={localStyles.headerContainer}>
        <TouchableOpacity
          style={localStyles.headerIconButton}
          onPress={handleGoBack}
          accessibilityLabel="뒤로가기"
        >
          <Icon name="chevron-back" size={26} color={theme.colors.text} />
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
              maxLength={50}
            />
          ) : (
            <Text style={localStyles.headerText} numberOfLines={1}>
              {_roomName}
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
            accessibilityLabel={isEditingRoomName ? "방 이름 저장" : "방 이름 수정"}
          >
            <Icon
              name={isEditingRoomName ? "checkmark-circle" : "create-outline"}
              size={18}
              color={isEditingRoomName ? theme.colors.primary : theme.colors.textMuted}
            />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={localStyles.headerIconButton}
          onPress={inviteUser}
          accessibilityLabel="사용자 초대"
        >
          <Icon name="person-add-outline" size={22} color={theme.colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={localStyles.headerIconButton}
          onPress={kickUser}
          accessibilityLabel="사용자 강퇴"
        >
          <Icon name="person-remove-outline" size={22} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={listItems}
        renderItem={renderMessageItem}
        keyExtractor={(item) => item.id.toString()}
        style={localStyles.chatArea}
        contentContainerStyle={localStyles.chatContent}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={localStyles.emptyContainer}>
            <Icon name="chatbubbles-outline" size={44} color={theme.colors.textDisabled} />
            <Text style={localStyles.emptyText}>
              아직 대화가 없어요.{"\n"}첫 메시지를 보내보세요!
            </Text>
          </View>
        }
      />

      <View style={localStyles.inputContainer}>
        <TextInput
          style={localStyles.input}
          value={currentMessage}
          onChangeText={setCurrentMessage}
          placeholder="메시지를 입력하세요"
          placeholderTextColor={theme.colors.textDisabled}
          multiline
          numberOfLines={1} // 웹 textarea 기본 2줄 → 1줄에서 시작
          onKeyPress={handleKeyDown}
        />
        <TouchableOpacity
          style={[localStyles.sendButton, !canSend && localStyles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!canSend}
          accessibilityLabel="전송"
        >
          <Icon name="arrow-up" size={20} color={theme.colors.white} />
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
        ensureJoined={ensureJoined}
      />
    </KeyboardAvoidingView>
  );
}
