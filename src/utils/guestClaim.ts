import AsyncStorage from "@react-native-async-storage/async-storage";
import apiClient from "@/utils/api";
import { GUEST_TOKEN_HEADER, getGuestToken, saveGuestToken } from "@/utils/guest";

/**
 * 게스트로 쓴 기록(글·댓글·채팅방)을 로그인한 회원 계정으로 가져오기.
 *
 * 로그인 상태에서는 공용 클라이언트가 게스트 토큰 헤더를 붙이지 않으므로(회원 요청이라서)
 * 여기서는 이 기기의 게스트 토큰을 직접 붙인다. 쿠키가 실리는 브라우저면 쿠키로도 확인된다.
 */
export type GuestClaimSummary = {
  available: boolean;
  guestUserId?: string;
  guestName?: string;
  boardCount: number;
  commentCount: number;
  chatRoomCount: number;
};

const guestHeaders = async () => {
  const token = await getGuestToken();
  return token ? { [GUEST_TOKEN_HEADER]: token } : {};
};

/** 가져올 수 있는 게스트 기록 요약. 실패하면 null (확인 창/버튼을 띄우지 않는다). */
export const fetchGuestClaimSummary = async (): Promise<GuestClaimSummary | null> => {
  try {
    const res = await apiClient.get<GuestClaimSummary>("/api/account/guest-claim", {
      headers: await guestHeaders(),
    });
    return res.data;
  } catch {
    return null;
  }
};

/** 실제로 가져온다. 성공하면 게스트는 서버에서 비활성화되므로 이 기기의 게스트 토큰도 지운다. */
export const claimGuestRecords = async (): Promise<GuestClaimSummary> => {
  const res = await apiClient.post<GuestClaimSummary>("/api/account/guest-claim", null, {
    headers: await guestHeaders(),
  });
  await saveGuestToken(null);
  return res.data;
};

/** "글 2개, 댓글 1개, 채팅방 1개" */
export const describeGuestRecords = (s: GuestClaimSummary): string =>
  [
    s.boardCount ? `글 ${s.boardCount}개` : null,
    s.commentCount ? `댓글 ${s.commentCount}개` : null,
    s.chatRoomCount ? `채팅방 ${s.chatRoomCount}개` : null,
  ]
    .filter(Boolean)
    .join(", ");

// 로그인 직후 확인 창에서 "나중에"를 누른 조합(회원 + 게스트)을 기억해 매번 묻지 않는다.
// 마이페이지의 버튼으로는 언제든 다시 가져올 수 있다.
const declinedKey = (memberUserId: string, guestUserId: string) =>
  `guestClaimDeclined:${memberUserId}:${guestUserId}`;

export const isGuestClaimDeclined = async (memberUserId: string, guestUserId: string) =>
  (await AsyncStorage.getItem(declinedKey(memberUserId, guestUserId))) === "1";

export const markGuestClaimDeclined = (memberUserId: string, guestUserId: string) =>
  AsyncStorage.setItem(declinedKey(memberUserId, guestUserId), "1");

export const GUEST_CLAIM_MENU_LABEL = "게스트 기록 가져오기";
