import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Feather } from "@expo/vector-icons";

type Friend = {
  id: string;
  name: string;
  avatar?: string;
  status?: string;
  online?: boolean;
  favorite?: boolean;

  requestId?: string;
  senderId?: string;
  receiverId?: string;
  requestStatus?: 'pending' | 'accepted' | 'rejected';
};

type FriendItemProps = {
  friend: Friend; // Friend 타입 사용
  onPress: (friend: Friend) => void; // Friend 타입 사용
  type?: 'friend' | 'request';
  onAccept?: () => void;
  onReject?: () => void;
  isProcessing?: boolean;
};


const FriendItem = ({
  friend,
  onPress,
  type = 'friend',
  onAccept,
  onReject,
  isProcessing
}: FriendItemProps) => {
  const isFriendRequest = type === 'request';

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={!isFriendRequest ? () => onPress(friend) : undefined}
    >
      <View style={styles.avatarContainer}>
        {friend.avatar ? (
          <Image source={{ uri: friend.avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.defaultAvatar}>
            <Text style={styles.defaultAvatarText}>
              {friend.name?.charAt(0)?.toUpperCase() ?? "?"}
            </Text>
          </View>
        )}
        {type === 'friend' && friend.online && <View style={styles.onlineIndicator} />}
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.name}>{friend.name}</Text>
        {friend.status && type === 'friend' && <Text style={styles.status}>{friend.status}</Text>}
        {isFriendRequest && friend.requestStatus === 'pending' && (
          <Text style={styles.status}>친구요청</Text> // 요청 상태 표시
        )}
      </View>
      {isFriendRequest && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={onAccept}
            disabled={isProcessing}
          >
            {isProcessing ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.buttonText}>수락</Text>}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.declineButton]}
            onPress={onReject}
            disabled={isProcessing}
          >
            {isProcessing ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.buttonText}>거절</Text>}
          </TouchableOpacity>
        </View>
      )}

      {/* 친구 타입일 때만 화살표 아이콘 표시 */}
      {!isFriendRequest && (
        <View style={styles.arrowContainer}>
          <Feather name="chevron-right" size={20} color="#bbb" />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eee',
  },
  defaultAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#a0a0a0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultAvatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50', // 초록색
    borderWidth: 2,
    borderColor: '#fff',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  status: { // 친구의 상태 메시지 또는 요청 상태를 표시
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  arrowContainer: {
    paddingLeft: 10,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#4CAF50', // 초록색
  },
  declineButton: {
    backgroundColor: '#F44336', // 빨간색
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  }
});


export default FriendItem;