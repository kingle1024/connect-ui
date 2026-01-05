import { useEffect, useCallback, useRef, useState, useContext } from "react";
import {
  Text,
  View,
  FlatList,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Keyboard,
  Platform,
  Animated,
  PanResponder,
  RefreshControl,
} from "react-native";
import Alert from '@blazejkustra/react-native-alert';
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
import dayjs from "dayjs";
import { useActionSheet } from "@expo/react-native-action-sheet";
import Toast from "react-native-toast-message";
import { useRootNavigation } from "@/hooks/useNavigation";
import AuthContext from "@/components/auth/AuthContext";
import NewPostSheet from "./NewPostSheet";

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
    validateTitle,
    contentInput,
    setContentInput,
    contentInputErrorText,
    resetContenInput,
    validateContent,
    destinationInput,
    setDestinationInput,
    destinationInputErrorText,
    resetDestinationInput,
    validateDestination,
    maxCapacityInput,
    setMaxCapacityInput,
    maxCapacityInputErrorText,
    resetMaxCapacityInput,
    validateMaxCapacity,
    deadlineDts,
    showDatePicker,
    setShowDatePicker,
    handleDeadlineDtsChange,
    savePost,
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

  const onPressPost = async () => {
    if (
      titleInputErrorText ||
      contentInputErrorText ||
      destinationInputErrorText ||
      maxCapacityInputErrorText
    ) {
      return;
    }
    try {
      await savePost();
      resetTitleInput();
      resetContenInput();
      resetDestinationInput();
      resetMaxCapacityInput();
      refRBSheet.current?.close();
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      Toast.show({
        type: 'success',
        text1: '게시글 등록 완료',
        visibilityTime: 2000,
        topOffset: insets.top,
      });
    } catch (ex) {
      Toast.show({
        type: 'error',
        text1: '등록 실패',
        text2: '게시글 등록 중 오류가 발생했습니다.',
        visibilityTime: 3000,
        topOffset: insets.top,
      });
    }
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
        <NewPostSheet
          screenHeight={screenHeight}
          pan={pan}
          panResponder={panResponder}
          onPressCancel={onPressCancel}
          onPressPost={onPressPost}

          titleInput={titleInput}
          setTitleInput={setTitleInput}
          titleInputErrorText={titleInputErrorText}
          validateTitle={validateTitle}

          contentInput={contentInput}
          setContentInput={setContentInput}
          contentInputErrorText={contentInputErrorText}
          validateContent={validateContent}

          destinationInput={destinationInput}
          setDestinationInput={setDestinationInput}
          destinationInputErrorText={destinationInputErrorText}
          validateDestination={validateDestination}

          maxCapacityInput={maxCapacityInput}
          setMaxCapacityInput={setMaxCapacityInput}
          maxCapacityInputErrorText={maxCapacityInputErrorText}
          validateMaxCapacity={validateMaxCapacity}

          deadlineDts={deadlineDts}
          showDatePicker={showDatePicker}
          setShowDatePicker={setShowDatePicker}
          handleDeadlineDtsChange={handleDeadlineDtsChange}
        />
      </RBSheet>
    </SafeAreaView>
  );
}
