import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";

/** 크롬(안드로이드)에서 설치 가능할 때 발생하는 이벤트 */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/** 'native' = 브라우저 설치 프롬프트 사용, 'ios' = 공유 메뉴 안내 필요 */
export type InstallMode = "native" | "ios";

const DISMISSED_KEY = "@connect/install-prompt-dismissed-at";
/** 닫기를 누르면 이 기간 동안 다시 노출하지 않는다 */
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000;
const MOBILE_MAX_WIDTH = 768;

const isWeb = Platform.OS === "web" && typeof window !== "undefined";

const getDeferredPrompt = () =>
  (window as any).__deferredInstallPrompt as BeforeInstallPromptEvent | undefined;

/** 이미 홈 화면(앱)에서 실행 중인지 */
const isStandalone = () =>
  window.matchMedia?.("(display-mode: standalone)").matches === true ||
  (window.navigator as any).standalone === true;

const isIos = () => {
  const ua = window.navigator.userAgent;
  // iPadOS 13+ 는 데스크톱 사파리로 위장하므로 터치 지원으로 함께 판별한다.
  return (
    /iPhone|iPad|iPod/.test(ua) ||
    (/Macintosh/.test(ua) && window.navigator.maxTouchPoints > 1)
  );
};

const isMobile = () =>
  /Android|iPhone|iPad|iPod|Mobile/i.test(window.navigator.userAgent) ||
  (window.navigator.maxTouchPoints > 0 && window.innerWidth <= MOBILE_MAX_WIDTH);

const isRecentlyDismissed = () => {
  try {
    const dismissedAt = Number(window.localStorage.getItem(DISMISSED_KEY));
    return !!dismissedAt && Date.now() - dismissedAt < DISMISS_DURATION;
  } catch {
    // 사파리 프라이빗 모드 등에서 localStorage 접근이 막힐 수 있다.
    return false;
  }
};

/**
 * 모바일 웹에서 "홈 화면에 앱 추가" 안내를 띄울지 판단한다.
 *
 * - 안드로이드/크롬: beforeinstallprompt 를 받아 설치 프롬프트를 직접 띄운다.
 * - iOS: 설치 API가 없어 공유 메뉴 사용법을 안내한다.
 */
export const useInstallPrompt = () => {
  const [mode, setMode] = useState<InstallMode | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!isWeb) return;
    if (!isMobile() || isStandalone() || isRecentlyDismissed()) return;

    const syncMode = () => {
      if (getDeferredPrompt()) {
        setMode("native");
      } else if (isIos()) {
        setMode("ios");
      }
    };

    syncMode();

    const onInstalled = () => {
      (window as any).__deferredInstallPrompt = undefined;
      setMode(null);
    };

    // index.html 에서 이벤트를 먼저 받았을 수도, 마운트 이후에 받을 수도 있다.
    window.addEventListener("deferredinstallpromptchange", syncMode);
    window.addEventListener("beforeinstallprompt", syncMode);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("deferredinstallpromptchange", syncMode);
      window.removeEventListener("beforeinstallprompt", syncMode);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = useCallback(() => {
    try {
      window.localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    } catch {
      // 저장에 실패해도 이번 세션에서는 닫힌 상태로 둔다.
    }
    setDismissed(true);
  }, []);

  /** 브라우저 설치 프롬프트를 띄운다. 설치/거절 여부와 무관하게 배너는 닫는다. */
  const install = useCallback(async () => {
    const deferredPrompt = getDeferredPrompt();
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    (window as any).__deferredInstallPrompt = undefined;

    if (outcome === "accepted") {
      setMode(null);
    } else {
      dismiss();
    }
  }, [dismiss]);

  return {
    visible: mode !== null && !dismissed,
    mode,
    install,
    dismiss,
  };
};
