import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ConnectScreen from "../screens/connectScreen/ConnectScreen.js";
import ConnectDetailScreen from "../screens/connectScreen/ConnectDetailScreen.js";

const Stack = createNativeStackNavigator();

const ConnectNavigation = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="ConnectList"
        options={{ headerShown: true, title: "모집" }}
        component={ConnectScreen}
      />
      <Stack.Screen
        name="ConnectDetail"
        options={{ headerShown: true, title: "같이타" }}
        component={ConnectDetailScreen}
      />
    </Stack.Navigator>
  );
};

export default ConnectNavigation;
