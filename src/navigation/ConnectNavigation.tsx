import ConnectScreen from "@/screens/ConnectScreen/ConnectScreen";
import { DrawerActions } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";

const Stack = createNativeStackNavigator();

const ConnectNavigation = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="ConnectList"
        options={({ navigation }) => ({
          headerShown: true,
          title: "모집",
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
        component={ConnectScreen}
      />
    </Stack.Navigator>
  );
};

export default ConnectNavigation;
