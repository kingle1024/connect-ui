import { Platform } from "react-native";

/**
 * 앱 공통 디자인 토큰.
 * 화면별로 색상/간격/그림자를 하드코딩하지 말고 이 토큰을 사용한다.
 */
const theme = {
  colors: {
    // Brand
    primary: "#FF5A2F",
    primaryPressed: "#E8481F",
    primaryTint: "#FFF0EA", // primary 10% 배경용

    // Text
    text: "#191F28",
    textSecondary: "#4E5968",
    textMuted: "#8B95A1",
    textDisabled: "#B0B8C1",

    // Surface
    background: "#F7F8FA",
    surface: "#FFFFFF",
    field: "#F2F4F6", // 입력창/검색창 배경
    border: "#E5E8EB",
    divider: "#F2F4F6",

    // Semantic
    success: "#059669",
    successTint: "#D1FAE5",
    warning: "#B45309",
    warningTint: "#FEF3C7",
    danger: "#F04452",
    dangerTint: "#FDECEE",
    info: "#3182F6",
    infoTint: "#E8F3FF",

    white: "#FFFFFF",
    black: "#191F28",
  },

  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    pill: 9999,
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },

  shadow: {
    // 리스트 카드용 은은한 그림자
    card: Platform.select({
      web: { boxShadow: "0 2px 12px rgba(25, 31, 40, 0.06)" },
      default: {
        shadowColor: "#191F28",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
      },
    }) as object,
    // 플로팅 버튼용 강조 그림자
    fab: Platform.select({
      web: { boxShadow: "0 6px 16px rgba(255, 90, 47, 0.4)" },
      default: {
        shadowColor: "#FF5A2F",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 6,
      },
    }) as object,
  },
};

export default theme;
