import React from "react";
import { Modal, Pressable, View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import theme from "@/modules/theme";

const AVATAR_COLORS = ["#FF8A65", "#4FC3F7", "#81C784", "#BA68C8", "#FFB74D", "#7986CB", "#4DB6AC"];
const avatarColor = (name = "") => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const STATE_TEXT = { connecting: "연결 중", connected: "통화 중", failed: "연결 실패" };

/**
 * 채팅방 헤더 아래의 통화 표시줄.
 *  - 통화에 안 들어갔는데 누가 통화 중이면: "통화 중 · N명 [참여]"
 *  - 통화 중이면: 참가자 목록 + 음소거 / 나가기
 * 그리고 누가 통화를 시작하면 참여/거절을 묻는 창을 띄운다.
 */
export default function CallPanel({ call, me, nameOf }) {
  const { callParticipants, inCall, joining, muted, incoming, peerStates } = call;
  const others = callParticipants.filter((p) => p !== me);

  const incomingModal = (
    <Modal visible={!!incoming && !inCall} transparent animationType="fade" onRequestClose={call.dismissIncoming}>
      <Pressable style={s.backdrop} onPress={call.dismissIncoming}>
        <Pressable style={s.ringSheet} onPress={() => {}}>
          <View style={[s.ringAvatar, { backgroundColor: avatarColor(incoming?.from || "") }]}>
            <Icon name="call" size={30} color="#fff" />
          </View>
          <Text style={s.ringTitle} numberOfLines={2}>
            {incoming ? `${nameOf(incoming.from)}님이 통화를 시작했어요` : ""}
          </Text>
          <Text style={s.ringSub}>
            {callParticipants.length > 1 ? `${callParticipants.length}명 통화 중` : "참여하면 바로 연결돼요"}
          </Text>
          <View style={s.ringButtons}>
            <TouchableOpacity style={[s.ringBtn, s.ringDecline]} onPress={call.dismissIncoming} accessibilityLabel="거절">
              <Icon name="close" size={26} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={[s.ringBtn, s.ringAccept]} onPress={call.joinCall} accessibilityLabel="통화 참여">
              <Icon name="call" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );

  if (!inCall) {
    return (
      <>
        {others.length > 0 && (
          <View style={s.banner}>
            <Icon name="call" size={16} color={theme.colors.primary} />
            <Text style={s.bannerText} numberOfLines={1}>
              통화 중 · {others.length}명 ({others.map(nameOf).join(", ")})
            </Text>
            <TouchableOpacity style={s.joinBtn} onPress={call.joinCall} disabled={joining} accessibilityLabel="통화 참여">
              {joining ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.joinText}>참여</Text>}
            </TouchableOpacity>
          </View>
        )}
        {incomingModal}
      </>
    );
  }

  return (
    <View style={s.panel}>
      <View style={s.panelHead}>
        <Icon name="call" size={16} color="#fff" />
        <Text style={s.panelTitle}>
          {others.length === 0 ? "상대를 기다리는 중…" : others.length === 1 ? "1:1 통화 중" : `그룹 통화 중 · ${others.length + 1}명`}
        </Text>
      </View>
      {others.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.people}>
          {others.map((p) => {
            const state = peerStates[p] || "connecting";
            const name = nameOf(p);
            return (
              <View key={p} style={s.person} accessibilityLabel={`${name} ${STATE_TEXT[state]}`}>
                <View style={[s.personAvatar, { backgroundColor: avatarColor(p) }, state === "connected" && s.personLive]}>
                  <Text style={s.personInitial}>{(name.trim()[0] || "?").toUpperCase()}</Text>
                </View>
                <Text style={s.personName} numberOfLines={1}>{name}</Text>
                <Text style={[s.personState, state === "failed" && { color: "#FFB4A8" }]}>{STATE_TEXT[state]}</Text>
              </View>
            );
          })}
        </ScrollView>
      )}
      <View style={s.controls}>
        <TouchableOpacity style={[s.ctrl, muted && s.ctrlOn]} onPress={call.toggleMute} accessibilityLabel={muted ? "음소거 해제" : "음소거"}>
          <Icon name={muted ? "mic-off" : "mic"} size={22} color={muted ? theme.colors.text : "#fff"} />
        </TouchableOpacity>
        <TouchableOpacity style={[s.ctrl, s.hangup]} onPress={call.leaveCall} accessibilityLabel="통화 나가기">
          <Icon name="call" size={22} color="#fff" style={{ transform: [{ rotate: "135deg" }] }} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = {
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: theme.colors.primaryTint,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  bannerText: { flex: 1, color: theme.colors.text, fontSize: 14, fontWeight: "600" },
  joinBtn: { backgroundColor: theme.colors.primary, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6, minWidth: 56, alignItems: "center" },
  joinText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  panel: { backgroundColor: "#2B2D31", paddingTop: 10, paddingBottom: 12 },
  panelHead: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14 },
  panelTitle: { color: "#fff", fontWeight: "700", fontSize: 14 },
  people: { paddingHorizontal: 10, paddingTop: 10, gap: 4 },
  person: { width: 68, alignItems: "center" },
  personAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "transparent" },
  personLive: { borderColor: "#4ADE80" },
  personInitial: { color: "#fff", fontWeight: "700", fontSize: 17 },
  personName: { color: "#fff", fontSize: 12, marginTop: 4, maxWidth: 64 },
  personState: { color: "#B5BAC1", fontSize: 11 },
  controls: { flexDirection: "row", justifyContent: "center", gap: 24, marginTop: 10 },
  ctrl: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.15)" },
  ctrlOn: { backgroundColor: "#fff" },
  hangup: { backgroundColor: "#E5484D" },

  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", padding: 24 },
  ringSheet: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 340,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  ringAvatar: { width: 68, height: 68, borderRadius: 34, alignItems: "center", justifyContent: "center" },
  ringTitle: { marginTop: 14, fontSize: 17, fontWeight: "700", color: theme.colors.text, textAlign: "center" },
  ringSub: { marginTop: 6, fontSize: 13, color: theme.colors.textMuted },
  ringButtons: { flexDirection: "row", gap: 40, marginTop: 20 },
  ringBtn: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  ringDecline: { backgroundColor: "#E5484D" },
  ringAccept: { backgroundColor: "#22C55E" },
};
