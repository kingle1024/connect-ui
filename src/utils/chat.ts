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
/**
 * 상대와의 1:1 채팅방을 찾고, 없으면 만든다. (모집 글·채팅방 참여자 프로필의 '대화하기' 공용)
 * 반환값의 roomId 로 "채팅방 상세" 에 들어가면 된다.
 */
export async function findOrCreateOneToOneRoom(
  currentUserId: string,
  targetUserId: string,
  targetDisplayName?: string
) {
  const rooms = await getOneToOneRoomsForUser(currentUserId);
  const existing = Array.isArray(rooms)
    ? rooms.find((room: any) => String(room.userId) === String(targetUserId))
    : null;
  if (existing) return existing;
  return createOneToOneRoom(currentUserId, targetUserId, targetDisplayName);
}

/** 회원끼리 친구 요청을 보낸다. 서버 오류 메시지가 있으면 그대로 던진다. */
export async function sendFriendRequest(currentUserId: string, targetUserId: string) {
  try {
    await axiosInstance.post(
      `/api/friends/${encodeURIComponent(currentUserId)}/friend-requests`,
      { receiverUserId: targetUserId }
    );
  } catch (err: any) {
    throw new Error(err?.response?.data?.message || "친구 요청 중 오류가 발생했습니다.");
  }
}

/** 회원의 친구 수 (게스트·실패 시 0) */
export async function getFriendCount(currentUserId?: string | null): Promise<number> {
  if (!currentUserId) return 0;
  try {
    const res = await axiosInstance.get(`/api/friends/${encodeURIComponent(currentUserId)}/friends`);
    return Array.isArray(res.data) ? res.data.length : 0;
  } catch {
    return 0;
  }
}
