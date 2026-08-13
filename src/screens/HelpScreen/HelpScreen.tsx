import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useRootNavigation } from "@/hooks/useNavigation";
import theme from "@/modules/theme";

// 도움말은 정적인 안내 화면이라 서버 호출 없이 화면 안에서 내용을 관리한다.
// 기능이 바뀌면 이 목록만 고치면 된다.

type StepItem = {
  title: string;
  description: string;
};

const STEPS: StepItem[] = [
  {
    title: "모집 글 둘러보기",
    description:
      "'모집' 탭에서 카테고리 칩으로 원하는 종류만 골라 볼 수 있어요. 카드에는 목적지, 마감일, 모집 인원이 함께 표시됩니다.",
  },
  {
    title: "마음에 드는 글에 참여하기",
    description:
      "글을 눌러 상세로 들어가면 댓글로 의사를 남기거나, 작성자와 1:1 채팅을 열어 바로 이야기할 수 있어요.",
  },
  {
    title: "직접 모집 글 쓰기",
    description:
      "목록 오른쪽 아래 + 버튼을 누르면 글쓰기 창이 열립니다. 카테고리·제목·내용·목적지·모집 인원·마감일을 채우면 끝이에요.",
  },
];

type FeatureItem = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  description: string;
};

const FEATURES: FeatureItem[] = [
  {
    icon: "shape-outline",
    title: "카테고리",
    description: "같이타·모임 등 카테고리로 필터링. 없는 종류는 직접입력으로 만들 수 있어요.",
  },
  {
    icon: "comment-text-outline",
    title: "댓글 · 대댓글",
    description: "상세 화면에서 댓글과 대댓글로 세부 조건을 맞춰보세요.",
  },
  {
    icon: "chat-processing-outline",
    title: "1:1 채팅",
    description: "작성자 이름을 눌러 채팅방을 열면 '채팅' 탭에서 이어서 대화할 수 있어요.",
  },
  {
    icon: "check-decagram-outline",
    title: "더존 이메일 인증",
    description: "마이페이지에서 @douzone.com 메일을 인증하면 글에 인증 마크가 붙어요.",
  },
  {
    icon: "account-edit-outline",
    title: "이름 변경",
    description: "마이페이지에서 표시될 이름(별칭)을 언제든 바꿀 수 있어요.",
  },
  {
    icon: "bug-outline",
    title: "개선 · 버그 요청",
    description: "로그인 없이도 보낼 수 있고, 관리자 답변까지 앱 안에서 확인할 수 있어요.",
  },
];

type BadgeItem = {
  label: string;
  meaning: string;
  color: string;
  background: string;
};

const BADGES: BadgeItem[] = [
  {
    label: "모집중",
    meaning: "아직 자리가 남아 있어요. 표시된 인원은 현재 참여 / 최대 모집 인원입니다.",
    color: theme.colors.primary,
    background: theme.colors.primaryTint,
  },
  {
    label: "마감",
    meaning: "모집 인원이 다 찼어요.",
    color: theme.colors.textSecondary,
    background: theme.colors.field,
  },
  {
    label: "마감됨",
    meaning: "마감일이 지난 글이에요. 목록에는 남지만 새로 참여하긴 어려워요.",
    color: theme.colors.textMuted,
    background: theme.colors.field,
  },
];

type FaqItem = {
  question: string;
  answer: string;
};

