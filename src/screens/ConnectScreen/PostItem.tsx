import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Post } from "@/types";
import localStyles from "./ConnectScreen.styles";
import { MaterialIcons, Feather } from "@expo/vector-icons";
import { formatRelativeTime, getDeadlineLabel } from "@/utils/formatRelativeTime";

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
  let bgColor = "#D1FAE5";
  let iconName: "alarm" | "hourglass-disabled" | "schedule" = "alarm";
  let textColor = "#065F46";

  if (status === "closed") {
    bgColor = "#F3F4F6";
    iconName = "hourglass-disabled";
    textColor = "#6B7280";
  } else if (status === "today") {
    bgColor = "#FEF3C7";
    iconName = "schedule";
    textColor = "#B45309";
  }

  return (
    <TouchableOpacity style={localStyles.postItem} onPress={() => onPressListItem(item.id)}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            alignSelf: "flex-start",
            paddingHorizontal: 10,
            paddingVertical: 2,
            borderRadius: 9999,
            backgroundColor: bgColor,
          }}
        >
          <MaterialIcons name={iconName} size={14} style={{ marginRight: 4, color: textColor }} />
          <Text style={{ fontSize: 12, fontWeight: "500", color: textColor }}>{label}</Text>
        </View>
        <TouchableOpacity onPress={() => onPressMore(item)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="more-vertical" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <View style={{ marginTop: 8, marginBottom: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <MaterialIcons name="pin-drop" size={16} style={{ marginRight: 4, color: "#6B7280" }} />
          <Text style={{ fontSize: 14, color: "#6B7280" }}>도착지: {item.destination}</Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Text
          style={{
            color: "#FF4D00",
            backgroundColor: "rgba(255, 77, 0, 0.1)",
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: 9999,
            fontSize: 14,
            fontWeight: "600",
          }}
        >
          [{item.category}]
        </Text>
        <Text style={{ fontSize: 12, color: "#6b7280" }}>{formatRelativeTime(item.insertDts)}</Text>
      </View>

      <Text style={localStyles.postTitle}>{item.title}</Text>
      <Text style={localStyles.postContent}>{item.content.substring(0, 50)}...</Text>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          borderTopWidth: 1,
          borderTopColor: "#E5E7EB",
          paddingTop: 12,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <MaterialIcons name="maps-ugc" size={18} color="#6B7280" />
          <Text style={{ fontSize: 12, color: "#6B7280" }}>댓글 {item.commentCount}</Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <MaterialIcons name="person" size={18} color="#6B7280" />
          <Text style={{ fontSize: 12, color: "#6B7280" }}>
            {item.currentParticipants}/{item.maxCapacity}명 {item.currentParticipants === item.maxCapacity ? "마감" : "모집"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
