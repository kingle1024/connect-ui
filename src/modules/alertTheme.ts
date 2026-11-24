import { Platform } from "react-native";
import theme from "@/modules/theme";

/**
 * 웹 안내창(@blazejkustra/react-native-alert) 공통 스타일.
 * 이 라이브러리는 CSS 변수로 색을 정하므로, 앱 테마(theme.ts) 값을 그 변수에 연결한다.
 * → theme.colors 의 색만 바꾸면 모든 Alert.alert 안내창 색이 함께 바뀐다.
 * (네이티브 앱은 OS 기본 안내창을 쓰므로 해당 없음)
 */
export function applyAlertTheme() {
  if (Platform.OS !== "web" || typeof document === "undefined") return;
  const id = "app-alert-theme";
  if (document.getElementById(id)) return;

  const c = theme.colors;
  const style = document.createElement("style");
  style.id = id;
  // :root:root — 라이브러리의 다크모드 자동 전환(:root:not([data-theme]))보다 우선해서 항상 앱 테마를 쓴다
  style.textContent = `
:root:root {
  --rn-alert-bg: ${c.surface};
  --rn-alert-fg: ${c.text};
  --rn-alert-muted: ${c.textSecondary};
  --rn-alert-surface: ${c.surface};
  --rn-alert-border: ${c.border};
  --rn-alert-accent: ${c.primary};
  --rn-alert-accent-hover: ${c.primaryPressed};
  --rn-alert-accent-light: ${c.primaryTint};
  --rn-alert-danger: ${c.danger};
  --rn-alert-danger-hover: color-mix(in srgb, ${c.danger} 85%, #000);
  --rn-alert-danger-light: ${c.dangerTint};
  --rn-alert-radius: ${theme.radius.lg}px;
  --rn-alert-outline: 3px solid color-mix(in srgb, ${c.primary} 40%, transparent);
  --rn-alert-outline-weak: 2px solid color-mix(in srgb, ${c.primary} 25%, transparent);
}
.rn-alert__dialog { color-scheme: light; }
/* 메시지의 \\n 을 실제 줄바꿈으로 보여주고, 긴 단어도 영역 안에서 줄을 바꾼다 */
.rn-alert__message { white-space: pre-line; word-break: keep-all; overflow-wrap: anywhere; }
.rn-alert__title { white-space: pre-line; }
/* 버튼이 하나뿐인 안내창(확인/OK)도 강조 버튼으로 보여준다 (라이브러리는 2개일 때만 강조) */
.rn-alert__actions > .rn-alert__button--secondary:only-child {
  background: var(--rn-alert-accent);
  color: #fff;
  border-color: color-mix(in srgb, #000 10%, var(--rn-alert-accent));
  box-shadow: 0 1px 2px rgba(0,0,0,.1);
}
.rn-alert__actions > .rn-alert__button--secondary:only-child:hover { background: var(--rn-alert-accent-hover); }
`;
  document.head.appendChild(style);
}
