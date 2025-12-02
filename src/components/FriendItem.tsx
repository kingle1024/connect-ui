import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";

type Friend = {
  id: string;
  name: string;
  avatar?: string;
  status?: string;
  online?: boolean;
  favorite?: boolean;
};

type Props = {
  friend: Friend;
  onPress?: () => void;
};

const FriendItem = ({ friend, onPress }: Props) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.avatarContainer}>
        {friend.avatar ? (
          <Image source={{ uri: friend.avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.placeholder]}>
            <Text style={styles.initial}>
              {friend.name?.charAt(0)?.toUpperCase() ?? "?"}
            </Text>
          </View>
        )}
        {friend.online && <View style={styles.onlineDot} />}
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.name}>{friend.name}</Text>
        {friend.status ? <Text style={styles.status}>{friend.status}</Text> : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 16 },
  avatarContainer: { marginRight: 12 },
  avatar: { width: 46, height: 46, borderRadius: 46 / 2 },
  placeholder: { backgroundColor: "#ddd", alignItems: "center", justifyContent: "center" },
  initial: { fontWeight: "600", color: "#333" },
  onlineDot: { position: "absolute", right: -2, bottom: -2, width: 12, height: 12, borderRadius: 6, backgroundColor: "#4cd137", borderWidth: 2, borderColor: "#fff" },
  textContainer: { flex: 1 },
  name: { fontSize: 16, fontWeight: "600", color: "#111" },
  status: { fontSize: 13, color: "#666", marginTop: 2 },
});

export default FriendItem;