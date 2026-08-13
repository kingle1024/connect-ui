import { useCallback, useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Constants from "expo-constants";
import Toast from "react-native-toast-message";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AuthContext from "@/components/auth/AuthContext";
import theme from "@/modules/theme";
import {
  getGuestEmail,
  getGuestKey,
  getOrCreateGuestKey,
  saveGuestEmail,
} from "@/utils/guestKey";
import { Inquiry, InquiryStatus, InquiryType } from "@/types";

const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL ?? "";
const axiosInstance = axios.create({ baseURL: API_BASE_URL });

const MAX_TITLE_LENGTH = 200;
const MAX_CONTENT_LENGTH = 5000;
const MAX_EMAIL_LENGTH = 255;

// 서버 InquiryService 와 같은 형식만 통과시켜 눌러보기 전에 걸러준다.
const EMAIL_PATTERN = /^[A-Za-z0-9_!#$%&'*+/=?`{|}~^.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

// 서버 ApiResponse<T> 형태: { success, message, data }
const errorMessageOf = (error: any, fallback: string) =>
  error?.response?.data?.message ?? fallback;

const TYPE_OPTIONS: { value: InquiryType; label: string }[] = [
  { value: "IMPROVEMENT", label: "개선 요청" },
  { value: "BUG", label: "버그 신고" },
  { value: "ETC", label: "기타 문의" },
];

// 상태별 배지 색. 서버 InquiryStatus 와 키를 맞춘다.
const STATUS_STYLE: Record<InquiryStatus, { color: string; background: string }> = {
  RECEIVED: { color: theme.colors.warning, background: theme.colors.warningTint },
  IN_PROGRESS: { color: theme.colors.info, background: theme.colors.infoTint },
  ANSWERED: { color: theme.colors.success, background: theme.colors.successTint },
  REJECTED: { color: theme.colors.textMuted, background: theme.colors.field },
};

// '2026-07-29T10:20:30' -> '2026-07-29 10:20'
const formatDateTime = (iso?: string | null) =>
  iso ? `${iso.slice(0, 10)} ${iso.slice(11, 16)}` : "";

export default function InquiryScreen() {
  const { user: me } = useContext(AuthContext);
  const insets = useSafeAreaInsets();

  const [type, setType] = useState<InquiryType>("IMPROVEMENT");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // 비로그인일 때만 쓰는 선택 입력값. 남기면 답변이 등록될 때 메일로도 알려준다.
  const [email, setEmail] = useState("");

  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // 카드를 눌러 펼친 문의 ID 모음 (내용/답변 전체 보기)
  const [expandedIds, setExpandedIds] = useState<number[]>([]);

  const showToast = useCallback(
    (toastType: "success" | "error", text1: string, text2?: string) => {
      Toast.show({ type: toastType, text1, text2, visibilityTime: 3000, topOffset: insets.top });
    },
    [insets.top]
  );

  const authHeader = useCallback(async () => {
    const accessToken = await AsyncStorage.getItem("accessToken");
    return { headers: { Authorization: `Bearer ${accessToken}` } };
  }, []);

  /**
   * 내 요청 내역 조회 설정.
   * 로그인했으면 토큰으로, 아니면 단말에 캐시된 게스트 키로 "내 것"을 찾는다.
   * 아직 이 단말에서 보낸 적이 없으면 키가 없으므로 굳이 새로 만들지 않는다.
   */
  const myListConfig = useCallback(async () => {
    if (me) return await authHeader();
    const guestKey = await getGuestKey();
    return guestKey ? { params: { guestKey } } : null;
  }, [me, authHeader]);

  const loadInquiries = useCallback(async () => {
    try {
      const config = await myListConfig();
      if (!config) {
        // 보낸 요청이 없는 비로그인 사용자. 서버에 물어볼 것도 없다.
        setInquiries([]);
        return;
      }
      const response = await axiosInstance.get("/api/inquiries/my", config);
      setInquiries(response.data?.data ?? []);
    } catch (error: any) {
      showToast("error", "문의 내역을 불러오지 못했습니다.", errorMessageOf(error, "잠시 후 다시 시도해주세요."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [myListConfig, showToast]);

  useEffect(() => {
    loadInquiries();
  }, [loadInquiries]);

  // 지난번에 남긴 메일 주소를 미리 채워둔다. (로그인 상태면 입력칸 자체가 없다)
  useEffect(() => {
    if (me) return;
    let alive = true;
    getGuestEmail().then((saved) => {
      if (alive && saved) setEmail(saved);
    });
    return () => {
      alive = false;
    };
  }, [me]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadInquiries();
  }, [loadInquiries]);

  const onSubmit = useCallback(async () => {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    if (!trimmedTitle) {
      showToast("error", "제목을 입력해주세요.");
      return;
    }
    if (!trimmedContent) {
      showToast("error", "내용을 입력해주세요.");
      return;
    }
    const trimmedEmail = email.trim();
    if (!me && trimmedEmail && !EMAIL_PATTERN.test(trimmedEmail)) {
      showToast("error", "이메일 주소 형식을 확인해주세요.");
      return;
    }
    if (submitting) return;

    setSubmitting(true);
    try {
      if (me) {
        await axiosInstance.post(
          "/api/inquiries",
          { type, title: trimmedTitle, content: trimmedContent },
          await authHeader()
        );
      } else {
        // 이 단말을 알아보게 할 키. 다음에 들어와도 같은 키로 내 요청을 다시 찾는다.
        const guestKey = await getOrCreateGuestKey();
        await axiosInstance.post("/api/inquiries", {
          type,
          title: trimmedTitle,
          content: trimmedContent,
          guestKey,
          guestEmail: trimmedEmail || null,
        });
        await saveGuestEmail(trimmedEmail);
      }
      setTitle("");
      setContent("");
      setType("IMPROVEMENT");
      showToast(
        "success",
        "요청이 접수되었습니다.",
        !me && trimmedEmail
          ? "답변이 등록되면 아래 내역과 메일로 알려드릴게요."
          : "답변이 등록되면 아래 내역에서 확인할 수 있어요."
      );
      await loadInquiries();
    } catch (error: any) {
      showToast("error", "접수 실패", errorMessageOf(error, "잠시 후 다시 시도해주세요."));
    } finally {
      setSubmitting(false);
    }
  }, [title, content, type, email, me, submitting, authHeader, showToast, loadInquiries]);

  const toggleExpanded = useCallback((id: number) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]
    );
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* 요청 작성 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>요청 보내기</Text>
        <Text style={styles.helperText}>
          불편했던 점이나 버그를 남겨주세요. 관리자가 확인한 뒤 답변을 등록하면 아래 내역에서 볼 수 있습니다.
          {me ? "" : " 로그인하지 않아도 보낼 수 있어요."}
        </Text>

        <View style={styles.typeRow}>
          {TYPE_OPTIONS.map((option) => {
            const selected = option.value === type;
            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.typeChip, selected && styles.typeChipSelected]}
                onPress={() => setType(option.value)}
              >
                <Text style={[styles.typeChipText, selected && styles.typeChipTextSelected]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.label}>제목</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="예) 목록에서 마감된 글이 계속 보여요"
          placeholderTextColor={theme.colors.textMuted}
          maxLength={MAX_TITLE_LENGTH}
        />

        <Text style={styles.label}>내용</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={content}
          onChangeText={setContent}
          placeholder="어떤 화면에서, 어떤 동작을 했을 때 문제가 생겼는지 적어주시면 빠르게 확인할 수 있어요."
          placeholderTextColor={theme.colors.textMuted}
          multiline
          textAlignVertical="top"
          maxLength={MAX_CONTENT_LENGTH}
        />
        <Text style={styles.counterText}>
          {content.length} / {MAX_CONTENT_LENGTH}
        </Text>

        {/* 비로그인 접수는 답변받을 곳이 없으니 메일 주소를 받아둔다. (선택) */}
        {me ? null : (
          <>
            <Text style={styles.label}>이메일 (선택)</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="답변을 메일로도 받고 싶다면 입력해주세요."
              placeholderTextColor={theme.colors.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              inputMode="email"
              maxLength={MAX_EMAIL_LENGTH}
            />
          </>
        )}

        <TouchableOpacity style={styles.primaryButton} onPress={onSubmit} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.primaryButtonText}>요청 보내기</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* 내 요청 내역 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>내 요청 내역</Text>
        {/* 비로그인 내역은 이 기기에만 기록이 남는다는 걸 미리 알려준다. */}
        {me ? null : (
          <Text style={styles.helperText}>
            로그인 없이 보낸 요청은 이 기기에 기억해두었다가 보여드려요. 앱 데이터를 지우거나 다른
            기기에서 열면 보이지 않으니, 답변을 꼭 받아야 한다면 이메일을 남겨주세요.
          </Text>
        )}

        {loading ? (
          <ActivityIndicator style={styles.listLoading} color={theme.colors.primary} />
        ) : inquiries.length === 0 ? (
          <Text style={styles.mutedText}>아직 보낸 요청이 없습니다.</Text>
        ) : (
          inquiries.map((inquiry) => {
            const expanded = expandedIds.includes(inquiry.id);
            const statusStyle = STATUS_STYLE[inquiry.status];
            return (
              <TouchableOpacity
                key={inquiry.id}
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => toggleExpanded(inquiry.id)}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.badgeRow}>
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeBadgeText}>{inquiry.typeLabel}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.background }]}>
                      <Text style={[styles.statusBadgeText, { color: statusStyle.color }]}>
                        {inquiry.statusLabel}
                      </Text>
                    </View>
                  </View>
                  <MaterialIcons
                    name={expanded ? "expand-less" : "expand-more"}
                    size={20}
                    color={theme.colors.textMuted}
                  />
                </View>

                <Text style={styles.cardTitle} numberOfLines={expanded ? undefined : 1}>
                  {inquiry.title}
                </Text>
                <Text style={styles.cardDate}>{formatDateTime(inquiry.insertDts)} 접수</Text>
                <Text style={styles.cardContent} numberOfLines={expanded ? undefined : 2}>
                  {inquiry.content}
                </Text>

                {inquiry.answer ? (
                  <View style={styles.answerBox}>
                    <View style={styles.answerHeader}>
                      <MaterialIcons
                        name="support-agent"
                        size={16}
                        color={theme.colors.primary}
                      />
                      <Text style={styles.answerLabel}>관리자 답변</Text>
                      <Text style={styles.answerDate}>{formatDateTime(inquiry.answeredDts)}</Text>
                    </View>
                    <Text style={styles.answerText} numberOfLines={expanded ? undefined : 3}>
                      {inquiry.answer}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.waitingText}>아직 답변이 등록되지 않았습니다.</Text>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </View>
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
    paddingBottom: 40,
    gap: 28,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: 4,
  },
  helperText: {
    fontSize: 13,
    color: theme.colors.textMuted,
    lineHeight: 18,
  },
  label: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 6,
  },
  mutedText: {
    fontSize: 15,
    color: theme.colors.textMuted,
  },
  typeRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  typeChip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.field,
  },
  typeChipSelected: {
    backgroundColor: theme.colors.primaryTint,
  },
  typeChipText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: "500",
  },
  typeChipTextSelected: {
    color: theme.colors.primary,
    fontWeight: "700",
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.divider,
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
  },
  textarea: {
    minHeight: 140,
    lineHeight: 20,
  },
  counterText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    textAlign: "right",
  },
  primaryButton: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  listLoading: {
    marginVertical: 20,
  },
  card: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: 14,
    marginTop: 10,
    backgroundColor: theme.colors.surface,
    gap: 6,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  badgeRow: {
    flexDirection: "row",
    gap: 6,
    flexShrink: 1,
  },
  typeBadge: {
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.field,
  },
  typeBadgeText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: "600",
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: theme.radius.pill,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.text,
  },
  cardDate: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  cardContent: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  answerBox: {
    marginTop: 8,
    padding: 12,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primaryTint,
    gap: 6,
  },
  answerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  answerLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  answerDate: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  answerText: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  waitingText: {
    marginTop: 6,
    fontSize: 13,
    color: theme.colors.textMuted,
  },
});
