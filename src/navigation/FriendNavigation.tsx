import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import FriendsListScreen from "@/screens/FriendScreen/FriendsListScreen";
import FriendProfileScreen from "@/screens/FriendScreen/FriendProfileScreen";

const Stack = createNativeStackNavigator();

const FriendNavigation = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="FriendsList"
        component={FriendsListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="FriendProfile"
        component={FriendProfileScreen}
        options={{ title: "프로필" }}
      />
    </Stack.Navigator>
  );
};

export default FriendNavigation;