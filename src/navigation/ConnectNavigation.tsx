import ConnectScreen from "@/screens/ConnectScreen/ConnectScreen";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

const Stack = createNativeStackNavigator();

const ConnectNavigation = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="ConnectList"
        options={{ headerShown: true, title: "모집" }}
        component={ConnectScreen}
      />
    </Stack.Navigator>
  );
};

export default ConnectNavigation;
