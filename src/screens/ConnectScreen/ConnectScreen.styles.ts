import { StyleSheet } from "react-native";
import theme from "@/modules/theme";

const localStyles = StyleSheet.create({
  header: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: theme.colors.text,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 96, // FAB에 가려지지 않도록 여유 확보
  },
  postItem: {
    backgroundColor: theme.colors.surface,
    padding: 18,
    borderRadius: theme.radius.lg,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.card,
  },
  postTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 4,
    color: theme.colors.text,
    letterSpacing: -0.2,
  },
  postContent: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: 2,
    color: theme.colors.textSecondary,
    marginBottom: 14,
  },
  // 마감 상태 뱃지
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  // 카테고리 라벨
  categoryText: {
    color: theme.colors.primary,
    backgroundColor: theme.colors.primaryTint,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
    fontSize: 13,
    fontWeight: "700",
    overflow: "hidden",
  },
  // 카드 하단 메타 영역
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
    paddingTop: 12,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  // 플로팅 새 글 버튼
  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...theme.shadow.fab,
  },
});

export default localStyles;
