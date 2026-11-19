import { Platform, Share } from "react-native";

/** 앱(네이티브)에서 공유할 때 쓰는 웹 주소. 웹에서는 지금 열려 있는 주소(origin)를 쓴다. */
const WEB_ORIGIN = "https://connect-with.vercel.app";

/** 공유 링크에 붙는 쿼리 이름. 앱 시작 시 이 값을 읽어 해당 모집글을 연다 (useSharedPostLink). */
export const SHARED_POST_PARAM = "post";

export const buildPostShareUrl = (postId: number) => {
  const origin =
    Platform.OS === "web" && typeof window !== "undefined"
      ? window.location.origin
      : WEB_ORIGIN;
  return `${origin}/?${SHARED_POST_PARAM}=${postId}`;
};

export type ShareResult = "shared" | "copied" | "cancelled" | "failed";

/**
 * 모집글 링크를 공유한다.
 * - 모바일 브라우저/앱: 시스템 공유 시트 (카카오톡 등으로 바로 보낼 수 있다)
 * - 공유 시트가 없는 데스크톱 브라우저: 링크를 클립보드에 복사
 */
export const sharePost = async (post: { id: number; title: string }): Promise<ShareResult> => {
  const url = buildPostShareUrl(post.id);
  const text = `[같이타] ${post.title}`;

  if (Platform.OS !== "web") {
    try {
      const result = await Share.share({ message: `${text}\n${url}`, url, title: post.title });
      return result.action === Share.dismissedAction ? "cancelled" : "shared";
    } catch {
      return "failed";
    }
  }

  const nav = typeof navigator !== "undefined" ? (navigator as any) : undefined;
  if (nav?.share) {
    try {
      await nav.share({ title: post.title, text, url });
      return "shared";
    } catch (error: any) {
      // 사용자가 공유 시트를 닫은 경우
      if (error?.name === "AbortError") return "cancelled";
      // 그 밖의 실패는 복사로 대신한다
    }
  }

  try {
    await nav?.clipboard?.writeText(url);
    return "copied";
  } catch {
    return "failed";
  }
};

/** 앱이 공유 링크(?post=ID)로 열렸으면 그 ID를 돌려주고, 주소창에서 파라미터는 지운다. */
export const consumeSharedPostId = (): number | null => {
  if (Platform.OS !== "web" || typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const raw = params.get(SHARED_POST_PARAM);
  if (!raw) return null;

  params.delete(SHARED_POST_PARAM);
  const query = params.toString();
  window.history.replaceState(
    window.history.state,
    "",
    `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`
  );

  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
};
