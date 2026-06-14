import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
  DrawerItem,
} from "@react-navigation/drawer";
import { Text, View, StyleSheet, TouchableOpacity, Image, Platform } from "react-native";
import Alert from "@blazejkustra/react-native-alert";
import * as ImagePicker from "expo-image-picker";
import {
  Feather,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { useCallback, useContext } from "react";
import { useRootNavigation } from "@/hooks/useNavigation";
import AuthContext from "../auth/AuthContext";

const DrawerContent = (props: DrawerContentComponentProps) => {
  const navigation = useRootNavigation<"Signin">();
  const { user: me, signout, updateProfileImage } = useContext(AuthContext);

  const onPressBottomButton = useCallback(() => {
    if (me) {
      signout();
    } else {
      navigation.navigate("Signin");
    }
  }, [me, signout, navigation]);

  // 프로필 사진 클릭 → 이미지 선택 → 업로드
  const onPressProfileImage = useCallback(async () => {
    if (!me) {
      // 미로그인 시 로그인으로 유도
      props.navigation.closeDrawer();
      navigation.navigate("Signin");
      return;
    }
    try {
      if (Platform.OS !== "web") {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert("권한 필요", "사진 접근 권한이 필요합니다.");
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });
      if (result.canceled || !result.assets?.[0]?.base64) {
        return;
      }
      const asset = result.assets[0];
      await updateProfileImage(asset.base64 as string, asset.mimeType ?? "image/jpeg");
    } catch (e: any) {
      Alert.alert("실패", e?.message ?? "프로필 사진 업로드에 실패했습니다.");
    }
  }, [me, updateProfileImage, navigation, props.navigation]);

  return (
    <DrawerContentScrollView contentContainerStyle={styles.container}>
      <View style={styles.profileSection}>
        <TouchableOpacity
          style={styles.profileImageContainer}
          onPress={onPressProfileImage}
          activeOpacity={0.8}
        >
          {me?.profileUrl ? (
            <Image source={{ uri: me.profileUrl }} style={styles.profileImage} />
          ) : (
            <MaterialIcons name="person" size={64} color="#9CA3AF" />
          )}
          {/* 카메라 뱃지 (사진 등록 안내) */}
          <View style={styles.cameraBadge}>
            <Feather name="camera" size={14} color="#fff" />
          </View>
        </TouchableOpacity>
        {me?.userId ? null : (
          <Text style={styles.userName}>로그인이 필요합니다.</Text>
        )}
        <Text style={styles.userEmail}>
          {me?.userId ?? "로그인하여 모든 기능을 이용해보세요."}
        </Text>
      </View>

      {/* 구분선 */}
      <View style={styles.divider} />

      {/* 메뉴 항목들 */}
      <View style={styles.menuSection}>
        {/* 추가 메뉴 항목들 */}
        <DrawerItem
          label="마이페이지"
          onPress={() => {
            // 드로어를 닫고 마이페이지로 이동. 미로그인 시 로그인 페이지로 유도
            props.navigation.closeDrawer();
            if (me) {
              navigation.navigate("MyPage");
            } else {
              navigation.navigate("Signin");
            }
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
          <Text style={styles.bottomText}>{me ? "로그아웃" : "로그인"}</Text>
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
  profileImage: {
    width: 74,
    height: 74,
    borderRadius: 37,
  },
  cameraBadge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "tomato",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
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
