import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Constants from "expo-constants";
import theme from "@/modules/theme";

/**
 * 오늘 구내식당 식단 (CJ프레시밀).
 * 캠퍼스(강촌/을지)는 AsyncStorage 에 기억하고, 시간대 탭은 현재 시각으로 기본 선택한다.
 * 프레시밀 직접 호출은 CORS 로 막히므로 서버(/api/public/meal)가 대신 받아서 내려준다.
 */

// 로그인 없이 보는 공개 API 라 인증 쿠키를 실어 보내지 않는다.
// (공용 axios 는 withCredentials: true 라서 서버의 와일드카드 CORS 응답과 충돌한다.)
const axiosInstance = axios.create({
  baseURL: Constants.expoConfig?.extra?.API_BASE_URL ?? "",
});

type Campus = "gangchon" | "eulji";
type MealTime = "morning" | "lunch" | "dinner";

type MealItem = {
  corner: string;
  name: string;
  side: string;
  kcal: number;
  thumbnailUrl: string;
};

type Meals = Record<MealTime, MealItem[]>;

const CAMPUS_STORAGE_KEY = "mealCampus";
const CAMPUSES: { key: Campus; label: string }[] = [
  { key: "gangchon", label: "강촌" },
  { key: "eulji", label: "을지" },
];
const MEAL_TIMES: { key: MealTime; label: string }[] = [
  { key: "morning", label: "조식" },
  { key: "lunch", label: "중식" },
  { key: "dinner", label: "석식" },
];

const defaultMealTime = (): MealTime => {
  const hour = new Date().getHours();
  if (hour < 9) return "morning";
  if (hour < 13) return "lunch";
  return "dinner";
};

export default function MealScreen() {
  const [campus, setCampus] = useState<Campus>("gangchon");
  const [mealTime, setMealTime] = useState<MealTime>(defaultMealTime);
  const [meals, setMeals] = useState<Meals | null>(null);
  const [partial, setPartial] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 마지막으로 본 캠퍼스 복원 (없으면 강촌)
  useEffect(() => {
    AsyncStorage.getItem(CAMPUS_STORAGE_KEY).then((saved) => {
      if (saved === "gangchon" || saved === "eulji") setCampus(saved);
    });
  }, []);

  const loadMeal = useCallback(async (target: Campus, force = false) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axiosInstance.get("/api/public/meal", {
        params: { campus: target, ...(force ? { force: true } : {}) },
      });
      setMeals(data?.data?.meals ?? null);
      setPartial(!!data?.data?.partial);
    } catch (e: any) {
      setMeals(null);
      setPartial(false);
      setError(e?.response?.data?.message ?? "식단을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMeal(campus);
  }, [campus, loadMeal]);

  const onSelectCampus = useCallback((next: Campus) => {
    setCampus(next);
    AsyncStorage.setItem(CAMPUS_STORAGE_KEY, next);
  }, []);

  const list = meals?.[mealTime] ?? [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 캠퍼스 선택 + 새로고침 */}
      <View style={styles.headerRow}>
        <View style={styles.chipRow}>
          {CAMPUSES.map(({ key, label }) => {
            const active = campus === key;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => onSelectCampus(key)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => loadMeal(campus, true)}
          disabled={loading}
        >
          <MaterialIcons name="refresh" size={18} color={theme.colors.textSecondary} />
          <Text style={styles.refreshText}>새로고침</Text>
        </TouchableOpacity>
      </View>

      {/* 시간대 탭 */}
      <View style={styles.tabRow}>
        {MEAL_TIMES.map(({ key, label }) => {
          const active = mealTime === key;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setMealTime(key)}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 프레시밀이 아직 식단/사진을 다 안 올린 상태 안내 */}
      {partial && !loading ? (
        <Text style={styles.noticeText}>
          ⏳ 식단이 아직 다 등록되지 않았습니다(사진 준비 중) — 새로고침으로 다시 확인할 수 있습니다.
        </Text>
      ) : null}

      {loading ? (
        <View style={styles.placeholder}>
          <ActivityIndicator color={theme.colors.primary} size="small" />
        </View>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : list.length === 0 ? (
        <Text style={styles.emptyText}>해당 시간대 식단이 없습니다.</Text>
      ) : (
        <View style={styles.cardList}>
          {list.map((item, index) => (
            <View key={`${item.corner}-${item.name}-${index}`} style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.corner} numberOfLines={1}>
                  {item.corner}
                </Text>
                {item.kcal > 0 ? <Text style={styles.kcal}>{item.kcal}kcal</Text> : null}
              </View>
              {item.name ? <Text style={styles.mealName}>{item.name}</Text> : null}
              {item.side ? <Text style={styles.mealSide}>{item.side}</Text> : null}
              {item.thumbnailUrl ? (
                <Image
                  source={{ uri: item.thumbnailUrl }}
                  style={styles.thumbnail}
                  resizeMode="cover"
                />
              ) : null}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  content: {
    padding: 20,
    gap: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  refreshText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  chipRow: {
    flexDirection: "row",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  chipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryTint,
  },
  chipText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  chipTextActive: {
    color: theme.colors.primary,
    fontWeight: "600",
  },
  tabRow: {
    flexDirection: "row",
    marginTop: 4,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.field,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: theme.radius.sm,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: theme.colors.surface,
    ...theme.shadow.card,
  },
  tabText: {
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  tabTextActive: {
    color: theme.colors.text,
    fontWeight: "600",
  },
  noticeText: {
    fontSize: 12,
    color: theme.colors.warning,
    lineHeight: 18,
    marginTop: 4,
  },
  placeholder: {
    paddingVertical: 24,
    alignItems: "center",
  },
  errorText: {
    fontSize: 13,
    color: theme.colors.danger,
    paddingVertical: 12,
  },
  emptyText: {
    fontSize: 13,
    color: theme.colors.textMuted,
    paddingVertical: 12,
  },
  cardList: {
    gap: 10,
    marginTop: 4,
  },
  card: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: 12,
    gap: 4,
    backgroundColor: theme.colors.surface,
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  corner: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  kcal: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  mealName: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.text,
  },
  mealSide: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 19,
  },
  thumbnail: {
    width: "100%",
    height: 160,
    borderRadius: theme.radius.sm,
    marginTop: 6,
    backgroundColor: theme.colors.field,
  },
});
