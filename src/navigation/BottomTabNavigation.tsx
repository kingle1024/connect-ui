import React, { useContext } from "react";
import Alert from '@blazejkustra/react-native-alert';
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather, Entypo } from "@expo/vector-icons";
import ConnectNavigation from "./ConnectNavigation";
import ChatNavigation from "./ChatNavigation";
import AuthContext from "@/components/auth/AuthContext";
import { useRootNavigation } from "@/hooks/useNavigation";
import FriendNavigation from "./FriendNavigation";

const BottomTab = createBottomTabNavigator();

const BottomTabNavigation = () => {
  const { user: me } = useContext(AuthContext);
  const rootNavigation = useRootNavigation(); 

  return (
    <BottomTab.Navigator
      screenOptions={{
        tabBarActiveTintColor: "tomato",
        tabBarInactiveTintColor: "gray",
      }}
    >
      <BottomTab.Screen
        name="Friends"
        component={FriendNavigation}
        options={{
          headerShown: false,
          tabBarLabel: "친구",
          tabBarIcon: ({ focused, size }) => (
            <Feather name="users" size={20} color={focused ? "tomato" : "gray"} />
          ),
        }}
        listeners={() => ({
          tabPress: (e) => {
            // 로그인 상태 확인
            if (!me) {
              e.preventDefault();
              Alert.alert(
                "로그인이 필요합니다.",
                "친구 목록을 보려면 로그인이 필요합니다.",
                [
                  {
                    text: "로그인",
                    onPress: () => {
                      rootNavigation.navigate("Signin");
                    },
                  },
                  { text: "닫기" },
                ]
              );
            }
          },
        })}
      />
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
        component={ChatNavigation}
        options={{
          headerShown: false,
          tabBarLabel: "채팅",
          tabBarIcon: ({ focused, size }) => (
            <Entypo name="chat" size={20} color={focused ? "tomato" : "gray"} />
          ),
        }}
        listeners={() => ({
          tabPress: (e) => {
            // 로그인 상태 확인
            if (!me) {
              e.preventDefault(); // <--- 이게 핵심! 탭 네비게이션을 멈춥니다.
              Alert.alert(
                "로그인이 필요합니다.",
                "채팅을 이용하려면 로그인이 필요합니다.",
                [
                  {
                    text: "로그인",
                    onPress: () => {
                      rootNavigation.navigate("Signin");
                    },
                  },
                  { text: "닫기" },
                ]
              );
            }
          },
        })}
      />
    </BottomTab.Navigator>
  );
};

export default BottomTabNavigation;