const FAQS: FaqItem[] = [
  {
    question: "글은 어떻게 수정하거나 삭제하나요?",
    answer:
      "내가 쓴 글의 상세 화면에만 '수정'과 '삭제' 버튼이 보입니다. 수정 화면에서는 최대 모집 인원을 현재 참여 인원보다 적게 줄일 수 없어요.",
  },
  {
    question: "이름 옆의 파란 체크 마크는 무엇인가요?",
    answer:
      "더존 이메일 인증을 마친 사용자에게 붙는 인증 마크예요. 마이페이지에서 @douzone.com 이메일로 인증번호를 받아 확인하면 표시됩니다.",
  },
  {
    question: "원하는 카테고리가 없어요.",
    answer:
      "글쓰기 창에서 '직접입력'을 선택해 새 카테고리 이름을 적으면 됩니다. 목록 필터에 칩이 없는 카테고리는 '기타'에 모여서 보여요.",
  },
  {
    question: "채팅방은 어디서 다시 볼 수 있나요?",
    answer:
      "'채팅' 탭에 참여 중인 방이 모두 모여 있어요. 같은 사람과는 방이 하나만 만들어지고, 기존 방이 있으면 그 방으로 이어집니다.",
  },
  {
    question: "로그인하지 않으면 무엇을 할 수 있나요?",
    answer:
      "모집 글 목록과 상세 내용을 볼 수 있고, 개선/버그 요청도 보낼 수 있어요. 글쓰기·댓글·채팅·마이페이지처럼 내 정보가 필요한 기능은 로그인이 필요합니다.",
  },
  {
    question: "로그인 없이 보낸 요청의 답변은 어디서 보나요?",
    answer:
      "보낸 기기에 기록이 남아서, 같은 기기에서 '개선/버그 요청' 화면을 다시 열면 답변까지 그대로 보여요. 앱 데이터를 지우거나 다른 기기에서 열면 사라지니, 답변을 꼭 받아야 한다면 접수할 때 이메일을 남겨주세요. 답변이 등록되면 그 주소로 알려드립니다.",
  },
  {
    question: "비밀번호를 잊어버렸어요.",
    answer:
      "로그인 화면의 '비밀번호 찾기'에서 가입한 이메일로 재설정 안내를 받을 수 있어요.",
  },
];

