import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Post } from "@/types";
import localStyles from "./ConnectScreen.styles";
import { MaterialIcons, Feather } from "@expo/vector-icons";
import { formatRelativeTime, getDeadlineLabel } from "@/utils/formatRelativeTime";
import theme from "@/modules/theme";
import VerifiedBadge from "@/components/VerifiedBadge";

type Props = {
  item: Post;
  now: any;
  me: any;
  insets: { top: number };
  onPressListItem: (id: number) => void;
  onPressMore: (item: Post) => void;
};

export default function PostItem({ item, now, me, insets, onPressListItem, onPressMore }: Props) {
  const { label, status } = getDeadlineLabel(now, item.deadlineDts);
  let bgColor = theme.colors.successTint;
  let iconName: "alarm" | "hourglass-disabled" | "schedule" = "alarm";
  let textColor = theme.colors.success;

  if (status === "closed") {
    bgColor = theme.colors.field;
    iconName = "hourglass-disabled";
    textColor = theme.colors.textMuted;
  } else if (status === "today") {
    bgColor = theme.colors.warningTint;
    iconName = "schedule";
    textColor = theme.colors.warning;
  }

  const isFull = item.currentParticipants === item.maxCapacity;

  return (
    <TouchableOpacity
      style={localStyles.postItem}
      onPress={() => onPressListItem(item.id)}
      activeOpacity={0.7}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <View style={[localStyles.badge, { backgroundColor: bgColor }]}>
          <MaterialIcons name={iconName} size={14} style={{ marginRight: 4, color: textColor }} />
          <Text style={[localStyles.badgeText, { color: textColor }]}>{label}</Text>
        </View>
        <TouchableOpacity onPress={() => onPressMore(item)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="more-vertical" size={20} color={theme.colors.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={{ marginTop: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={localStyles.categoryText}>{item.category}</Text>
          <View style={localStyles.metaRow}>
            <MaterialIcons name="pin-drop" size={14} color={theme.colors.textMuted} />
            <Text style={{ fontSize: 13, color: theme.colors.textSecondary }}>{item.destination}</Text>
          </View>
        </View>
        <Text style={localStyles.metaText}>{formatRelativeTime(item.insertDts)}</Text>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {/* 제목이 길어질 수 있으므로 인증 마크는 제목 왼쪽에 고정 */}
        {item.verified ? (
          <VerifiedBadge size={16} style={{ marginRight: 4, marginTop: 8 }} />
        ) : null}
        <Text style={[localStyles.postTitle, { flexShrink: 1 }]}>{item.title}</Text>
      </View>
      <Text style={localStyles.postContent} numberOfLines={2}>
        {item.content}
      </Text>

      <View style={localStyles.cardFooter}>
        <View style={localStyles.metaRow}>
          <MaterialIcons name="maps-ugc" size={16} color={theme.colors.textMuted} />
          <Text style={localStyles.metaText}>댓글 {item.commentCount}</Text>
        </View>

        <View style={localStyles.metaRow}>
          <MaterialIcons name="person" size={16} color={isFull ? theme.colors.danger : theme.colors.textMuted} />
          <Text style={[localStyles.metaText, isFull && { color: theme.colors.danger, fontWeight: "600" }]}>
            {item.currentParticipants}/{item.maxCapacity}명 {isFull ? "마감" : "모집중"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
