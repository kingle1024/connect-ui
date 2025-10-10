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
import { useCallback } from "react";
import { useRootNavigation } from "@/navigation/RootNavigation";

const DrawerContent = (props: DrawerContentComponentProps) => {
  const navigation = useRootNavigation<"Signin">();

  const onPressBottomButton = useCallback(() => {
    navigation.navigate("Signin");
  }, []);

  return (
    <DrawerContentScrollView contentContainerStyle={styles.container}>
      <View style={styles.profileSection}>
        <View style={styles.profileImageContainer}>
          <MaterialIcons name="person" size={64} color="#9CA3AF" />
        </View>
        <Text style={styles.userName}>로그인이 필요합니다.</Text>
        <Text style={styles.userEmail}>
          로그인하여 모든 기능을 이용해보세요.
        </Text>
      </View>

      {/* 구분선 */}
      <View style={styles.divider} />

      {/* 메뉴 항목들 */}
      <View style={styles.menuSection}>
        {/* 추가 메뉴 항목들 */}
        <DrawerItem
          label="설정"
          onPress={() => {
            // 설정 화면으로 이동
          }}
          icon={({ color, size }) => (
            <Feather name="settings" color="tomato" size={size} />
          )}
          labelStyle={styles.menuLabel}
        />

        <DrawerItem
          label="도움말"
          onPress={() => {
            // 도움말 화면으로 이동
          }}
          icon={({ color, size }) => (
            <Feather name="help-circle" color="tomato" size={size} />
          )}
          labelStyle={styles.menuLabel}
        />

        <DrawerItem
          label="마이페이지"
          onPress={() => {
            // 마이페이지 화면으로 이동
          }}
          icon={({ color, size }) => (
            <MaterialCommunityIcons name="account" color="tomato" size={size} />
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
          <Feather name="log-out" size={20} color="#ff4444" />
          <Text style={styles.bottomText}>로그인</Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileSection: {
    alignItems: "center",
    padding: 20,
    marginBottom: 10,
  },
  profileImageContainer: {
    marginBottom: 15,
    justifyContent: "center",
    alignItems: "center",
    width: 80, // w-32
    height: 80, // h-32
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "tomato",
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginHorizontal: 20,
    marginBottom: 10,
  },
  menuSection: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 16,
  },
  bottomSection: {
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  bottomButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "tomato",
  },
  bottomText: {
    marginLeft: 12,
    fontSize: 16,
    color: "tomato",
    fontWeight: "500",
  },
});

export default DrawerContent;
