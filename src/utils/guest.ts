// 서버가 비로그인 방문자에게 만들어 주는 게스트 계정의 아이디 접두사 (GuestService.GUEST_ID_PREFIX)
export const GUEST_ID_PREFIX = "guest_";

export const isGuestUserId = (userId?: string | null): boolean =>
  !!userId && userId.startsWith(GUEST_ID_PREFIX);
