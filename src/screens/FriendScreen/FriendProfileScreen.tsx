import React from "react";
import { View, Text, Image, StyleSheet, SafeAreaView } from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";

type Friend = {
  id: string;
  name: string;
  avatar?: string;
  status?: string;
  online?: boolean;
  favorite?: boolean;
};

type RouteParams = {
  FriendProfile: { friend: Friend };
};

const FriendProfileScreen = () => {
  const route = useRoute<RouteProp<RouteParams, "FriendProfile">>();
  const { friend } = route.params;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        {friend.avatar ? (
          <Image source={{ uri: friend.avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.placeholder]}>
            <Text style={styles.initial}>{friend.name.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.info}>
          <Text style={styles.name}>{friend.name}</Text>
          {friend.status ? <Text style={styles.status}>{friend.status}</Text> : null}
        </View>
      </View>

      {/* 프로필 하단에 더 많은 액션/정보를 추가할 수 있음 */}
      <View style={styles.body}>
        <Text style={{ color: "#666" }}>여기에 추가 정보/대화 시작 버튼 등을 배치하세요.</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  header: { flexDirection: "row", padding: 16, alignItems: "center" },
  avatar: { width: 92, height: 92, borderRadius: 46 },
  placeholder: { backgroundColor: "#ddd", alignItems: "center", justifyContent: "center" },
  initial: { fontSize: 32, color: "#333", fontWeight: "700" },
  info: { marginLeft: 16 },
  name: { fontSize: 20, fontWeight: "700" },
  status: { color: "#666", marginTop: 6 },
  body: { padding: 16 },
});

export default FriendProfileScreen;