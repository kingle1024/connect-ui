import React, { useEffect, useState, useCallback } from "react";
import { Modal, Pressable, View, Text, TouchableOpacity, FlatList, ActivityIndicator } from "react-native";
import Alert from "@blazejkustra/react-native-alert";
import Icon from "react-native-vector-icons/Ionicons";
import theme from "@/modules/theme";
import { useBackClose } from "@/navigation/webBackStack";
import { isGuestUserId } from "@/utils/guest";
import { sendFriendRequest } from "@/utils/chat";

// 채팅방 이름/아바타와 같은 규칙으로 색을 고른다 (같은 사람은 항상 같은 색)
const AVATAR_COLORS = ["#FF8A65", "#4FC3F7", "#81C784", "#BA68C8", "#FFB74D", "#7986CB", "#4DB6AC"];
const avatarColor = (name = "") => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };

/**
 * 채팅방 참여자 목록.
 * nameHints: 서버가 이름을 주지 못할 때 대신 쓸 { userId: 표시이름 } (채팅 메시지의 senderName 에서 모은다)
 * onStartChat(userId, name): 참여자 프로필의 '대화하기' — 그 사람과의 1:1 채팅방으로 간다
 *
 * 다른 참여자를 누르면 카카오톡 프로필처럼 크게 보여주고 친구 추가 / 대화하기 버튼을 띄운다.
 * 1:1 방(2명)은 이미 그 사람과 대화 중이라 '대화하기'는 빼고 친구 추가만 보여준다.
 */
