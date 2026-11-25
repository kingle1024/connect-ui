// 지금 화면에 열려 있는 채팅방 ID. 새 메시지 알림을 그 방에서는 띄우지 않기 위해 쓴다.
let activeRoomId: string | null = null;

export const setActiveChatRoom = (roomId: string | null) => {
  activeRoomId = roomId;
};

export const getActiveChatRoom = () => activeRoomId;