export default function HelpScreen() {
  const navigation = useRootNavigation<"Inquiry">();
  // 열려 있는 FAQ 인덱스 (한 번에 하나만 펼친다)
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = useCallback((index: number) => {
    setOpenFaq((prev) => (prev === index ? null : index));
  }, []);

  // 개선/버그 요청은 로그인 없이도 보낼 수 있다.
  const onPressInquiry = useCallback(() => {
    navigation.navigate("Inquiry");
  }, [navigation]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 히어로 */}
      <View style={styles.hero}>
        {/* 장식용 원 (배경 악센트) */}
        <View style={styles.heroCircleLarge} />
        <View style={styles.heroCircleSmall} />

        <View style={styles.heroBadge}>
          <MaterialCommunityIcons
            name="hand-wave"
            size={26}
            color={theme.colors.primary}
          />
        </View>
        <Text style={styles.heroTitle}>같이타 사용 설명서</Text>
        <Text style={styles.heroSubtitle}>
          같이 이동하고, 같이 사고, 같이 모이는 사내 모집 서비스예요.{"\n"}
          처음이라면 아래 3단계만 따라와 주세요.
        </Text>
      </View>

      {/* 시작하기 3단계 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3단계로 시작하기</Text>
        <View style={styles.stepList}>
          {STEPS.map((step, index) => {
            const isLast = index === STEPS.length - 1;
            return (
              <View key={step.title} style={styles.stepRow}>
                <View style={styles.stepIndicator}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  {isLast ? null : <View style={styles.stepLine} />}
                </View>
                <View style={[styles.stepBody, isLast && styles.stepBodyLast]}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDescription}>{step.description}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* 주요 기능 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>주요 기능</Text>
        <View style={styles.featureGrid}>
          {FEATURES.map((feature) => (
            <View key={feature.title} style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <MaterialCommunityIcons
                  name={feature.icon}
                  size={20}
                  color={theme.colors.primary}
                />
              </View>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 목록 카드 배지 읽는 법 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>목록에서 보이는 표시</Text>
        <View style={styles.badgeCard}>
          {BADGES.map((badge, index) => (
            <View
              key={badge.label}
              style={[styles.badgeRow, index > 0 && styles.badgeRowDivided]}
            >
              <View style={[styles.badgePill, { backgroundColor: badge.background }]}>
                <Text style={[styles.badgePillText, { color: badge.color }]}>
                  {badge.label}
                </Text>
              </View>
              <Text style={styles.badgeMeaning}>{badge.meaning}</Text>
            </View>
          ))}
          <View style={[styles.badgeRow, styles.badgeRowDivided]}>
            <View style={styles.badgeIconPill}>
              <MaterialIcons name="verified" size={18} color={theme.colors.info} />
            </View>
            <Text style={styles.badgeMeaning}>
              더존 이메일 인증을 마친 작성자에게 붙는 인증 마크예요.
            </Text>
          </View>
        </View>
      </View>

      {/* FAQ */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>자주 묻는 질문</Text>
        <View style={styles.faqList}>
          {FAQS.map((faq, index) => {
            const opened = openFaq === index;
            return (
              <TouchableOpacity
                key={faq.question}
                style={[styles.faqItem, opened && styles.faqItemOpened]}
                activeOpacity={0.8}
                onPress={() => toggleFaq(index)}
              >
                <View style={styles.faqHeader}>
                  <Text style={styles.faqQuestionMark}>Q</Text>
                  <Text style={styles.faqQuestion}>{faq.question}</Text>
                  <MaterialIcons
                    name={opened ? "expand-less" : "expand-more"}
                    size={20}
                    color={theme.colors.textMuted}
                  />
                </View>
                {opened ? <Text style={styles.faqAnswer}>{faq.answer}</Text> : null}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 문의 CTA */}
      <View style={styles.ctaCard}>
        <Text style={styles.ctaTitle}>원하는 답이 없었나요?</Text>
        <Text style={styles.ctaDescription}>
          불편한 점이나 버그를 남겨주시면 관리자가 확인한 뒤 답변을 등록해 드려요.
        </Text>
        <TouchableOpacity style={styles.ctaButton} onPress={onPressInquiry}>
          <Feather name="send" size={16} color={theme.colors.white} />
          <Text style={styles.ctaButtonText}>개선/버그 요청 보내기</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    // 웹에서 화면이 넓어도 한 줄이 너무 길어지지 않게 가운데로 모아준다.
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    padding: theme.spacing.xl,
    paddingBottom: 48,
    gap: 28,
  },

  // 히어로
  hero: {
    position: "relative",
    overflow: "hidden",
    padding: theme.spacing.xxl,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.primaryTint,
  },
  heroCircleLarge: {
    position: "absolute",
    top: -46,
    right: -34,
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: "rgba(255, 90, 47, 0.10)",
  },
  heroCircleSmall: {
    position: "absolute",
    bottom: -30,
    right: 52,
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: "rgba(255, 90, 47, 0.07)",
  },
  heroBadge: {
    width: 52,
    height: 52,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.lg,
    ...theme.shadow.card,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.colors.text,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.textSecondary,
  },

  section: {
    gap: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: theme.colors.text,
  },

  // 3단계
  stepList: {
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    ...theme.shadow.card,
  },
  stepRow: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  stepIndicator: {
    alignItems: "center",
    width: 28,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    fontSize: 13,
    fontWeight: "800",
    color: theme.colors.white,
  },
  // 번호 아래로 이어지는 연결선
  stepLine: {
    flex: 1,
    width: 2,
    marginTop: 4,
    borderRadius: 1,
    backgroundColor: theme.colors.primaryTint,
  },
  stepBody: {
    flex: 1,
    paddingBottom: theme.spacing.xl,
    gap: 4,
  },
  stepBodyLast: {
    paddingBottom: 0,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.text,
    paddingTop: 4,
  },
  stepDescription: {
    fontSize: 13,
    lineHeight: 20,
    color: theme.colors.textSecondary,
  },

  // 주요 기능 그리드
  featureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
  },
  featureCard: {
    // 넓은 화면에서는 3열, 좁은 화면에서는 1열로 떨어진다.
    flexGrow: 1,
    flexBasis: 200,
    minWidth: 200,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    gap: 6,
    ...theme.shadow.card,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primaryTint,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.text,
  },
  featureDescription: {
    fontSize: 12,
    lineHeight: 18,
    color: theme.colors.textMuted,
  },

  // 배지 설명
  badgeCard: {
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    ...theme.shadow.card,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  badgeRowDivided: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
  },
  badgePill: {
    width: 62,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
    alignItems: "center",
  },
  badgePillText: {
    fontSize: 12,
    fontWeight: "700",
  },
  badgeIconPill: {
    width: 62,
    alignItems: "center",
  },
  badgeMeaning: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: theme.colors.textSecondary,
  },

  // FAQ
  faqList: {
    gap: theme.spacing.sm,
  },
  faqItem: {
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  faqItemOpened: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  faqQuestionMark: {
    fontSize: 15,
    fontWeight: "800",
    color: theme.colors.primary,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
    lineHeight: 20,
  },
  faqAnswer: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
    fontSize: 13,
    lineHeight: 21,
    color: theme.colors.textSecondary,
  },

  // CTA
  ctaCard: {
    padding: theme.spacing.xxl,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    gap: 6,
    ...theme.shadow.card,
  },
  ctaTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
  },
  ctaDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: theme.colors.textMuted,
    textAlign: "center",
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
  },
  ctaButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.white,
  },
});
