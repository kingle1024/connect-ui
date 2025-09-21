import { RouteProp, useRoute } from "@react-navigation/native";
import { FlatList, Image, Text, View, StyleSheet } from "react-native";
import { useCallback, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Comment, Post } from "@/types";
import { POST_COMMENTS } from "@/mock/data";
import { MaterialIcons } from "@expo/vector-icons";

type ConnectDetailRouteProp = RouteProp<{ params: { item: Post } }, "params">;

const ConnectDetail = () => {
  const routes = useRoute<ConnectDetailRouteProp>();
  const [comments, setComments] = useState<Comment[]>(POST_COMMENTS);

  const ListHeaderComponent = () => {
    return (
      <>
        {/* 프로필 */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: "#F3F4F6",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 16,
            }}
          >
            <MaterialIcons name="person" size={36} color="#9CA3AF" />
          </View>
          <View>
            <Text
              style={{
                fontWeight: "bold",
                fontSize: 18,
                color: "#111827",
              }}
            >
              아이디
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: "#6B7280",
                paddingTop: 5,
              }}
            >
              방금
            </Text>
          </View>
        </View>

        {/* 본문 */}
        <View style={{ marginTop: 10 }}>
          <View style={{ paddingBottom: 20 }}>
            <Text
              style={{
                fontSize: 24,
                fontWeight: "bold",
                marginBottom: 8,
                color: "#111827",
              }}
            >
              {routes.params.item.title}
            </Text>
          </View>
          <Text style={{ fontSize: 16, marginBottom: 24, color: "#6B7280" }}>
            {routes.params.item.content}
          </Text>
          <View style={{ height: 200 }} />
        </View>

        {/* 구분선 + 액션 */}
        <View
          style={{
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: "#D1D5DB",
            paddingVertical: 12,
            marginBottom: 24,
            flexDirection: "row",
            gap: 16,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Ionicons
              name="chatbubble-outline"
              size={18}
              color="#6B7280"
              style={{ marginRight: 4 }}
            />
            <Text style={{ fontSize: 14, color: "#6B7280" }}>댓글</Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <FontAwesome6
              name="arrow-right-from-bracket"
              size={18}
              color="#6B7280"
              style={{ marginRight: 4 }}
            />
            <Text style={{ fontSize: 14, color: "#6B7280" }}>대화하기</Text>
          </View>
        </View>
      </>
    );
  };

  const renderItem = ({ item }: { item: Comment }) => {
    return (
      <View
        style={{
          backgroundColor: "#F9FAFB",
          padding: 16,
          borderRadius: 16,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
        }}
      >
        {/* 사용자 이름 + 시간 */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "bold",
              color: "#111827",
              marginRight: 8,
            }}
          >
            {item.userId}
          </Text>
          <Text style={{ fontSize: 12, color: "#6B7280" }}>30분 전</Text>
        </View>

        {/* 댓글 내용 */}
        <Text style={{ fontSize: 16, color: "#111827", marginBottom: 12 }}>
          {item.comment}
        </Text>

        {/* 버튼 영역 */}
        <View
          style={{ flexDirection: "row", justifyContent: "flex-end", gap: 16 }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons
              name="chatbubble-outline"
              size={16}
              color="#6B7280"
              style={{ marginRight: 4 }}
            />
            <Text style={{ fontSize: 14, color: "#6B7280" }}>대댓글</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <FontAwesome6
              name="arrow-right-from-bracket"
              size={16}
              color="#6B7280"
              style={{ marginRight: 4 }}
            />
            <Text style={{ fontSize: 14, color: "#6B7280" }}>대화하기</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      edges={["right", "left"]}
      style={{ flex: 1, padding: 10, backgroundColor: "white" }}
    >
      <FlatList
        data={comments}
        renderItem={renderItem}
        contentContainerStyle={{ gap: 10 }}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={ListHeaderComponent}
      />
    </SafeAreaView>
  );
};

export default ConnectDetail;
