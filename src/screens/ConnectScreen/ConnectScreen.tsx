import { useEffect, useCallback, useRef, useState, useContext } from "react";
import {
  Text,
  View,
  FlatList,
  TouchableOpacity,
  TextInput,
  Dimensions,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  PanResponder,
  RefreshControl,
  Alert,
} from "react-native";
import { Post } from "@/types";
import localStyles from "./ConnectScreen.styles";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useBoard } from "@/hooks/useBoard";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import RBSheet from "react-native-raw-bottom-sheet";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import {
  formatRelativeTime,
  getDeadlineLabel,
} from "@/utils/formatRelativeTime";
import DateTimePicker from "@react-native-community/datetimepicker";
import dayjs from "dayjs";
import { useActionSheet } from "@expo/react-native-action-sheet";
import Toast from "react-native-toast-message";
import { useRootNavigation } from "@/hooks/useNavigation";
import AuthContext from "@/components/auth/AuthContext";

const screenHeight = Dimensions.get("window").height;

export default function ConnectScreen() {
  const navigation = useRootNavigation<"ConnectDetail" | "Signin">();
  const { user: me } = useContext(AuthContext);
  const refRBSheet = useRef<any>(null);
  const flatListRef = useRef<FlatList<any>>(null);
  const insets = useSafeAreaInsets();
  const { showActionSheetWithOptions } = useActionSheet();

  const pan = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dy > 0) {
          // 아래로 이동 중일 때
          pan.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dy > 100) {
          // 충분히 아래로 드래그하면 닫기
          refRBSheet.current?.close();
        } else {
          // 닫지 않으면 원위치
          Animated.spring(pan, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  const [now, setNow] = useState(dayjs());
  const [refreshing, setRefreshing] = useState(false);
  const {
    posts,
    loadPosts,
    loadMorePosts,
    hasNextPage,
    titleInput,
    setTitleInput,
    titleInputErrorText,
    resetTitleInput,
    contentInput,
    setContentInput,
    contentInputErrorText,
    resetContenInput,
    destinationInput,
    setDestinationInput,
    destinationInputErrorText,
    resetDestinationInput,
    maxCapacityInput,
    setMaxCapacityInput,
    maxCapacityInputErrorText,
    resetMaxCapacityInput,
    deadlineDts,
    showDatePicker,
    setShowDatePicker,
    handleDeadlineDtsChange,
  } = useBoard();

  const onPressListItem = (postId: number) => {
    if (me) {
      navigation.push("ConnectDetail", { parentId: postId });
    } else {
      Alert.alert(
        "로그인이 필요합니다.",
        "댓글을 보려면 로그인이 필요합니다.",
        [
          {
            text: "로그인",
            onPress: () => navigation.navigate("Signin"),
          },
          { text: "닫기" },
        ]
      );
    }
  };

  const onPressCancel = () => {
    refRBSheet.current?.close();
  };

  const onPressNewPost = () => {
    if (me) {
      refRBSheet.current?.open();
    } else {
      Alert.alert(
        "로그인이 필요합니다.",
        "새 글을 작성하려면 로그인이 필요합니다.",
        [
          {
            text: "로그인",
            onPress: () => navigation.navigate("Signin"),
          },
          { text: "닫기" },
        ]
      );
    }
  };

  const onPressPost = () => {
    if (
      titleInputErrorText ||
      contentInputErrorText ||
      destinationInputErrorText ||
      maxCapacityInputErrorText
    ) {
      return;
    }
    resetTitleInput();
    resetContenInput();
    resetDestinationInput();
    resetMaxCapacityInput();
    refRBSheet.current?.close();
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const onPressMore = (item: Post) => {
    if (me) {
      const options = ["참여하기", "신고하기", "취소"];
      const cancelButtonIndex = 2;

      showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
          destructiveButtonIndex: [1, 2],
          title: item.title,
          message: `${item.content.substring(0, 50)}...`,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            if (item.maxCapacity === item.currentParticipants) {
              Toast.show({
                type: "error",
                text1: "모집 마감!",
                text2: `${item.title} 모집이 마감되었습니다.`,
                visibilityTime: 3000,
                topOffset: insets.top,
              });
            } else if (
              dayjs(item.deadlineDts).isSame(now) ||
              dayjs(item.deadlineDts).isBefore(dayjs())
            ) {
              Toast.show({
                type: "error",
                text1: "모집 마감!",
                text2: `${item.title} 모집이 마감되었습니다.`,
                visibilityTime: 3000,
                topOffset: insets.top,
              });
            } else {
              Alert.alert(
                "참여하시겠습니까?",
                "지금 참여하면 합류할 수 있어요!",
                [
                  {
                    text: "참여",
                    onPress: () => onPressJoin(item),
                  },
                  { text: "다음에" },
                ]
              );
            }
          } else if (buttonIndex === 1) {
            Alert.alert("신고하시겠습니까?", "신고하면 관리자가 확인합니다.", [
              {
                text: "신고",
                onPress: () => onPressReport(item),
              },
              { text: "다음에" },
            ]);
          }
        }
      );
    } else {
      Alert.alert(
        "로그인이 필요합니다.",
        "모집에 참여하려면 로그인이 필요합니다.",
        [
          {
            text: "로그인",
            onPress: () => navigation.navigate("Signin"),
          },
          { text: "닫기" },
        ]
      );
    }
  };

  const onPressJoin = (item: Post) => {
    Toast.show({
      type: "success",
      text1: "참여 완료!",
      text2: `${item.title} 모집에 참여했습니다.`,
      visibilityTime: 3000,
      topOffset: insets.top,
    });
  };

  const onPressReport = (item: Post) => {
    Toast.show({
      type: "info",
      text1: "신고 완료!",
      text2: `${item.title} 게시글을 신고했습니다.`,
      visibilityTime: 3000,
      topOffset: insets.top,
    });
  };

  useEffect(() => {
    const fetch = async () => {
      try {
        await loadPosts();
        setNow(dayjs());
      } finally {
        setRefreshing(false);
      }
    };
    if (refreshing) {
      fetch();
    }
  }, [refreshing, loadPosts]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newNow = dayjs();
      setNow(newNow);
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  });

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const onRefresh = () => {
    setRefreshing(true);
  };

  const onEndReached = () => {
    if (!refreshing && hasNextPage) {
      loadMorePosts();
    }
  };

  const renderItem = ({ item }: { item: Post }) => {
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
      <TouchableOpacity
        style={localStyles.postItem}
        onPress={() => onPressListItem(item.id)}
      >
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
            <MaterialIcons
              name={iconName}
              size={14}
              style={{ marginRight: 4, color: textColor }}
            />
            <Text
              style={{
                fontSize: 12,
                fontWeight: "500",
                color: textColor,
              }}
            >
              {label}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => onPressMore(item)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="more-vertical" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>
        <View style={{ marginTop: 8, marginBottom: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <MaterialIcons
              name="pin-drop"
              size={16}
              style={{ marginRight: 4, color: "#6B7280" }}
            />
            <Text style={{ fontSize: 14, color: "#6B7280" }}>
              도착지: {item.destination}
            </Text>
          </View>
        </View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
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
          <Text
            style={{
              fontSize: 12,
              color: "#6b7280",
            }}
          >
            {formatRelativeTime(item.insertDts)}
          </Text>
        </View>
        <Text style={localStyles.postTitle}>{item.title}</Text>
        <Text style={localStyles.postContent}>
          {item.content.substring(0, 50)}...
        </Text>
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
          {/* 왼쪽: 댓글 */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <MaterialIcons name="maps-ugc" size={18} color="#6B7280" />
            <Text style={{ fontSize: 12, color: "#6B7280" }}>
              댓글 {item.commentCount}
            </Text>
          </View>

          {/* 오른쪽: 참여 인원 */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <MaterialIcons name="person" size={18} color="#6B7280" />
            <Text style={{ fontSize: 12, color: "#6B7280" }}>
              {item.currentParticipants}/{item.maxCapacity}명{" "}
              {item.currentParticipants === item.maxCapacity ? "마감" : "모집"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      edges={["right", "left"]}
      style={{ flex: 1, paddingTop: 10, backgroundColor: "#F7F8FA" }}
    >
      <FlatList
        ref={flatListRef}
        data={posts}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={localStyles.listContainer}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.1}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
      <TouchableOpacity onPress={onPressNewPost}>
        <View
          style={{
            position: "absolute",
            bottom: 20,
            right: 20,
            backgroundColor: "#FF4D00",
            borderRadius: 9999,
            padding: 12,
          }}
        >
          <FontAwesome6 name="add" size={24} color="white" />
        </View>
      </TouchableOpacity>
      <RBSheet
        ref={refRBSheet}
        useNativeDriver={false}
        height={screenHeight * 0.9}
        closeOnPressMask={true}
        customStyles={{
          wrapper: {
            backgroundColor: "rgba(0,0,0,0.5)",
          },
          draggableIcon: {
            backgroundColor: "#ccc",
            width: 40,
            height: 4,
          },
          container: {
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
          },
        }}
        customAvoidingViewProps={{
          enabled: false,
        }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <Animated.View
              {...panResponder.panHandlers}
              style={{
                height: 30,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: 50,
                  height: 5,
                  backgroundColor: "#ccc",
                  borderRadius: 2.5,
                }}
              />
            </Animated.View>

            <ScrollView
              style={{ padding: 10 }}
              keyboardShouldPersistTaps="handled"
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 10,
                }}
              >
                <TouchableOpacity
                  style={{
                    backgroundColor: "rgba(255, 99, 71, 1)",
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    borderRadius: 8,
                  }}
                  onPress={onPressCancel}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={{ color: "white", fontWeight: "bold" }}>
                    취소
                  </Text>
                </TouchableOpacity>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "bold",
                    marginTop: 10,
                    marginBottom: 5,
                    color: "#333",
                    textAlign: "center",
                  }}
                >
                  새 글
                </Text>
                <TouchableOpacity
                  style={{
                    backgroundColor: `${
                      titleInputErrorText ||
                      contentInputErrorText ||
                      destinationInputErrorText ||
                      maxCapacityInputErrorText
                        ? "rgba(255, 99, 71, 0.5)"
                        : "rgba(255, 99, 71, 1)"
                    }`,
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    borderRadius: 8,
                  }}
                  onPress={onPressPost}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={{ color: "white", fontWeight: "bold" }}>
                    Post
                  </Text>
                </TouchableOpacity>
              </View>
              {/* 제목 */}
              <TextInput
                value={titleInput}
                placeholder="제목"
                onChangeText={setTitleInput}
                placeholderTextColor="#999"
                style={{
                  marginBottom: 10,
                  padding: 10,
                  color: "black",
                  fontSize: 18,
                  fontWeight: "bold",
                  backgroundColor: "white",
                  borderWidth: 1,
                  borderColor: "black",
                  borderRadius: 8,
                }}
                returnKeyType="done"
              />
              {titleInputErrorText && (
                <View style={{ marginBottom: 10 }}>
                  <Text style={{ color: "red" }}>{titleInputErrorText}</Text>
                </View>
              )}
              {/* 내용 */}
              <TextInput
                value={contentInput}
                onChangeText={setContentInput}
                placeholder="내용을 입력하세요"
                placeholderTextColor="#999"
                multiline={true}
                textAlignVertical="top"
                style={{
                  height: 150,
                  padding: 10,
                  color: "black",
                  fontSize: 16,
                  backgroundColor: "white",
                  borderWidth: 1,
                  borderColor: "black",
                  borderRadius: 8,
                  marginBottom: 10,
                }}
              />
              {contentInputErrorText && (
                <View style={{ marginBottom: 10 }}>
                  <Text style={{ color: "red" }}>{contentInputErrorText}</Text>
                </View>
              )}
              {/* 도착지 */}
              <TextInput
                value={destinationInput}
                placeholder="도착지 입력"
                onChangeText={setDestinationInput}
                placeholderTextColor="#999"
                style={{
                  marginBottom: 10,
                  padding: 10,
                  color: "black",
                  fontSize: 16,
                  backgroundColor: "white",
                  borderWidth: 1,
                  borderColor: "black",
                  borderRadius: 8,
                }}
                returnKeyType="done"
              />
              {destinationInputErrorText && (
                <View style={{ marginBottom: 10 }}>
                  <Text style={{ color: "red" }}>
                    {destinationInputErrorText}
                  </Text>
                </View>
              )}
              {/* 최대 모집 인원 */}
              <TextInput
                value={maxCapacityInput}
                onChangeText={setMaxCapacityInput}
                placeholder="최대 모집 인원 입력"
                placeholderTextColor="#999"
                keyboardType="numeric"
                style={{
                  padding: 10,
                  color: "black",
                  fontSize: 16,
                  backgroundColor: "white",
                  borderWidth: 1,
                  borderColor: "black",
                  borderRadius: 8,
                  marginBottom: 10,
                }}
                returnKeyType="done"
              />
              {maxCapacityInputErrorText && (
                <View style={{ marginBottom: 10 }}>
                  <Text style={{ color: "red" }}>
                    {maxCapacityInputErrorText}
                  </Text>
                </View>
              )}
              {/* 마감일 DateTimePicker */}
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={{
                  padding: 10,
                  backgroundColor: "white",
                  borderWidth: 1,
                  borderColor: "black",
                  borderRadius: 8,
                  marginBottom: 10,
                }}
              >
                <Text style={{ fontSize: 16 }}>
                  {deadlineDts
                    ? dayjs(deadlineDts).format("YYYY-MM-DD (ddd)")
                    : "마감일 선택"}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  testID="dateTimePicker"
                  value={deadlineDts}
                  mode="date"
                  is24Hour={true}
                  onChange={handleDeadlineDtsChange}
                />
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </RBSheet>
    </SafeAreaView>
  );
}
