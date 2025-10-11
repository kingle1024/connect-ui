import { TypeRootStackNavigationParams } from "@/types";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

export const useRootNavigation = <
  RouteName extends keyof TypeRootStackNavigationParams
>() =>
  useNavigation<
    NativeStackNavigationProp<TypeRootStackNavigationParams, RouteName>
  >();

export const useRootRoute = <
  RouteName extends keyof TypeRootStackNavigationParams
>() => useRoute<RouteProp<TypeRootStackNavigationParams, RouteName>>();
