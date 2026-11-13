import { useCallback, useEffect } from "react";
import { Platform } from "react-native";
import { NavigationContainerRefWithCurrent } from "@react-navigation/native";

// 웹(모바일 브라우저·홈 화면에 추가한 앱)에서 휴대폰 뒤로가기 버튼을 앱 안의 뒤로가기로 연결한다.
//
// NavigationContainer 에 linking 설정이 없어서 화면을 이동해도 브라우저 history 가 쌓이지 않는다.
// 그래서 상세 화면에서 휴대폰 뒤로가기를 누르면 이전 화면이 아니라 사이트 밖(이전 웹 페이지)으로 나갔다.
//
// 앱 안에서 뒤로 갈 곳이 있는 동안에는 history 에 표시용 항목 하나를 깔아 둔다.
// 휴대폰 뒤로가기가 그 항목을 꺼내면(popstate) 대신 navigation.goBack() 을 부르고,
// 아직 더 돌아갈 곳이 있으면 항목을 다시 깐다. 돌아갈 곳이 없으면 브라우저 기본 동작대로 둔다.
const GUARD_KEY = "__connectNavGuard";

const isGuardEntry = () =>
  typeof window !== "undefined" && window.history.state?.[GUARD_KEY] === true;

export function useWebBackButton(
  navigationRef: NavigationContainerRefWithCurrent<ReactNavigation.RootParamList>
) {
  const syncGuard = useCallback(() => {
    if (Platform.OS !== "web" || !navigationRef.isReady()) return;
    // 이미 표시용 항목 위에 있으면 또 쌓지 않는다 (앱 안 뒤로가기 버튼으로 돌아온 뒤 다시 들어가는 경우)
    if (navigationRef.canGoBack() && !isGuardEntry()) {
      window.history.pushState(
        { ...(window.history.state ?? {}), [GUARD_KEY]: true },
        ""
      );
    }
  }, [navigationRef]);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const onPopState = () => {
      if (!navigationRef.isReady() || !navigationRef.canGoBack()) return;
      navigationRef.goBack();
      // goBack 결과가 state 에 반영된 뒤 다시 확인한다
      setTimeout(syncGuard, 0);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [navigationRef, syncGuard]);

  // NavigationContainer 의 onReady / onStateChange 에 넘긴다
  return syncGuard;
}
