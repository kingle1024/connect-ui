import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather, Entypo } from "@expo/vector-icons";
import ConnectNavigation from "./ConnectNavigation";
import ChatRoomsListScreen from "@/screens/ChatScreen/ChatRoomListScreen";
import MyPageScreen from "@/screens/MyPageScreen";

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
        name="모집"
        component={ConnectNavigation}
        options={{
          headerShown: false,
          tabBarIcon: () => <Feather name="clipboard" size={20} />,
        }}
      />
      <BottomTab.Screen
        name="채팅"
        component={ChatRoomsListScreen}
        options={{
          tabBarIcon: () => <Entypo name="chat" size={20} />,
        }}
      />
      <BottomTab.Screen
        name="마이페이지"
        component={MyPageScreen}
        options={{
          tabBarIcon: () => <Feather name="settings" size={20} />,
        }}
      />
    </BottomTab.Navigator>
  );
};

export default BottomTabNavigation;
