import AuthProvider from "@/components/auth/AuthProvider";
import InstallPromptBanner from "@/components/InstallPromptBanner";
import { DrawNavigation } from "@/navigation/DrawNavigation";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { NavigationContainer, useNavigationContainerRef } from "@react-navigation/native";
import { useWebBackButton } from "@/navigation/useWebBackButton";
import { StatusBar } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

export default function App() {
  const navigationRef = useNavigationContainerRef();
  const syncWebBackGuard = useWebBackButton(navigationRef);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ActionSheetProvider>
          <NavigationContainer
            ref={navigationRef}
            onReady={syncWebBackGuard}
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
