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

/**
 * 안드로이드에서 홈 화면에 추가하면 웹앱(WebAPK)이 설치되는데, 플레이 스토어를 거치지 않은
 * 설치라서 Google Play 프로텍트가 "앱 검사 권장됨" 창을 띄운다. 처음 보는 사용자는
 * 악성 앱 경고로 오해하기 쉬우므로, 설치 프롬프트를 띄우기 전에 미리 설명한다.
 */
const ANDROID_STEPS = [
  "다음 화면에서 '설치'(또는 '추가')를 누르세요.",
  "'Google Play 프로텍트 · 앱 검사 권장됨' 창이 뜨면 '앱 검사'를 누르세요.",
  "검사가 끝나면 설치가 이어지고, 홈 화면에 '같이타' 아이콘이 생겨요.",
];

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
  const [showSteps, setShowSteps] = useState(false);
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

  // 바로 설치 프롬프트를 띄우지 않고, 먼저 설치 과정(특히 Play 프로텍트 창)을 안내한다.
  const handlePress = () => setShowSteps((prev) => !prev);
  const steps = mode === "native" ? ANDROID_STEPS : IOS_STEPS;

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
          accessibilityLabel={showSteps ? "안내 접기" : "추가 방법 보기"}
        >
          <Text style={styles.installButtonText}>
            {showSteps ? "접기" : mode === "native" ? "추가" : "방법"}
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

      {showSteps && (
        <View style={styles.steps}>
          {mode === "native" && (
            <View style={styles.notice}>
              <Feather
                name="shield"
                size={16}
                color={theme.colors.primary}
                style={styles.noticeIcon}
              />
              <Text style={styles.noticeText}>
                설치 중에 <Text style={styles.noticeStrong}>'앱 검사 권장됨'</Text> 창이 뜰 수
                있어요. 플레이 스토어가 아닌 웹사이트에서 바로 설치하는 앱이라 안드로이드가
                보여주는 기본 안내예요. 바이러스나 문제가 있다는 뜻이 아니니 안심하세요.
              </Text>
            </View>
          )}
          {steps.map((step, index) => (
            <View key={step} style={styles.step}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>{index + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
          {mode === "native" && (
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={install}
              accessibilityRole="button"
              accessibilityLabel="홈 화면에 앱 추가"
            >
              <Text style={styles.confirmButtonText}>확인했어요, 설치하기</Text>
            </TouchableOpacity>
          )}
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
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primaryTint,
  },
  noticeIcon: {
    marginTop: 1,
    marginRight: theme.spacing.sm,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: theme.colors.text,
  },
  noticeStrong: {
    fontWeight: "700",
  },
  confirmButton: {
    marginTop: theme.spacing.xs,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.white,
  },
});

export default InstallPromptBanner;
