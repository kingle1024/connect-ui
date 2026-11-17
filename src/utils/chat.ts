import axiosInstance from "@/utils/api";

// 인증 헤더는 axiosInstance 가 붙인다. (회원은 Access Token, 게스트는 쿠키)
// 채팅은 로그인하지 않은 게스트도 쓸 수 있으므로 토큰이 없다고 막지 않는다.

export async function getRoomsForUser(userId: string) {
  // ChatRoomListScreen.js와 동일하게 쿼리 파라미터 방식 사용
  const res = await axiosInstance.get("/api/chat/rooms", {
    params: { userId },
  });

  return res.data;
}

export async function getOneToOneRoomsForUser(userId: string) {
  // ChatRoomListScreen.js와 동일하게 쿼리 파라미터 방식 사용
  const res = await axiosInstance.get("/api/chat/one-to-one-rooms", {
    params: { userId },
  });

  return res.data;
}

export async function createOneToOneRoom(
  currentUserId: string,
  friendId: string,
  roomName?: string
) {
  const id = `${currentUserId}_${friendId}_${Date.now()}`;

  try {
    const res = await axiosInstance.post("/api/chat/rooms", {
      roomId: id ?? "",
      userId: currentUserId + '|' + friendId,
      roomType: "ONE_TO_ONE"
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
      throw new Error(`createOneToOneRoom server call failed: ${err?.message || err}`);
    }
    // fallback: 계속해서 로컬 방 생성
  }

  // 로컬 fallback: ChatRoomListScreen과 동일하게 임시 room id/name 생성해서 반환
  
  const name = roomName || `새 채팅방(${Date.now().toString().slice(-4)})`;
  return {
    id,
    name,
    isGroup: false,
    participants: [currentUserId, friendId],
  };
}