export default function ParticipantsModal({
  visible,
  onClose,
  roomId,
  username,
  API_BASE_URL,
  nameHints = {},
  isNewRoom = false,
  onStartChat,
}) {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // 프로필을 보고 있는 참여자 (null 이면 목록)
  const [selected, setSelected] = useState(null);
  const [sendingRequest, setSendingRequest] = useState(false);
  // 이미 친구인 사람 / 이번에 요청을 보낸 사람 (친구 추가 버튼 상태 표시용)
  const [friendIds, setFriendIds] = useState(() => new Set());
  const [requestedIds, setRequestedIds] = useState(() => new Set());

  const handleClose = useCallback(() => {
    setSelected(null);
    onClose();
  }, [onClose]);

  // 휴대폰 뒤로가기(웹)로도 닫는다
  useBackClose(visible, handleClose);

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

  // 내 친구 목록을 받아 '친구' 표시에 쓴다 (실패해도 버튼은 그대로 동작)
  useEffect(() => {
    if (!visible || !username) return;
    fetch(`${API_BASE_URL}/api/friends/${encodeURIComponent(String(username))}/friends`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setFriendIds(new Set((Array.isArray(data) ? data : []).map((d) => String(d.friendUserId)))))
      .catch(() => {});
  }, [visible, username, API_BASE_URL]);

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

  // 1:1 방(나 + 상대)이면 '대화하기'는 필요 없다
  const isOneToOne = list.length <= 2;

  const addFriend = async () => {
    if (!selected || sendingRequest) return;
    // 게스트끼리도 친구를 맺을 수 있다. 게스트가 회원가입하면 친구 관계가 회원 계정으로 옮겨진다.
    setSendingRequest(true);
    try {
      await sendFriendRequest(String(username), selected.userId);
      setRequestedIds((prev) => new Set(prev).add(selected.userId));
      Alert.alert("친구 요청 완료", `${selected.name}님에게 친구 요청을 보냈습니다.`);
    } catch (e) {
      Alert.alert("친구 요청 실패", e?.message || "친구 요청 중 오류가 발생했습니다.");
    } finally {
      setSendingRequest(false);
    }
  };

  const startChat = () => {
    if (!selected) return;
    const target = selected;
    handleClose();
    onStartChat?.(target.userId, target.name);
  };

  const renderItem = ({ item }) => {
    const avatar = (
      <View style={[s.avatar, { backgroundColor: avatarColor(item.userId) }]}>
        <Text style={s.avatarText}>{(item.name.trim()[0] || "?").toUpperCase()}</Text>
      </View>
    );
    const body = (
      <>
        {avatar}
        <Text style={s.name} numberOfLines={1}>{item.name}</Text>
        {item.me && <Text style={[s.badge, s.badgeMe]}>나</Text>}
        {item.leader && <Text style={[s.badge, s.badgeLeader]}>방장</Text>}
      </>
    );
    if (item.me) return <View style={s.row}>{body}</View>;
    return (
      <TouchableOpacity
        style={s.row}
        onPress={() => setSelected(item)}
        activeOpacity={0.6}
        accessibilityLabel={`${item.name} 프로필 보기`}
      >
        {body}
        <Icon name="chevron-forward" size={18} color={theme.colors.textMuted} style={{ marginLeft: "auto" }} />
      </TouchableOpacity>
    );
  };

  // 카카오톡 프로필처럼: 색 배경 위에 큰 아바타와 이름, 아래에 동그란 동작 버튼들
  const renderProfile = () => {
    const color = avatarColor(selected.userId);
    return (
      <Pressable style={s.profileSheet} onPress={() => {}}>
        <View style={[s.profileCover, { backgroundColor: color }]}>
          <View style={s.profileTopBar}>
            <TouchableOpacity onPress={() => setSelected(null)} accessibilityLabel="참여자 목록으로" hitSlop={HIT_SLOP}>
              <Icon name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleClose} accessibilityLabel="닫기" hitSlop={HIT_SLOP}>
              <Icon name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={s.profileAvatar}>
            <Text style={[s.profileAvatarText, { color }]}>{(selected.name.trim()[0] || "?").toUpperCase()}</Text>
          </View>
          <View style={s.profileNameRow}>
            <Text style={s.profileName} numberOfLines={1}>{selected.name}</Text>
            {selected.leader && <Text style={s.profileLeader}>방장</Text>}
          </View>
          {isGuestUserId(selected.userId) && <Text style={s.profileSub}>게스트</Text>}
        </View>
        <View style={s.profileActions}>
          {friendIds.has(selected.userId) ? (
            <View style={s.action} accessibilityLabel="이미 친구">
              <View style={s.actionIcon}>
                <Icon name="people" size={24} color={theme.colors.primary} />
              </View>
              <Text style={s.actionText}>친구</Text>
            </View>
          ) : requestedIds.has(selected.userId) ? (
            <View style={s.action} accessibilityLabel="친구 요청 보냄">
              <View style={s.actionIcon}>
                <Icon name="checkmark" size={24} color={theme.colors.primary} />
              </View>
              <Text style={s.actionText}>요청 보냄</Text>
            </View>
          ) : (
            <TouchableOpacity style={s.action} onPress={addFriend} disabled={sendingRequest} accessibilityLabel="친구 추가">
              <View style={s.actionIcon}>
                {sendingRequest
                  ? <ActivityIndicator color={theme.colors.primary} />
                  : <Icon name="person-add-outline" size={24} color={theme.colors.primary} />}
              </View>
              <Text style={s.actionText}>친구 추가</Text>
            </TouchableOpacity>
          )}
          {!isOneToOne && (
            <TouchableOpacity style={s.action} onPress={startChat} accessibilityLabel="대화하기">
              <View style={s.actionIcon}>
                <Icon name="chatbubble-outline" size={24} color={theme.colors.primary} />
              </View>
              <Text style={s.actionText}>대화하기</Text>
            </TouchableOpacity>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={s.backdrop} onPress={handleClose}>
        {selected ? renderProfile() : (
          <Pressable style={s.sheet} onPress={() => {}}>
            <View style={s.header}>
              <Text style={s.title}>참여자 {list.length > 0 ? list.length : ""}</Text>
              <TouchableOpacity onPress={handleClose} accessibilityLabel="닫기" hitSlop={HIT_SLOP}>
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
        )}
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

  // 프로필
  profileSheet: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 400,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    overflow: "hidden",
  },
  profileCover: { alignItems: "center", paddingTop: 14, paddingBottom: 28, paddingHorizontal: 16 },
  profileTopBar: { alignSelf: "stretch", flexDirection: "row", justifyContent: "space-between", marginBottom: 40 },
  profileAvatar: {
    width: 96,
    height: 96,
    borderRadius: 34,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  profileAvatarText: { fontSize: 40, fontWeight: "800" },
  profileNameRow: { flexDirection: "row", alignItems: "center", maxWidth: "100%" },
  profileName: { flexShrink: 1, color: "#fff", fontSize: 20, fontWeight: "700" },
  profileLeader: {
    marginLeft: 6,
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: "hidden",
  },
  profileSub: { marginTop: 4, color: "rgba(255,255,255,0.85)", fontSize: 13 },
  profileActions: { flexDirection: "row", justifyContent: "center", paddingVertical: 18, gap: 36 },
  action: { alignItems: "center", minWidth: 64 },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.primaryTint,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  actionText: { fontSize: 13, color: theme.colors.text, fontWeight: "600" },
};
