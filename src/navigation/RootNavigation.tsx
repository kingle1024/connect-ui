import { createNativeStackNavigator } from "@react-navigation/native-stack";
import BottomTabNavigation from "./BottomTabNavigation";
import EnterChatRoom from "@/screens/ChatScreen/EnterChatRoom";
import ConnectDetailScreen from "@/screens/ConnectScreen/ConnectDetailScreen";
import { TouchableOpacity } from "react-native";
import { DrawerActions } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import SigninScreen from "@/screens/SigninScreen/SigninScreen";
import MyPageScreen from "@/screens/MyPageScreen/MyPageScreen";

const Stack = createNativeStackNavigator();

export const RootNavigation = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen
      name="BottomTab"
      component={BottomTabNavigation}
      options={{ headerShown: false, headerTitle: "" }}
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
    />
    <Stack.Screen name="Signin" component={SigninScreen} />
    <Stack.Screen name="MyPage" component={MyPageScreen} />
    <Stack.Screen name="채팅방 상세" component={EnterChatRoom} />
  </Stack.Navigator>
);
