import AuthProvider from "@/components/auth/AuthProvider";
import InstallPromptBanner from "@/components/InstallPromptBanner";
import { DrawNavigation } from "@/navigation/DrawNavigation";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { NavigationContainer, useNavigationContainerRef } from "@react-navigation/native";
import { useWebBackButton } from "@/navigation/useWebBackButton";
import { consumeSharedPostId } from "@/utils/sharePost";
import { StatusBar } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

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
            </AuthProvider>
          </NavigationContainer>
        </ActionSheetProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
