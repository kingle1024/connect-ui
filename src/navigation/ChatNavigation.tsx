import { DrawerActions } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import ChatRoomsListScreen from "@/screens/chatScreen/ChatRoomListScreen";

const Stack = createNativeStackNavigator();

const ChatNavigation = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="ChatList"
        options={({ navigation }) => ({
          headerShown: true,
          title: "채팅",
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
              style={{
                padding: 5,
              }}
            >
              <Feather name="menu" size={24} color="black" />
            </TouchableOpacity>
          ),
        })}
        component={ChatRoomsListScreen}
      />
    </Stack.Navigator>
  );
};

export default ChatNavigation;
