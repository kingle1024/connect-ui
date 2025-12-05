import AsyncStorage from "@react-native-async-storage/async-storage";
import axiosInstance from "@/utils/api";

async function getAuthToken() {
  const accessToken = await AsyncStorage.getItem("accessToken");
  const refreshToken = await AsyncStorage.getItem("refreshToken");
  // 토큰 없으면 null 반환. 서버 호출 없이 로컬로 방 생성 가능하게 함.
  return accessToken || refreshToken || null;
}

export async function getRoomsForUser(userId: string) {
  const token = await getAuthToken();
  if (!token) throw new Error("Token needed");

  // ChatRoomListScreen.js와 동일하게 쿼리 파라미터 방식 사용
  const res = await axiosInstance.get("/api/chat/rooms", {
    params: { userId },
    headers: { Authorization: `Bearer ${token}` },
  });

  return res.data;
}

export async function getOneToOneRoomsForUser(userId: string) {
  const token = await getAuthToken();
  if (!token) throw new Error("Token needed");

  // ChatRoomListScreen.js와 동일하게 쿼리 파라미터 방식 사용
  const res = await axiosInstance.get("/api/chat/one-to-one-rooms", {
    params: { userId },
    headers: { Authorization: `Bearer ${token}` },
  });

  return res.data;
}

export async function createOneToOneRoom(
  currentUserId: string,
  friendId: string,
  roomName?: string
) {
  // 토큰이 없어도 로컬 fallback을 반환하도록 허용
  const token = await getAuthToken();

  // 서버 POST 시도 (토큰이 있을 때만)
  if (token) {
    try {
      // 기본 후보 body: participants
      const body = { name: roomName ?? "", isGroup: false, participants: [currentUserId, friendId] };
      const res = await axiosInstance.post("/api/chat/rooms", body, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res?.status === 200 || res?.status === 201) {
        return res.data;
      }

      // 서버가 기존 방 정보를 반환하는 케이스(예: 409에 body 포함)도 처리
      if (res?.data?.room) return res.data.room;
    } catch (err: any) {
      const status = err?.response?.status;
      // 서버에 POST 엔드포인트가 없다거나 405/404인 경우 로컬 생성으로 fallback
      if (status !== 404 && status !== 405) {
        // 401/403 등 인증 문제나 기타 에러인 경우 로깅만 하고 로컬 fallback 진행
        console.warn("createOneToOneRoom server call failed, falling back to local room:", err?.message || err);
      }
      // fallback: 계속해서 로컬 방 생성
    }
  } else {
    // 토큰이 없다면 서버 호출을 시도하지 않고 로컬로 방 생성
    console.info("No token found - creating local chat room fallback.");
  }

  // 로컬 fallback: ChatRoomListScreen과 동일하게 임시 room id/name 생성해서 반환
  const id = `${currentUserId}_${friendId}_${Date.now()}`;
  const name = roomName || `새 채팅방(${Date.now().toString().slice(-4)})`;
  return {
    id,
    name,
    isGroup: false,
    participants: [currentUserId, friendId],
  };
}