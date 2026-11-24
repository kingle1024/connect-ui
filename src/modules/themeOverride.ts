import { Platform } from "react-native";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import theme from "@/modules/theme";

/**
 * 백오피스(/admin > 앱 설정)에서 바꾼 제품 색을 앱 시작 시 theme 에 덮어쓴다.
 *
 * 화면 스타일(StyleSheet.create)은 모듈이 처음 로드될 때 theme 값을 읽으므로,
 * 반드시 App 을 불러오기 전에 loadThemeOverride() 를 끝내야 한다 (index.tsx 참고).
 * 서버가 느리거나 실패하면 마지막으로 받은 색(캐시) → 앱 기본 색 순서로 쓴다.
 */

const CACHE_KEY = "themePrimary";
const TIMEOUT_MS = 1500;
const HEX = /^#[0-9A-Fa-f]{6}$/;

const toRgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const toHex = (rgb: number[]) =>
  "#" + rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("").toUpperCase();
// base 를 target 쪽으로 ratio 만큼 섞는다
const mix = (base: string, target: string, ratio: number) => {
  const a = toRgb(base);
  const b = toRgb(target);
  return toHex(a.map((v, i) => v + (b[i] - v) * ratio));
};

export function applyPrimaryColor(primary: string) {
  if (!HEX.test(primary)) return;
  const c = primary.toUpperCase();
  const [r, g, b] = toRgb(c);
  theme.colors.primary = c;
  theme.colors.primaryPressed = mix(c, "#000000", 0.1); // 눌림: 10% 어둡게
  theme.colors.primaryTint = mix(c, "#FFFFFF", 0.9); // 연한 배경: primary 10%
  theme.shadow.fab = Platform.select({
    web: { boxShadow: `0 6px 16px rgba(${r}, ${g}, ${b}, 0.4)` },
    default: { ...(theme.shadow.fab as object), shadowColor: c },
  }) as object;

  if (Platform.OS === "web" && typeof document !== "undefined") {
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", c);
  }
}

async function fetchPrimary(): Promise<string | null | undefined> {
  const base = Constants.expoConfig?.extra?.API_BASE_URL;
  if (!base) return undefined;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${base}/api/public/settings/theme`, { signal: controller.signal });
    if (!res.ok) return undefined;
    const body = await res.json();
    return body?.data?.primary ?? null; // null = 관리자가 설정하지 않음(기본 색)
  } catch {
    return undefined; // 실패/시간초과
  } finally {
    clearTimeout(timer);
  }
}

export async function loadThemeOverride() {
  const fresh = await fetchPrimary();
  try {
    if (fresh === undefined) {
      // 서버에 못 닿았으면 마지막으로 받은 색을 쓴다
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) applyPrimaryColor(cached);
      return;
    }
    if (fresh) {
      applyPrimaryColor(fresh);
      await AsyncStorage.setItem(CACHE_KEY, fresh);
    } else {
      await AsyncStorage.removeItem(CACHE_KEY);
    }
  } catch {
    if (fresh) applyPrimaryColor(fresh);
  }
}
