import React, { useEffect, useState, useMemo } from "react";
import {
  Modal,
  Pressable,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import AuthContext from "@/components/auth/AuthContext";
import { useContext } from "react";

export default function InviteModal({
  visible,
  onClose,
  roomId,
  username,
  client,
  SOCKET_URL,
  API_BASE_URL,
}) {
  const { user: me } = useContext(AuthContext);
  const [friends, setFriends] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [roomParticipants, setRoomParticipants] = useState([]);

  useEffect(() => {
    if (visible) {
      fetchFriends();
      fetchRoomParticipants();
    }
  }, [visible]);

  const fetchFriends = async () => {
    const currentUserId = me?.userId || me?.email || username;
    if (!currentUserId) return setFriends([]);
    setFriendsLoading(true);
    try {
      const accessToken = await AsyncStorage.getItem("accessToken");
      const refreshToken = await AsyncStorage.getItem("refreshToken");
      const token = accessToken || refreshToken;

      const res = await fetch(`${API_BASE_URL}/api/friends/${encodeURIComponent(currentUserId)}/friends`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        const data = await res.json();
        const mapped = Array.isArray(data)
          ? data.map(d => {
              const id = d.friendUserId || d.id || d.userId || (d.email && String(d.email)) || String(d);
              const name = d.friendNickname || d.name || d.nickname || (d.username && String(d.username)) || String(d);
              const identifiers = new Set();
              if (id) identifiers.add(String(id));
              if (name) identifiers.add(String(name));
              if (d.email) identifiers.add(String(d.email));
              if (d.userId) identifiers.add(String(d.userId));
              if (d.friendUserId) identifiers.add(String(d.friendUserId));
              return { id: String(id), name: String(name), avatar: d.avatar, identifiers: Array.from(identifiers) };
            })
          : [];
        setFriends(mapped);
      } else setFriends([]);
    } catch (e) {
      console.warn("fetchFriends error:", e);
      setFriends([]);
    } finally {
      setFriendsLoading(false);
    }
  };

  const fetchRoomParticipants = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/chat/rooms/${encodeURIComponent(roomId)}`);
      if (!res.ok) return;
      const data = await res.json();
      const arr = data.participants || data.members || data.userIds || data.participantIds || [];
      const normalized = Array.isArray(arr) ? arr.map(p => String(p)) : [];
      setRoomParticipants(normalized);
    } catch (e) {
      console.warn('fetchRoomParticipants failed', e);
    }
  };

  const participantsSet = useMemo(() => {
    const s = new Set();
    if (username) s.add(String(username));
    for (const p of roomParticipants || []) s.add(String(p));
    return s;
  }, [roomParticipants, username]);

  const toggleSelectFriend = (id) => {
    const next = new Set(selectedFriends);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedFriends(next);
  };

  const publishInvite = (recipient) => {
    try {
      if (client && client.current && client.current.connected) {
        client.current.publish({
          destination: "/app/chat.inviteUser",
          body: JSON.stringify({ type: "INVITE", roomId, sender: username, recipient, content: "" }),
        });
      } else {
        const temp = new Client({ webSocketFactory: () => new SockJS(SOCKET_URL), onConnect: () => {
          try { temp.publish({ destination: "/app/chat.inviteUser", body: JSON.stringify({ type: "INVITE", roomId, sender: username, recipient, content: "" }) }); } catch(e){console.warn(e)}
          setTimeout(()=>{ try{ temp.deactivate() }catch(e){} },150);
        }, onStompError: ()=>{}, debug: ()=>{} });
        temp.activate();
      }
    } catch (e) { console.warn('publishInvite error', e); }
  };

  const confirmInvite = () => {
    if (!selectedFriends || selectedFriends.size === 0) return;
    Array.from(selectedFriends).forEach(recipient => publishInvite(recipient));
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} onPress={onClose}>
        <Pressable style={{ marginTop: '20%', marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 12, padding: 12, maxHeight: '70%' }} onPress={() => {}}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', flex: 1 }}>친구 초대</Text>
            <TouchableOpacity onPress={onClose}><Text style={{ color: '#666' }}>취소</Text></TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#eee', borderRadius: 8, paddingHorizontal: 8, marginBottom: 8 }}>
            <TextInput placeholder="친구 검색" value={searchQuery} onChangeText={setSearchQuery} style={{ flex: 1, height: 40 }} />
          </View>

          {friendsLoading ? (
            <View style={{ padding: 16 }}><ActivityIndicator size="small" /></View>
          ) : (
            <FlatList data={friends.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()) && !(f.identifiers?.some(id => participantsSet.has(String(id))) || false))}
              keyExtractor={item => item.id}
              style={{ maxHeight: 300 }}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => toggleSelectFriend(item.id)} style={{ flexDirection: 'row', paddingVertical: 10, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f4f4f4' }}>
                  <View style={{ flex: 1 }}><Text style={{ fontSize: 15 }}>{item.name}</Text></View>
                  <View style={{ width: 36, alignItems: 'center' }}>{selectedFriends.has(item.id) ? <Text style={{ color: 'green', fontWeight: '600' }}>✓</Text> : <Text style={{ color: '#ccc' }}>○</Text>}</View>
                </TouchableOpacity>
              )} />
          )}

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
            <TouchableOpacity onPress={confirmInvite} style={{ paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#2e86de', borderRadius: 8 }}>
              <Text style={{ color: '#fff' }}>초대하기</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
