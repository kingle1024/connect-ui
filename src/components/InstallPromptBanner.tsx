import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import theme from "@/modules/theme";

/** 하단 탭바(60) 위에 띄우기 위한 여백 */
const TAB_BAR_HEIGHT = 60;

const IOS_STEPS = [
  "브라우저 하단(또는 상단)의 공유 버튼을 누르세요.",
  "목록에서 '홈 화면에 추가'를 선택하세요.",
  "오른쪽 위 '추가'를 누르면 완료됩니다.",
];

/**
 * 모바일 웹에서 "홈 화면에 앱 추가"를 안내하는 하단 배너.
 * 이미 설치했거나 모바일이 아니면 렌더링하지 않는다.
 */
const InstallPromptBanner = () => {
  const { visible, mode, install, dismiss } = useInstallPrompt();
  const insets = useSafeAreaInsets();
  const [showIosSteps, setShowIosSteps] = useState(false);
  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    Animated.timing(slide, {
      toValue: 1,
      duration: 260,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  }, [visible, slide]);

  if (!visible) return null;

  const handlePress = () => {
    if (mode === "native") {
      install();
    } else {
      setShowIosSteps((prev) => !prev);
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { bottom: TAB_BAR_HEIGHT + insets.bottom + theme.spacing.md },
        {
          opacity: slide,
          transform: [
            {
              translateY: slide.interpolate({
                inputRange: [0, 1],
                outputRange: [16, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.row}>
        <Image
          source={require("../../assets/icon.png")}
          style={styles.appIcon}
          resizeMode="contain"
        />

        <View style={styles.textContainer}>
          <Text style={styles.title}>홈 화면에 앱 추가</Text>
          <Text style={styles.description}>
            설치하면 홈 화면에서 앱처럼 바로 실행할 수 있어요.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.installButton}
          onPress={handlePress}
          accessibilityRole="button"
          accessibilityLabel={mode === "native" ? "홈 화면에 앱 추가" : "추가 방법 보기"}
        >
          <Text style={styles.installButtonText}>
            {mode === "native" ? "추가" : showIosSteps ? "닫기" : "방법"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.closeButton}
          onPress={dismiss}
          accessibilityRole="button"
          accessibilityLabel="배너 닫기"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="x" size={18} color={theme.colors.textMuted} />
        </TouchableOpacity>
      </View>

      {mode === "ios" && showIosSteps && (
        <View style={styles.steps}>
          {IOS_STEPS.map((step, index) => (
            <View key={step} style={styles.step}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>{index + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    zIndex: 100,
    ...theme.shadow.card,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  appIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.field,
  },
  textContainer: {
    flex: 1,
    marginLeft: theme.spacing.md,
    marginRight: theme.spacing.sm,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.text,
  },
  description: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  installButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primary,
  },
  installButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.white,
  },
  closeButton: {
    marginLeft: theme.spacing.sm,
    padding: 2,
  },
  steps: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
  },
  step: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  stepBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.colors.primaryTint,
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.sm,
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  stepText: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
});

export default InstallPromptBanner;
