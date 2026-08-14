import { Platform, StyleSheet } from "react-native";
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
  // 카테고리 필터 바
  // filterHeaderRow(가로 배치) 안에서 남는 폭을 모두 차지하되
  // 칩이 많아도 오른쪽 필터 버튼을 밀어내지 않도록 줄어들 수 있게 한다.
  filterBarScroll: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
  },
  filterBar: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 12,
  },
  filterChip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterChipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  filterChipTextSelected: {
    color: theme.colors.white,
    fontWeight: "700",
  },
  // 카테고리 칩 + 검색 필터 버튼을 한 줄에 배치
  filterHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 16,
  },
  filterIconButton: {
    width: 36,
    height: 36,
    marginLeft: 4,
    marginBottom: 12, // filterBar의 paddingBottom과 맞춘다
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  // 필터가 적용 중임을 나타내는 점
  filterActiveDot: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  // 검색 필터 시트
  filterSheetContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  filterSheetTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: 2,
  },
  filterSheetLabel: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  searchFieldRow: {
    flexDirection: "row",
    gap: 6,
  },
  searchFieldChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchFieldChipText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
    paddingVertical: 2,
    // 웹에서 포커스 시 파란 외곽선이 생기는 것 방지
    ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as any) : {}),
  },
  // 모집 미완료(정원 미달 + 마감 전)만 보기 체크박스
  openOnlyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  openOnlyText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  filterSheetActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  applyButton: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
  },
  applyButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.white,
  },
  // 필터 결과가 없을 때
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textMuted,
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
