import React, { useContext } from "react";
import Alert from '@blazejkustra/react-native-alert';
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather, Entypo } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ConnectNavigation from "./ConnectNavigation";
import ChatNavigation from "./ChatNavigation";
import AuthContext from "@/components/auth/AuthContext";
import { useRootNavigation } from "@/hooks/useNavigation";
import FriendNavigation from "./FriendNavigation";
import theme from "@/modules/theme";

const BottomTab = createBottomTabNavigator();

const BottomTabNavigation = () => {
  const { user: me } = useContext(AuthContext);
  const rootNavigation = useRootNavigation();
  const insets = useSafeAreaInsets();

  return (
    <BottomTab.Navigator
      initialRouteName="Connect"
      // 뒤로가기 시 첫 탭(친구)이 아니라 시작 탭(모집)으로 돌아간다. 모집 탭에선 더 돌아갈 곳이 없다.
      backBehavior="initialRoute"
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          // 탭 항목은 아이콘 칸 28 + 항목 상하 패딩 10 + 라벨(11px) 약 14 = 52 가 필요하다.
          // 예전엔 높이 60 에 패딩 14 를 줘서 45 만 남아 라벨이 7px 로 눌려 잘렸다.
          // paddingBottom 을 직접 주면 라이브러리가 넣던 하단 안전영역도 사라지므로 직접 더한다.
          height: 62 + insets.bottom,
          paddingTop: 4,
          paddingBottom: 4 + insets.bottom,
        },
      }}
    >
      <BottomTab.Screen
        name="Friends"
        component={FriendNavigation}
        options={{
          headerShown: false,
          tabBarLabel: "친구",
          tabBarIcon: ({ focused, size }) => (
            <Feather
              name="users"
              size={20}
              color={focused ? theme.colors.primary : theme.colors.textMuted}
            />
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
                      rootNavigation.navigate("Signin", {
                        redirectTab: "Friends",
                      });
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
              color={focused ? theme.colors.primary : theme.colors.textMuted}
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
            <Entypo
              name="chat"
              size={20}
              color={focused ? theme.colors.primary : theme.colors.textMuted}
            />
          ),
        }}
        listeners={() => ({
          tabPress: (e) => {
            // 로그인하지 않아도 채팅할 수 있다. 채팅 목록 화면이 게스트(랜덤 닉네임)를 발급받는다.
          },
        })}
      />
    </BottomTab.Navigator>
  );
};

export default BottomTabNavigation;
