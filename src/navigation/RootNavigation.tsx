import { createNativeStackNavigator } from "@react-navigation/native-stack";
import BottomTabNavigation from "./BottomTabNavigation";
import EnterChatRoom from "@/screens/ChatScreen/EnterChatRoom";

const Stack = createNativeStackNavigator();

export const RootNavigation = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="BottomTab"
        component={BottomTabNavigation}
      ></Stack.Screen>
      <Stack.Screen name="채팅방 상세" component={EnterChatRoom}></Stack.Screen>
    </Stack.Navigator>
  );
};
