import React, { useEffect, useState, useCallback } from "react";
import { Modal, Pressable, View, Text, TouchableOpacity, FlatList, ActivityIndicator } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import theme from "@/modules/theme";
import { useBackClose } from "@/navigation/webBackStack";

// 채팅방 이름/아바타와 같은 규칙으로 색을 고른다 (같은 사람은 항상 같은 색)
const AVATAR_COLORS = ["#FF8A65", "#4FC3F7", "#81C784", "#BA68C8", "#FFB74D", "#7986CB", "#4DB6AC"];
const avatarColor = (name = "") => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

/**
 * 채팅방 참여자 목록.
 * nameHints: 서버가 이름을 주지 못할 때 대신 쓸 { userId: 표시이름 } (채팅 메시지의 senderName 에서 모은다)
 */
export default function ParticipantsModal({ visible, onClose, roomId, username, API_BASE_URL, nameHints = {}, isNewRoom = false }) {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 휴대폰 뒤로가기(웹)로도 닫는다
  useBackClose(visible, onClose);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/chat/rooms/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) || [];
      setParticipants(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn("참여자 목록 불러오기 실패", e);
      setError("참여자 목록을 불러오지 못했어요.");
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, roomId]);

  useEffect(() => {
    if (visible) load();
  }, [visible, load]);

  // 나 → 방장 → 나머지 순으로 보여준다
  const rows = participants
    .map((p) => {
      const userId = String(p.userId);
      return {
        userId,
        name: p.name || nameHints[userId] || userId,
        leader: !!p.leader,
        me: userId === String(username),
      };
    })
    .sort((a, b) => (b.me - a.me) || (b.leader - a.leader) || a.name.localeCompare(b.name, "ko"));

  // 아직 서버에 만들지 않은 새 방이면 나 혼자다
  const list = rows.length === 0 && isNewRoom && !loading
    ? [{ userId: String(username), name: nameHints[String(username)] || "나", leader: true, me: true }]
    : rows;

  const renderItem = ({ item }) => (
    <View style={s.row}>
      <View style={[s.avatar, { backgroundColor: avatarColor(item.userId) }]}>
        <Text style={s.avatarText}>{(item.name.trim()[0] || "?").toUpperCase()}</Text>
      </View>
      <Text style={s.name} numberOfLines={1}>{item.name}</Text>
      {item.me && <Text style={[s.badge, s.badgeMe]}>나</Text>}
      {item.leader && <Text style={[s.badge, s.badgeLeader]}>방장</Text>}
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose}>
        <Pressable style={s.sheet} onPress={() => {}}>
          <View style={s.header}>
            <Text style={s.title}>참여자 {list.length > 0 ? list.length : ""}</Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel="닫기" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="close" size={22} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {loading && participants.length === 0 ? (
            <View style={s.center}><ActivityIndicator color={theme.colors.primary} /></View>
          ) : error ? (
            <View style={s.center}>
              <Text style={s.muted}>{error}</Text>
              <TouchableOpacity onPress={load} style={s.retry}>
                <Text style={s.retryText}>다시 시도</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={list}
              keyExtractor={(item) => item.userId}
              renderItem={renderItem}
              style={{ maxHeight: 360 }}
              ListEmptyComponent={<View style={s.center}><Text style={s.muted}>참여자가 없어요.</Text></View>}
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = {
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", padding: 24 },
  sheet: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 400,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  title: { flex: 1, fontSize: 17, fontWeight: "700", color: theme.colors.text },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", marginRight: 12 },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  name: { flexShrink: 1, fontSize: 15, color: theme.colors.text },
  badge: { marginLeft: 6, fontSize: 11, fontWeight: "700", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, overflow: "hidden" },
  badgeMe: { color: theme.colors.textSecondary, backgroundColor: theme.colors.field },
  badgeLeader: { color: theme.colors.primary, backgroundColor: theme.colors.primaryTint },
  center: { paddingVertical: 24, alignItems: "center" },
  muted: { color: theme.colors.textMuted, fontSize: 14 },
  retry: { marginTop: 10, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, backgroundColor: theme.colors.primaryTint },
  retryText: { color: theme.colors.primary, fontWeight: "600" },
};
