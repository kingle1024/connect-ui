import { RouteProp, useRoute } from "@react-navigation/native";
import {
  FlatList,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  TextInput,
  RefreshControl,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Reply, Post } from "@/types";
import { MaterialIcons } from "@expo/vector-icons";
import { formatRelativeTime } from "@/utils/formatRelativeTime";
import { useReply } from "@/hooks/useReply";
import CustomBottomSheet, {
  CustomBottomSheetRef,
} from "@/components/modals/CustomBottomSheet";

type ConnectDetailRouteProp = RouteProp<{ params: { item: Post } }, "params">;

const screenHeight = Dimensions.get("window").height;

const ConnectDetail = () => {
  const routes = useRoute<ConnectDetailRouteProp>();
  const {
    replies,
    fetchReply,
    replyInput,
    setReplyInput,
    replyInputErrorText,
  } = useReply();
  const [expandedReplies, setExpandedReplies] = useState<number[]>([]);
  const [replyInputHeight, setReplyInputHeight] = useState(0);

  const refSheet = useRef<CustomBottomSheetRef>(null);
  const inputRef = useRef<TextInput>(null);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const toggleExpand = (id: number) => {
    setExpandedReplies((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    setTimeout(() => {
      // API refetch 완료되는 시점
      setRefreshing(false);
    }, 3000);
  }, [refreshing]);

  useEffect(() => {
    fetchReply();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
  };

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
              {routes.params.item.userName}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: "#6B7280",
                paddingTop: 5,
              }}
            >
              {formatRelativeTime(routes.params.item.insertDts)}
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
            <TouchableOpacity
              style={{ flexDirection: "row", alignItems: "center" }}
              onPress={() => inputRef.current?.focus()}
            >
              <MaterialIcons
                name="subdirectory-arrow-right"
                size={18}
                color="#6B7280"
                style={{ marginRight: 4 }}
              />
              <Text style={{ fontSize: 14, color: "#6B7280" }}>댓글</Text>
            </TouchableOpacity>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <TouchableOpacity
              style={{ flexDirection: "row", alignItems: "center" }}
            >
              <FontAwesome6
                name="comment-dots"
                size={18}
                color="#6B7280"
                style={{ marginRight: 4 }}
              />
              <Text style={{ fontSize: 14, color: "#6B7280" }}>대화하기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  };

  const renderItem = ({ item }: { item: Reply }) => {
    const maxVisibleReplies = 3;
    const isExpanded = expandedReplies.includes(item.id);
    const displayedReplies = isExpanded
      ? item.replies
      : item.replies?.slice(0, maxVisibleReplies);
    return (
      <View style={{ gap: 8 }}>
        {/* 댓글 박스 */}
        <View
          style={{
            backgroundColor: "#F9FAFB", // bg-card-light
            padding: 16,
            borderRadius: 12,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
            <View style={{ flex: 1 }}>
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
                  {item.userName}
                </Text>
                <Text style={{ fontSize: 12, color: "#6B7280" }}>
                  {formatRelativeTime(item.insertDts)}
                </Text>
              </View>

              {/* 댓글 내용 */}
              <Text style={{ fontSize: 14, color: "#111827" }}>
                {item.content}
              </Text>
            </View>

            {/* 버튼 영역 */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                marginTop: 24,
                gap: 16,
              }}
            >
              <TouchableOpacity
                style={{ flexDirection: "row", alignItems: "center" }}
              >
                <MaterialIcons
                  name="subdirectory-arrow-right"
                  style={{ fontSize: 16, color: "#6B7280", marginRight: 4 }}
                />
                <Text style={{ fontSize: 12, color: "#6B7280" }}>대댓글</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flexDirection: "row", alignItems: "center" }}
              >
                <FontAwesome6
                  name="comment-dots"
                  style={{ fontSize: 16, color: "#6B7280", marginRight: 4 }}
                />
                <Text style={{ fontSize: 12, color: "#6B7280" }}>대화하기</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 대댓글 리스트 */}
          <View
            style={{
              marginTop: 16,
              paddingLeft: 16,
              borderLeftWidth: 2,
              borderLeftColor: "#E5E7EB",
              gap: 12,
            }}
          >
            {/* 대댓글 박스 */}
            {displayedReplies?.map((reply) => (
              <View
                key={reply.id}
                style={{
                  backgroundColor: "#FFFFFF",
                  padding: 12,
                  borderRadius: 8,
                }}
              >
                <View
                  style={{ flexDirection: "row", alignItems: "flex-start" }}
                >
                  <View style={{ flex: 1 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 4,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "bold",
                          color: "#111827",
                          marginRight: 8,
                        }}
                      >
                        {reply.userName}
                      </Text>
                      <Text style={{ fontSize: 12, color: "#6B7280" }}>
                        {formatRelativeTime(reply.insertDts)}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 14, color: "#111827" }}>
                      {reply.content}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      alignSelf: "flex-end",
                    }}
                  >
                    <FontAwesome6
                      name="comment-dots"
                      style={{ fontSize: 14, color: "#6B7280", marginRight: 4 }}
                    />
                    <Text style={{ fontSize: 12, color: "#6B7280" }}>
                      대화하기
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          {/* 더보기 버튼 */}
          {item.replies && item.replies.length > maxVisibleReplies && (
            <TouchableOpacity
              style={{ marginTop: 12 }}
              onPress={() => toggleExpand(item.id)}
            >
              {isExpanded ? (
                <Text
                  style={{ fontSize: 14, fontWeight: "500", color: "#FF4D00" }}
                >
                  대댓글 접기
                </Text>
              ) : (
                <Text
                  style={{ fontSize: 14, fontWeight: "500", color: "#FF4D00" }}
                >
                  대댓글 {item.replies.length - maxVisibleReplies}개 더보기 ...
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const ListFooterComponent = () => {
    return (
      <View
        style={{
          height:
            screenHeight * 0.1 + (refSheet.current?.bottomSheetHeight ?? 0),
        }}
      ></View>
    );
  };

  return (
    <SafeAreaView
      edges={["right", "left"]}
      style={{ flex: 1, padding: 10, backgroundColor: "white" }}
    >
      <FlatList
        data={replies}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={ListFooterComponent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
      <CustomBottomSheet
        ref={refSheet}
        minClosingHeight={screenHeight * 0.1}
        extraContentHeight={replyInputHeight}
        onOpen={() => setBottomSheetOpen(true)}
        onClose={() => setBottomSheetOpen(false)}
      >
        <View style={{ padding: 20 }}>
          <TextInput
            ref={inputRef}
            value={replyInput}
            onChangeText={setReplyInput}
            placeholder="댓글을 남겨주세요."
            multiline={true}
            style={{
              color: "black",
              borderRadius: 8,
            }}
            onContentSizeChange={(e) => {
              const height = Math.min(
                150,
                Math.max(40, e.nativeEvent.contentSize.height)
              );
              setReplyInputHeight(height);
            }}
          />
        </View>
        {/* 버튼은 절대 위치 고정 */}
        {bottomSheetOpen && !replyInputErrorText && (
          <TouchableOpacity
            style={{
              position: "absolute",
              bottom: 40,
              right: 20,
              backgroundColor: "rgba(255, 99, 71, 1)",
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: 8,
            }}
            onPress={() => console.log("등록")}
          >
            <Text style={{ color: "white", fontWeight: "bold" }}>등록</Text>
          </TouchableOpacity>
        )}
      </CustomBottomSheet>
    </SafeAreaView>
  );
};

export default ConnectDetail;
