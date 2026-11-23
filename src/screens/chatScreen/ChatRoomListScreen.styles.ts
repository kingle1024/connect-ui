import { StyleSheet } from "react-native";
import theme from "@/modules/theme";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContent: {
    flexGrow: 1,
    paddingTop: 12,
    paddingBottom: 96, // FAB 에 가리지 않도록
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.textMuted,
    marginHorizontal: 20,
    marginBottom: 8,
  },
  roomItem: {
    backgroundColor: theme.colors.surface,
    paddingVertical: 14,
    paddingLeft: 14,
    paddingRight: 8,
    borderRadius: theme.radius.lg,
    marginHorizontal: 16,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    ...theme.shadow.card,
  },
  roomAvatar: {
    width: 46,
    height: 46,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  roomAvatarText: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: "700",
  },
  roomInfo: {
    flex: 1,
    minWidth: 0,
  },
  roomName: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
    letterSpacing: -0.2,
  },
  roomMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  roomMetaText: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginLeft: 4,
  },
  leaveButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.pill,
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingBottom: 60,
  },
  emptyTitle: {
    marginTop: 14,
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.textSecondary,
  },
  emptyListText: {
    textAlign: "center",
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textMuted,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...theme.shadow.fab,
  },
});

export default styles;
