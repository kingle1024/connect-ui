import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
  DrawerItem,
} from "@react-navigation/drawer";
import { Text, View, StyleSheet, TouchableOpacity } from "react-native";
import {
  Feather,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { useCallback, useContext } from "react";
import { useRootNavigation } from "@/hooks/useNavigation";
import AuthContext from "../auth/AuthContext";
import theme from "@/modules/theme";

const DrawerContent = (props: DrawerContentComponentProps) => {
  const navigation = useRootNavigation<
    "Signin" | "MyPage" | "Meal" | "Inquiry" | "Help"
  >();
  const { user: me, signout } = useContext(AuthContext);

  const onPressBottomButton = useCallback(() => {
    if (me) {
      signout();
    } else {
      navigation.navigate("Signin");
    }
  }, [me, signout, navigation]);

  // 설정 화면은 없어졌고, 프로필/더존 이메일 인증은 마이페이지에서 처리한다.
  const onPressMyPage = useCallback(() => {
    props.navigation.closeDrawer();
    if (me) {
      navigation.navigate("MyPage");
    } else {
      navigation.navigate("Signin");
    }
  }, [me, navigation, props.navigation]);

  // 오늘 식단은 사내 구내식당 안내라 로그인 없이도 볼 수 있게 둔다.
  const onPressMeal = useCallback(() => {
    props.navigation.closeDrawer();
    navigation.navigate("Meal");
  }, [navigation, props.navigation]);

  // 예전에는 mailto 로 메일 앱을 열었지만, 이제는 앱 안에서 접수하고 답변까지 확인한다.
  // 불편을 겪은 사람을 로그인부터 시키면 그냥 나가버리므로 로그인 없이도 보낼 수 있게 둔다.
  const onPressFeedback = useCallback(() => {
    props.navigation.closeDrawer();
    navigation.navigate("Inquiry");
  }, [navigation, props.navigation]);

  // 도움말은 안내 화면이라 로그인 없이도 볼 수 있게 둔다.
  const onPressHelp = useCallback(() => {
    props.navigation.closeDrawer();
    navigation.navigate("Help");
  }, [navigation, props.navigation]);

  return (
    <DrawerContentScrollView contentContainerStyle={styles.container}>
      <View style={styles.profileSection}>
        <View style={styles.profileImageContainer}>
          <MaterialIcons name="person" size={44} color={theme.colors.primary} />
        </View>
        {me ? (
          <View style={styles.nameRow}>
            <Text style={styles.userName}>{me.name || me.userId}</Text>
            {me.verified ? (
              <MaterialIcons
                name="verified"
                size={18}
                color={theme.colors.info}
                style={styles.verifiedIcon}
              />
            ) : null}
          </View>
        ) : (
          <Text style={styles.userName}>로그인이 필요합니다.</Text>
        )}
        <Text style={styles.userEmail}>
          {me ? me.userId : "로그인하여 모든 기능을 이용해보세요."}
        </Text>
      </View>

      {/* 구분선 */}
      <View style={styles.divider} />

      {/* 메뉴 항목들 */}
      <View style={styles.menuSection}>
        {/* 추가 메뉴 항목들 */}
        <DrawerItem
          label="오늘 식단"
          onPress={onPressMeal}
          icon={({ color, size }) => (
            <MaterialIcons name="restaurant" color={theme.colors.textSecondary} size={size} />
          )}
          labelStyle={styles.menuLabel}
        />

        <DrawerItem
          label="개선/버그 요청"
          onPress={onPressFeedback}
          icon={({ color, size }) => (
            <MaterialIcons name="bug-report" color={theme.colors.textSecondary} size={size} />
          )}
          labelStyle={styles.menuLabel}
        />

        <DrawerItem
          label="도움말"
          onPress={onPressHelp}
          icon={({ color, size }) => (
            <Feather name="help-circle" color={theme.colors.textSecondary} size={size} />
          )}
          labelStyle={styles.menuLabel}
        />

        <DrawerItem
          label="마이페이지"
          onPress={onPressMyPage}
          icon={({ color, size }) => (
            <MaterialCommunityIcons name="account" color={theme.colors.textSecondary} size={size} />
          )}
          labelStyle={styles.menuLabel}
        />
      </View>

      {/* 하단 로그아웃 버튼 */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={styles.bottomButton}
          onPress={onPressBottomButton}
        >
          <Feather name="log-out" size={20} color={theme.colors.primary} />
          <Text style={styles.bottomText}>{me ? "로그아웃" : "로그인"}</Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  profileSection: {
    alignItems: "center",
    padding: 20,
    marginBottom: 10,
  },
  profileImageContainer: {
    marginBottom: 14,
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primaryTint,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  userName: {
    fontSize: 17,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: 4,
  },
  verifiedIcon: {
    marginLeft: 4,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.divider,
    marginHorizontal: 20,
    marginBottom: 10,
  },
  menuSection: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 15,
    color: theme.colors.text,
    fontWeight: "500",
  },
  bottomSection: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  bottomButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.primaryTint,
    borderRadius: theme.radius.md,
  },
  bottomText: {
    marginLeft: 10,
    fontSize: 15,
    color: theme.colors.primary,
    fontWeight: "600",
  },
});

export default DrawerContent;
