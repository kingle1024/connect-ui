import { createDrawerNavigator } from "@react-navigation/drawer";
import { RootNavigation } from "./RootNavigation";
import DrawerContent from "@/components/drawer/DrawerContent";

const Drawer = createDrawerNavigator();

export const DrawNavigation = () => (
  <Drawer.Navigator
    drawerContent={(props) => <DrawerContent {...props} />}
    screenOptions={{
      drawerPosition: "right",
      drawerType: "slide",
      headerShown: false,
    }}
  >
    <Drawer.Screen
      name="메인"
      component={RootNavigation}
      options={{
        headerShown: false,
        drawerItemStyle: { display: "none" },
      }}
    />
  </Drawer.Navigator>
);
