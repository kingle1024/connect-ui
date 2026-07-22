import theme from "./theme";

// 기존 화면 호환용 상수. 새 코드는 modules/theme.ts를 직접 사용한다.
const Colors = {
  BLACK: theme.colors.text,
  GRAY: theme.colors.textMuted,
  LIGHT_GRAY: theme.colors.border,
  RED: theme.colors.danger,
  WHITE: theme.colors.white,
  PRIMARY: theme.colors.primary,
};

export default Colors;
