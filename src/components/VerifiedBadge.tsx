import { useCallback, useEffect, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View, ViewStyle, StyleProp } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import theme from "@/modules/theme";

type Props = {
  size?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * 이메일 인증된 사용자 표시 마크.
 * 웹에서는 마우스 오버, 모바일에서는 터치 시 "이메일 인증된 사용자" 툴팁을 보여준다.
 */
export default function VerifiedBadge({ size = 16, style }: Props) {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<View>(null);

  useEffect(
    () => () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    },
    []
  );

  // 터치/클릭 시 잠깐 보여줬다가 자동으로 닫는다
  const toggleTooltip = useCallback(() => {
    setTooltipVisible((prev) => !prev);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setTooltipVisible(false), 2000);
  }, []);

  // 웹에서는 RNW 반응자 시스템 대신 실제 DOM 이벤트로 처리한다.
  // (목록 카드 등 상위 터치러블 안에 중첩되면 press가 유실되는 경우가 있어서)
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const node = containerRef.current as unknown as HTMLElement | null;
    if (!node || !node.addEventListener) return;
    const onEnter = () => setTooltipVisible(true);
    const onLeave = () => setTooltipVisible(false);
    const onClick = (e: Event) => {
      // 카드 클릭(상세 이동)으로 번지지 않게 막는다
      e.stopPropagation();
      toggleTooltip();
    };
    node.addEventListener("mouseenter", onEnter);
    node.addEventListener("mouseleave", onLeave);
    node.addEventListener("click", onClick);
    return () => {
      node.removeEventListener("mouseenter", onEnter);
      node.removeEventListener("mouseleave", onLeave);
      node.removeEventListener("click", onClick);
    };
  }, [toggleTooltip]);

  return (
    <Pressable
      ref={containerRef}
      onPress={Platform.OS === "web" ? undefined : toggleTooltip}
      hitSlop={6}
      style={[styles.container, style]}
    >
      <MaterialIcons name="verified" size={size} color={theme.colors.info} />
      {tooltipVisible ? (
        <View style={[styles.tooltip, { bottom: size + 6 }]} pointerEvents="none">
          <Text style={styles.tooltipText}>이메일 인증된 사용자</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    zIndex: 10,
  },
  tooltip: {
    // 마크가 왼쪽 끝에 있어도 잘리지 않도록 아이콘 기준 오른쪽으로 펼친다
    position: "absolute",
    left: -8,
    width: 132,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: theme.radius.sm,
    backgroundColor: "rgba(25, 31, 40, 0.92)",
    alignItems: "center",
    zIndex: 10,
  },
  tooltipText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#FFFFFF",
  },
});
