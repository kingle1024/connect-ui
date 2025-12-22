// FriendsListScreen.styles.ts
import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  header: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { fontSize: 20, fontWeight: "700" },
  headerRight: { flexDirection: "row", alignItems: "center" },
  iconBtn: { marginLeft: 12 },

  searchWrap: {
    marginHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    paddingHorizontal: 12,
    borderRadius: 8,
    height: 42,
    marginBottom: 8,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15 },

  sectionHeader: { paddingHorizontal: 16, paddingVertical: 6, backgroundColor: "#fff" },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: "#666" },

  separator: { height: StyleSheet.hairlineWidth, backgroundColor: "#eee", marginLeft: 74 },

  empty: { alignItems: "center", paddingTop: 40 },
  emptyText: { color: "#888" },

  // Modal / action sheet
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  actionSheet: {
    padding: 16,
    backgroundColor: "#fff",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  actionButton: {
    paddingVertical: 14,
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
  actionText: { fontSize: 16 },
  deleteText: { color: "red", fontWeight: "700" },
});

export default styles;