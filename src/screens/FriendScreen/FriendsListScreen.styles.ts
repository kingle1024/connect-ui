// FriendsListScreen.styles.ts
import { StyleSheet } from "react-native";
import theme from "@/modules/theme";

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.surface },
  header: {
    height: 56,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  headerRight: { flexDirection: "row", alignItems: "center" },
  iconBtn: { marginLeft: 16 },

  searchWrap: {
    marginHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.field,
    paddingHorizontal: 14,
    borderRadius: theme.radius.md,
    height: 44,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: theme.colors.text,
  },

  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 6,
    backgroundColor: theme.colors.surface,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.textMuted,
  },

  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.divider,
    marginLeft: 76,
  },

  empty: { alignItems: "center", paddingTop: 48 },
  emptyText: { color: theme.colors.textMuted, fontSize: 15 },

  // Modal / action sheet
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(25, 31, 40, 0.5)",
    justifyContent: "flex-end",
  },
  actionSheet: {
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
  },
  actionButton: {
    paddingVertical: 15,
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.divider,
  },
  actionText: { fontSize: 16, color: theme.colors.text },
  deleteText: { color: theme.colors.danger, fontWeight: "700" },
});

export default styles;
