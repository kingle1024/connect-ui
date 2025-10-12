import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather, Entypo } from "@expo/vector-icons";
import ConnectNavigation from "./ConnectNavigation";
import ChatRoomsListScreen from "@/screens/ChatScreen/ChatRoomListScreen";
import MyPageScreen from "@/screens/MyPageScreen/MyPageScreen";

const BottomTab = createBottomTabNavigator();

const BottomTabNavigation = () => {
  return (
    <BottomTab.Navigator
      screenOptions={{
        tabBarActiveTintColor: "tomato",
        tabBarInactiveTintColor: "gray",
      }}
    >
      <BottomTab.Screen
        name="Connect"
        component={ConnectNavigation}
        options={{
          headerShown: false,
          tabBarLabel: "모집",
          tabBarIcon: ({ focused, size }) => (
            <Feather
              name="clipboard"
              size={20}
              color={focused ? "tomato" : "gray"}
            />
          ),
        }}
      />
      <BottomTab.Screen
        name="Chat"
        component={ChatRoomsListScreen}
        options={{
          headerShown: false,
          tabBarLabel: "채팅",
          tabBarIcon: ({ focused, size }) => (
            <Entypo name="chat" size={20} color={focused ? "tomato" : "gray"} />
          ),
        }}
      />
    </BottomTab.Navigator>
  );
};

export default BottomTabNavigation;
