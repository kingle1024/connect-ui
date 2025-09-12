import { NavigationContainer } from "@react-navigation/native"; // 내비게이션 컨테이너
import { StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { RootNavigation } from "./src/navigation/RootNavigation.js";

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle="dark-content"
        />
        <RootNavigation />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
