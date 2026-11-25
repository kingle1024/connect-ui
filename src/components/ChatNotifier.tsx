import { useContext, useEffect, useRef } from "react";
import { Platform } from "react-native";
import Constants from "expo-constants";
import Toast from "react-native-toast-message";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import AuthContext from "@/components/auth/AuthContext";
import { getActiveChatRoom } from "@/modules/activeChatRoom";

/**
 * 새 채팅 메시지 알림 (웹).
 *
 * 서버가 방 멤버에게 보내는 /topic/notify/{userId} 를 듣고
 *  - 브라우저가 뒤에 있거나 다른 탭이면 → 브라우저 알림
 *  - 앱을 보고 있지만 다른 화면이면 → 화면 위 토스트
 *  - 그 채팅방을 보고 있으면 → 아무것도 안 띄운다
 * 알림을 누르면 그 채팅방으로 간다.
 *
 * 브라우저 알림 권한은 처음 화면을 누를 때 한 번 묻는다 (사파리는 사용자 동작 없이 물을 수 없다).
 */
type NotifyPayload = {
  roomId: string;
  roomName?: string | null;
  roomType?: string | null;
  memberCount?: number;
  messageId?: string;
  sender: string;
  senderName?: string;
  content: string;
};

type Props = {
  // 알림을 눌렀을 때 채팅방으로 이동
  openRoom: (params: { username: string; roomId: string; roomName: string }) => void;
};

const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL || "";
const ICON = "/icons/icon-192.png";

const notificationSupported = () =>
  Platform.OS === "web" && typeof window !== "undefined" && "Notification" in window;

export default function ChatNotifier({ openRoom }: Props) {
  const { user, guest } = useContext(AuthContext);
  const myId = user?.userId ?? guest?.userId ?? null;
  const openRoomRef = useRef(openRoom);
  openRoomRef.current = openRoom;

  // 처음 화면을 누를 때 브라우저 알림 권한을 묻는다
  useEffect(() => {
    if (!notificationSupported() || !myId) return;
    if (Notification.permission !== "default") return;
    const ask = () => {
      document.removeEventListener("click", ask, true);
      Notification.requestPermission().catch(() => {});
    };
    document.addEventListener("click", ask, true);
    return () => document.removeEventListener("click", ask, true);
  }, [myId]);

  useEffect(() => {
    if (Platform.OS !== "web" || !myId || !API_BASE_URL) return;

    const show = (p: NotifyPayload) => {
      const visible = document.visibilityState === "visible" && document.hasFocus();
      if (visible && getActiveChatRoom() === p.roomId) return;

      const group = (p.memberCount ?? 2) > 2;
      const sender = p.senderName || p.sender;
      const title = group && p.roomName ? p.roomName : sender;
      const body = group ? `${sender}: ${p.content}` : p.content;
      const go = () =>
        openRoomRef.current({ username: myId, roomId: p.roomId, roomName: (group && p.roomName) || sender });

      if (visible) {
        Toast.show({ type: "info", text1: title, text2: body, onPress: () => { Toast.hide(); go(); } });
        return;
      }
      if (notificationSupported() && Notification.permission === "granted") {
        try {
          const n = new Notification(title, { body, tag: p.roomId, icon: ICON });
          n.onclick = () => {
            window.focus();
            go();
            n.close();
          };
        } catch (e) {
          // 일부 모바일 브라우저는 페이지에서 new Notification 을 막는다
          console.warn("브라우저 알림 실패", e);
        }
      }
    };

    const client = new Client({
      webSocketFactory: () => new SockJS(`${API_BASE_URL}/ws-chat`),
      reconnectDelay: 5000,
      heartbeatIncoming: 0,
      heartbeatOutgoing: 20000,
      debug: () => {},
      onConnect: () => {
        client.subscribe(`/topic/notify/${myId}`, (message) => {
          try {
            show(JSON.parse(message.body));
          } catch (e) {
            console.warn("새 메시지 알림 처리 실패", e);
          }
        });
      },
    });
    client.activate();
    return () => {
      client.deactivate();
    };
  }, [myId]);

  return null;
}
