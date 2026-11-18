import AsyncStorage from "@react-native-async-storage/async-storage";

// 서버가 비로그인 방문자에게 만들어 주는 게스트 계정의 아이디 접두사 (GuestService.GUEST_ID_PREFIX)
export const GUEST_ID_PREFIX = "guest_";

export const isGuestUserId = (userId?: string | null): boolean =>
  !!userId && userId.startsWith(GUEST_ID_PREFIX);

/**
 * 게스트 본인 확인 토큰.
 *
 * 기본은 서버가 심어주는 HttpOnly 쿠키다. 그런데 운영에서는 프론트(vercel)와 백엔드(cloudtype)가
 * 서로 다른 사이트라 Safari/iOS 는 그 쿠키를 막는다(ITP). 그래서 서버가 응답 본문으로도 같은 서명 토큰을 주고,
 * 앱은 그걸 자기 저장소(같은 사이트라 막히지 않음)에 두었다가 X-Guest-Token 헤더로 보낸다.
 */
const GUEST_TOKEN_STORAGE_KEY = "guestToken";
export const GUEST_TOKEN_HEADER = "X-Guest-Token";

export const getGuestToken = (): Promise<string | null> =>
  AsyncStorage.getItem(GUEST_TOKEN_STORAGE_KEY);

export const saveGuestToken = async (token?: string | null): Promise<void> => {
  if (token) {
    await AsyncStorage.setItem(GUEST_TOKEN_STORAGE_KEY, token);
  } else {
    await AsyncStorage.removeItem(GUEST_TOKEN_STORAGE_KEY);
  }
};
