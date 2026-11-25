import AuthProvider from "@/components/auth/AuthProvider";
import InstallPromptBanner from "@/components/InstallPromptBanner";
import { DrawNavigation } from "@/navigation/DrawNavigation";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { NavigationContainer, StackActions, useNavigationContainerRef } from "@react-navigation/native";
import ChatNotifier from "@/components/ChatNotifier";
import { useWebBackButton } from "@/navigation/useWebBackButton";
import { consumeSharedPostId } from "@/utils/sharePost";
import { StatusBar } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { applyAlertTheme } from "@/modules/alertTheme";

// 웹 안내창(Alert.alert) 색·줄바꿈을 앱 테마에 맞춘다
applyAlertTheme();

export default function App() {
  const navigationRef = useNavigationContainerRef();
  const syncWebBackGuard = useWebBackButton(navigationRef);

  // 공유 링크(?post=ID)로 들어왔으면 목록 위에 그 모집글 상세를 연다 (뒤로가기 하면 목록)
  const onNavigationReady = () => {
    const sharedPostId = consumeSharedPostId();
    if (sharedPostId) {
      (navigationRef as any).navigate("ConnectDetail", { parentId: sharedPostId });
    }
    syncWebBackGuard();
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ActionSheetProvider>
          <NavigationContainer
            ref={navigationRef}
            onReady={onNavigationReady}
            onStateChange={syncWebBackGuard}
          >
            <StatusBar
              translucent
              backgroundColor="transparent"
              barStyle="dark-content"
            />
            <AuthProvider>
              <DrawNavigation />
              <InstallPromptBanner />
              <Toast />
              {/* 새 채팅 메시지 브라우저 알림 — 누르면 그 채팅방으로 (다른 채팅방 위에도 쌓이도록 push) */}
              <ChatNotifier
                openRoom={(params) => navigationRef.isReady() && navigationRef.dispatch(StackActions.push("채팅방 상세", params))}
              />
            </AuthProvider>
          </NavigationContainer>
        </ActionSheetProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
