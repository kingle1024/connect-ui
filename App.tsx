import AuthProvider from "@/components/auth/AuthProvider";
import { DrawNavigation } from "@/navigation/DrawNavigation";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import * as WebBrowser from "expo-web-browser";

// 웹에서 카카오 로그인 팝업이 리다이렉트로 돌아왔을 때 팝업을 자동으로 닫고
// 결과(토큰이 담긴 URL)를 openAuthSessionAsync 호출부로 전달한다.
// 모듈 로드 시점에 호출해야 팝업 컨텍스트에서 즉시 세션이 완료된다.
WebBrowser.maybeCompleteAuthSession();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ActionSheetProvider>
          <NavigationContainer>
            <StatusBar
              translucent
              backgroundColor="transparent"
              barStyle="dark-content"
            />
            <AuthProvider>
              <DrawNavigation />
              <Toast />
            </AuthProvider>
          </NavigationContainer>
        </ActionSheetProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
