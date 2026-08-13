import AsyncStorage from "@react-native-async-storage/async-storage";

// 로그인하지 않고 개선/버그 요청을 보낸 사람을 알아보기 위한 단말 키.
// 서버는 이 키로 "내 요청 내역"을 찾아주므로, 캐시에 남아 있는 한
// 로그인하지 않아도 나중에 답변을 다시 확인할 수 있다.
const GUEST_KEY_STORAGE_KEY = "inquiryGuestKey";
// 답변받을 메일 주소도 기억해두고 다음 접수 때 미리 채워준다.
const GUEST_EMAIL_STORAGE_KEY = "inquiryGuestEmail";

// 서버가 받아들이는 형식: [A-Za-z0-9_-] 8~64자
const randomGuestKey = (): string => {
  const globalCrypto = (globalThis as any)?.crypto;
  if (typeof globalCrypto?.randomUUID === "function") {
    return globalCrypto.randomUUID();
  }
  // randomUUID 가 없는 환경(구형 브라우저/일부 네이티브)용 대체. 32자리 hex.
  let key = "";
  for (let i = 0; i < 32; i += 1) {
    key += Math.floor(Math.random() * 16).toString(16);
  }
  return key;
};

/** 이 단말의 게스트 키를 돌려준다. 없으면 만들어서 저장한 뒤 돌려준다. */
export const getOrCreateGuestKey = async (): Promise<string> => {
  const stored = await AsyncStorage.getItem(GUEST_KEY_STORAGE_KEY);
  if (stored) return stored;

  const created = randomGuestKey();
  await AsyncStorage.setItem(GUEST_KEY_STORAGE_KEY, created);
  return created;
};

/** 저장된 게스트 키. 아직 요청을 보낸 적이 없으면 null (이때는 굳이 새로 만들지 않는다). */
export const getGuestKey = (): Promise<string | null> =>
  AsyncStorage.getItem(GUEST_KEY_STORAGE_KEY);

export const getGuestEmail = (): Promise<string | null> =>
  AsyncStorage.getItem(GUEST_EMAIL_STORAGE_KEY);

export const saveGuestEmail = async (email: string): Promise<void> => {
  if (email) {
    await AsyncStorage.setItem(GUEST_EMAIL_STORAGE_KEY, email);
  } else {
    await AsyncStorage.removeItem(GUEST_EMAIL_STORAGE_KEY);
  }
};
