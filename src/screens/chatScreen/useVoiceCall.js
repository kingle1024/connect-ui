import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import Alert from "@blazejkustra/react-native-alert";

/**
 * 채팅방 음성 통화 (2명이면 1:1, 여러 명이면 그룹 통화).
 *
 * - 음성은 브라우저끼리 WebRTC 로 직접 주고받는다 (참가자 모두가 서로 연결되는 mesh 방식).
 * - 서버(/app/call.signal → /topic/call/{roomId})는 누가 들어왔는지와 연결 정보만 전달한다.
 * - 새로 들어온 사람이 기존 참가자 모두에게 offer 를 보내고, 기존 참가자는 answer 만 한다
 *   (양쪽이 동시에 offer 를 보내 꼬이는 일을 막는다).
 * - 지금은 웹에서만 동작한다 (앱은 react-native-webrtc 가 필요).
 */
const ICE_SERVERS = [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }];

export const isCallSupported = () =>
  Platform.OS === "web" &&
  typeof window !== "undefined" &&
  typeof window.RTCPeerConnection === "function" &&
  !!navigator?.mediaDevices?.getUserMedia;

export default function useVoiceCall({ client, roomId, username, API_BASE_URL, ensureJoined, onCallStarted }) {
  const me = String(username);
  // 서버가 알려준 지금 통화 중인 사람들 (나 포함 가능)
  const [callParticipants, setCallParticipants] = useState([]);
  // 서버가 함께 보내 주는 참가자 표시 이름 { userId: name }
  const [callNames, setCallNames] = useState({});
  const [inCall, setInCall] = useState(false);
  const [joining, setJoining] = useState(false);
  const [muted, setMuted] = useState(false);
  // 누가 통화를 시작했을 때 받는 알림 { from }
  const [incoming, setIncoming] = useState(null);
  // 상대별 연결 상태 { userId: 'connecting' | 'connected' | 'failed' }
  const [peerStates, setPeerStates] = useState({});

  const inCallRef = useRef(false);
  const localStreamRef = useRef(null);
  const peersRef = useRef({}); // userId -> RTCPeerConnection
  const pendingIceRef = useRef({}); // userId -> candidate[] (remoteDescription 전에 온 것)
  const audioRef = useRef({}); // userId -> HTMLAudioElement

  const publish = useCallback(
    (signal) => {
      const stomp = client.current;
      if (!stomp || !stomp.connected) return false;
      stomp.publish({ destination: "/app/call.signal", body: JSON.stringify({ roomId, from: me, ...signal }) });
      return true;
    },
    [client, roomId, me]
  );

  const setPeerState = (userId, state) =>
    setPeerStates((prev) => {
      if (state === null) {
        const next = { ...prev };
        delete next[userId];
        return next;
      }
      return { ...prev, [userId]: state };
    });

  const closePeer = useCallback((userId) => {
    const pc = peersRef.current[userId];
    if (pc) {
      try { pc.close(); } catch {}
      delete peersRef.current[userId];
    }
    delete pendingIceRef.current[userId];
    const audio = audioRef.current[userId];
    if (audio) {
      audio.srcObject = null;
      audio.remove?.();
      delete audioRef.current[userId];
    }
    setPeerState(userId, null);
  }, []);

  const createPeer = useCallback(
    (userId) => {
      if (peersRef.current[userId]) return peersRef.current[userId];
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      peersRef.current[userId] = pc;
      setPeerState(userId, "connecting");

      localStreamRef.current?.getTracks().forEach((t) => pc.addTrack(t, localStreamRef.current));

      pc.onicecandidate = (e) => {
        if (e.candidate) publish({ type: "ice", to: userId, candidate: e.candidate.toJSON() });
      };
      pc.ontrack = (e) => {
        let audio = audioRef.current[userId];
        if (!audio) {
          audio = document.createElement("audio");
          audio.autoplay = true;
          audio.setAttribute("playsinline", "");
          audio.dataset.callPeer = userId;
          audio.style.display = "none";
          document.body.appendChild(audio);
          audioRef.current[userId] = audio;
        }
        audio.srcObject = e.streams[0];
        audio.play?.().catch(() => {});
      };
      pc.onconnectionstatechange = () => {
        const s = pc.connectionState;
        if (s === "connected") setPeerState(userId, "connected");
        else if (s === "failed") setPeerState(userId, "failed");
        else if (s === "connecting" || s === "new") setPeerState(userId, "connecting");
      };
      return pc;
    },
    [publish]
  );

  const flushIce = async (userId) => {
    const pc = peersRef.current[userId];
    const queued = pendingIceRef.current[userId] || [];
    delete pendingIceRef.current[userId];
    for (const c of queued) {
      try { await pc.addIceCandidate(c); } catch {}
    }
  };

  const cleanup = useCallback(() => {
    Object.keys(peersRef.current).forEach(closePeer);
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    inCallRef.current = false;
    setInCall(false);
    setMuted(false);
    setPeerStates({});
  }, [closePeer]);

  // 서버가 /topic/call/{roomId} 로 보낸 신호 처리
  const handleSignal = useCallback(
    async (signal) => {
      const { type, from } = signal || {};
      if (!type) return;
      try {
        if (type === "join" || type === "leave") {
          const list = (signal.participants || []).map(String);
          setCallParticipants(list);
          if (signal.names) setCallNames((prev) => ({ ...prev, ...signal.names }));
          if (list.length === 0) setIncoming(null);

          if (type === "join") {
            if (from === me) {
              // 내가 들어간 것이 확인되면 이미 통화 중인 사람들에게 연결을 건다
              if (!inCallRef.current) return;
              for (const other of list) {
                if (other === me || peersRef.current[other]) continue;
                const pc = createPeer(other);
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                publish({ type: "offer", to: other, sdp: pc.localDescription.toJSON() });
              }
            } else if (signal.started && !inCallRef.current) {
              setIncoming({ from });
            }
          } else {
            if (from !== me) closePeer(from);
            else if (inCallRef.current) cleanup(); // 다른 기기/탭에서 내가 나간 경우
          }
          return;
        }

        if (signal.to !== me) return;

        if (type === "full") {
          cleanup();
          Alert.alert("통화", signal.error || "통화 인원이 가득 찼어요.");
          return;
        }
        if (!inCallRef.current) return;

        if (type === "offer") {
          closePeer(from); // 상대가 다시 들어온 경우 새로 연결
          const pc = createPeer(from);
          await pc.setRemoteDescription(signal.sdp);
          await flushIce(from);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          publish({ type: "answer", to: from, sdp: pc.localDescription.toJSON() });
        } else if (type === "answer") {
          const pc = peersRef.current[from];
          if (pc && !pc.currentRemoteDescription) {
            await pc.setRemoteDescription(signal.sdp);
            await flushIce(from);
          }
        } else if (type === "ice") {
          const pc = peersRef.current[from];
          if (pc && pc.remoteDescription) {
            await pc.addIceCandidate(signal.candidate);
          } else {
            (pendingIceRef.current[from] ||= []).push(signal.candidate);
          }
        }
      } catch (e) {
        console.warn("통화 신호 처리 실패", type, e);
      }
    },
    [me, createPeer, closePeer, cleanup, publish]
  );

  const joinCall = useCallback(async () => {
    if (inCallRef.current || joining) return;
    if (!isCallSupported()) {
      Alert.alert("통화", "이 기기(브라우저)에서는 통화를 지원하지 않아요.\n최신 크롬·사파리에서 다시 시도해 주세요.");
      return;
    }
    if (!client.current?.connected) {
      Alert.alert("통화", "채팅 서버와 연결 중이에요. 잠시 후 다시 시도해 주세요.");
      return;
    }
    setJoining(true);
    try {
      await ensureJoined?.();
      const startingNew = callParticipants.filter((p) => p !== me).length === 0;
      try {
        localStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      } catch (e) {
        Alert.alert("마이크 권한", "통화하려면 마이크 사용을 허용해 주세요.\n브라우저 주소창의 권한 설정에서 바꿀 수 있어요.");
        return;
      }
      inCallRef.current = true;
      setInCall(true);
      setIncoming(null);
      if (!publish({ type: "join" })) {
        cleanup();
        Alert.alert("통화", "채팅 서버와 연결이 끊겼어요. 다시 시도해 주세요.");
        return;
      }
      if (startingNew) onCallStarted?.();
    } finally {
      setJoining(false);
    }
  }, [joining, client, ensureJoined, callParticipants, me, publish, cleanup, onCallStarted]);

  const leaveCall = useCallback(() => {
    if (!inCallRef.current) return;
    publish({ type: "leave" });
    cleanup();
  }, [publish, cleanup]);

  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const next = !muted;
    stream.getAudioTracks().forEach((t) => (t.enabled = !next));
    setMuted(next);
  }, [muted]);

  // 방에 들어오면 진행 중인 통화가 있는지 확인한다
  useEffect(() => {
    let alive = true;
    fetch(`${API_BASE_URL}/api/chat/rooms/${encodeURIComponent(roomId)}/call`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { 
        if (!alive || !d?.participants) return;
        setCallParticipants(d.participants.map(String));
        if (d.names) setCallNames((prev) => ({ ...prev, ...d.names }));
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [API_BASE_URL, roomId]);

  // 화면을 떠나면 통화도 끝낸다
  const leaveRef = useRef(leaveCall);
  leaveRef.current = leaveCall;
  useEffect(() => () => leaveRef.current(), []);

  // 브라우저 탭을 닫을 때도 나간다 (서버도 소켓 끊김으로 정리하지만 더 빨리 알린다)
  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const onUnload = () => leaveRef.current();
    window.addEventListener("pagehide", onUnload);
    return () => window.removeEventListener("pagehide", onUnload);
  }, []);

  return {
    callParticipants,
    callNames,
    inCall,
    joining,
    muted,
    incoming,
    peerStates,
    handleSignal,
    joinCall,
    leaveCall,
    toggleMute,
    dismissIncoming: () => setIncoming(null),
  };
}
