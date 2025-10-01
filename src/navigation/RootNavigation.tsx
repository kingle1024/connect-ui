import { createNativeStackNavigator } from "@react-navigation/native-stack";
import BottomTabNavigation from "./BottomTabNavigation";
import EnterChatRoom from "@/screens/ChatScreen/EnterChatRoom";
import ConnectDetailScreen from "@/screens/ConnectScreen/ConnectDetailScreen";
import { TouchableOpacity } from "react-native";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import SigninScreen from "@/screens/SigninScreen/SigninScreen";
import MyPageScreen from "@/screens/MyPageScreen/MyPageScreen";
import SignupScreen from "@/screens/SignUpScreen/SignupScreen";

const Stack = createNativeStackNavigator();

export const RootNavigation = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="BottomTab"
        component={BottomTabNavigation}
        options={{ headerShown: false, headerTitle: "" }}
        listeners={({ navigation }) => ({
          focus: () => {
            navigation.getParent()?.setOptions({ swipeEnabled: true });
          },
        })}
      />

      {/* Tab 바깥 */}
      <Stack.Screen
        name="ConnectDetail"
        component={ConnectDetailScreen}
        options={({ navigation }) => ({
          headerShown: true,
          title: "상세",
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
        listeners={({ navigation }) => ({
          focus: () => {
            navigation.getParent()?.setOptions({ swipeEnabled: true });
          },
        })}
      />
      <Stack.Screen
        name="Signin"
        component={SigninScreen}
        listeners={({ navigation }) => ({
          focus: () => {
            navigation.getParent()?.setOptions({ swipeEnabled: false });
          },
        })}
      />
      <Stack.Screen
        name="Signup"
        component={SignupScreen}
        listeners={({ navigation }) => ({
          focus: () => {
            navigation.getParent()?.setOptions({ swipeEnabled: false });
          },
        })}
      />
      <Stack.Screen name="MyPage" component={MyPageScreen} />
      <Stack.Screen name="채팅방 상세" component={EnterChatRoom} />
    </Stack.Navigator>
  );
};
