import { createNativeStackNavigator } from "@react-navigation/native-stack";
import BottomTabNavigation from "./BottomTabNavigation";
import EnterChatRoom from "@/screens/ChatScreen/EnterChatRoom";
import ConnectDetailScreen from "@/screens/ConnectScreen/ConnectDetailScreen";

const Stack = createNativeStackNavigator();

export const RootNavigation = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="BottomTab"
        component={BottomTabNavigation}
        options={{ headerShown: false, headerTitle: "" }}
      ></Stack.Screen>
      {/* Tab 바깥 */}
      <Stack.Screen
        name="ConnectDetail"
        component={ConnectDetailScreen}
        options={{ headerShown: true, title: "상세" }}
      />
      <Stack.Screen name="채팅방 상세" component={EnterChatRoom}></Stack.Screen>
    </Stack.Navigator>
  );
};
