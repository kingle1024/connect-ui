import { useEffect, useCallback, useRef, useState, useContext } from "react";
import { useFocusEffect } from "@react-navigation/native";
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
  ScrollView,
} from "react-native";
import Alert from '@blazejkustra/react-native-alert';
import { Post } from "@/types";
import localStyles from "./ConnectScreen.styles";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import {
  useBoard,
  CATEGORY_CUSTOM,
  CATEGORY_FILTER_ALL,
  SEARCH_FIELD_OPTIONS,
  SearchField,
} from "@/hooks/useBoard";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import RBSheet from "react-native-raw-bottom-sheet";
import PostItem from "./PostItem";
import dayjs from "dayjs";
import { useActionSheet } from "@expo/react-native-action-sheet";
import Toast from "react-native-toast-message";
import { useRootNavigation } from "@/hooks/useNavigation";
import AuthContext from "@/components/auth/AuthContext";
import NewPostSheet from "./NewPostSheet";
import theme from "@/modules/theme";

const screenHeight = Dimensions.get("window").height;

export default function ConnectScreen() {
  const navigation = useRootNavigation<"ConnectDetail" | "Signin">();
  const { user: me } = useContext(AuthContext);
  const refRBSheet = useRef<any>(null);
  const filterSheetRef = useRef<any>(null);
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
    categories,
    loadCategories,
    selectedCategory,
    setSelectedCategory,
    searchField,
    setSearchField,
    searchKeyword,
    setSearchKeyword,
    openOnly,
    setOpenOnly,
    appliedFilter,
    applySearch,
    clearSearch,
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
    categoryPreset,
    setCategoryPreset,
    customCategoryInput,
    setCustomCategoryInput,
    isCustomCategory,
    categoryInputErrorText,
    resetCategoryInput,
    deadlineDts,
    showDatePicker,
    setShowDatePicker,
    handleDeadlineDtsChange,
    savePost,
    deletePost,
  } = useBoard();

  const handleDelete = async (id: number) => {
    await deletePost(id);
  };

  const onPressListItem = (postId: number) => {
    // 모집 글 열람은 로그인 없이 허용 (참여/작성/댓글 시점에만 로그인 안내)
    navigation.push("ConnectDetail", { parentId: postId });
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
      maxCapacityInputErrorText ||
      categoryInputErrorText
    ) {
      return;
    }
    try {
      await savePost();
      resetTitleInput();
      resetContenInput();
      resetDestinationInput();
      resetMaxCapacityInput();
      resetCategoryInput();
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
      // Build action sheet options conditionally: include "삭제" only for the author
      const baseOptions = ["참여하기"];
      const authorOptions: string[] = me && item.userId === me.userId ? ["삭제"] : [];
      const otherOptions = ["신고하기", "취소"];
      const options = [...baseOptions, ...authorOptions, ...otherOptions];
      const cancelButtonIndex = options.length - 1;

      const destructiveIndexes: number[] = [];
      const deleteIndex = options.indexOf("삭제");
      const reportIndex = options.indexOf("신고하기");
      if (deleteIndex !== -1) destructiveIndexes.push(deleteIndex);
      if (reportIndex !== -1) destructiveIndexes.push(reportIndex);

      showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
          destructiveButtonIndex: destructiveIndexes,
          title: item.title,
          message: `${item.content.substring(0, 50)}...`,
        },
        (buttonIndex) => {
          const joinIndex = options.indexOf("참여하기");
          if (buttonIndex === joinIndex) {
            // If this is the user's own post, inform already participating
            if (item.userId === me?.userId) {
              Toast.show({
                type: "info",
                text1: "이미 참여되어 있습니다",
                visibilityTime: 2000,
                topOffset: insets.top,
              });
            } else if (item.maxCapacity === item.currentParticipants) {
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
          } else if (buttonIndex === deleteIndex) {
            Alert.alert("게시글 삭제", "게시글을 삭제하시겠습니까?", [
              { text: "삭제", onPress: () => handleDelete(item.id) },
              { text: "취소" },
            ]);
          } else if (buttonIndex === reportIndex) {
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
        loadCategories();
        setNow(dayjs());
      } finally {
        setRefreshing(false);
      }
    };
    if (refreshing) {
      fetch();
    }
  }, [refreshing, loadPosts, loadCategories]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newNow = dayjs();
      setNow(newNow);
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  });

  // 상세 화면에서 삭제·수정 후 돌아왔을 때도 목록이 최신 상태가 되도록
  // 마운트 시점이 아니라 화면이 포커스될 때마다 다시 불러온다
  useFocusEffect(
    useCallback(() => {
      loadPosts();
    }, [loadPosts])
  );

  const onRefresh = () => {
    setRefreshing(true);
  };

  const onEndReached = () => {
    if (!refreshing && hasNextPage) {
      loadMorePosts();
    }
  };

  const onPressCategory = (category: string) => {
    if (category === selectedCategory) {
      return;
    }
    setSelectedCategory(category);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  };

  const categoryFilters = [CATEGORY_FILTER_ALL, ...categories];
  // 작성 시트의 카테고리 칩도 같은 목록을 쓰고, 마지막에 '직접입력'만 덧붙인다
  const categoryOptions = [...categories, CATEGORY_CUSTOM];

  const onPressFilter = () => {
    filterSheetRef.current?.open();
  };

  // 필터 시트 '적용' 버튼
  const onPressApplyFilter = () => {
    Keyboard.dismiss();
    applySearch();
    filterSheetRef.current?.close();
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  };

  // 필터 시트 '초기화' 버튼
  const onPressResetFilter = () => {
    clearSearch();
    filterSheetRef.current?.close();
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  };

  const searchFieldLabel =
    SEARCH_FIELD_OPTIONS.find((o) => o.key === searchField)?.label ?? "제목";
  const hasActiveSearch =
    appliedFilter.keyword.length > 0 || appliedFilter.openOnly;

  return (
    <SafeAreaView
      edges={["right", "left"]}
      style={{ flex: 1, paddingTop: 12, backgroundColor: theme.colors.background }}
    >
      <View style={localStyles.filterHeaderRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={localStyles.filterBar}
          style={localStyles.filterBarScroll}
        >
          {categoryFilters.map((category) => {
            const selected = category === selectedCategory;
            return (
              <TouchableOpacity
                key={category}
                style={[
                  localStyles.filterChip,
                  selected && localStyles.filterChipSelected,
                ]}
                onPress={() => onPressCategory(category)}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    localStyles.filterChipText,
                    selected && localStyles.filterChipTextSelected,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        {/* 검색 필터 버튼. 필터가 적용되어 있으면 점으로 표시한다 */}
        <TouchableOpacity
          style={localStyles.filterIconButton}
          onPress={onPressFilter}
          activeOpacity={0.85}
          accessibilityLabel="검색 필터"
        >
          <FontAwesome6
            name="filter"
            size={15}
            color={
              hasActiveSearch ? theme.colors.primary : theme.colors.textSecondary
            }
          />
          {hasActiveSearch && <View style={localStyles.filterActiveDot} />}
        </TouchableOpacity>
      </View>
      <FlatList
        ref={flatListRef}
        data={posts}
        renderItem={({ item }) => (
          <PostItem
            item={item}
            now={now}
            me={me}
            insets={insets}
            onPressListItem={onPressListItem}
            onPressMore={onPressMore}
          />
        )}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={localStyles.listContainer}
        ListEmptyComponent={
          <View style={localStyles.emptyContainer}>
            <Text style={localStyles.emptyText}>
              {hasActiveSearch
                ? "검색 조건에 맞는 모집 글이 없어요."
                : selectedCategory === CATEGORY_FILTER_ALL
                ? "아직 등록된 모집 글이 없어요."
                : `'${selectedCategory}' 카테고리에 모집 글이 없어요.`}
            </Text>
          </View>
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.1}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
      {/* 검색 필터 시트 */}
      <RBSheet
        ref={filterSheetRef}
        useNativeDriver={false}
        height={340}
        closeOnPressMask={true}
        customStyles={{
          wrapper: {
            backgroundColor: "rgba(25, 31, 40, 0.5)",
          },
          container: {
            borderTopLeftRadius: theme.radius.xl,
            borderTopRightRadius: theme.radius.xl,
            backgroundColor: theme.colors.surface,
          },
        }}
      >
        <View style={localStyles.filterSheetContainer}>
          <Text style={localStyles.filterSheetTitle}>검색 필터</Text>
          <Text style={localStyles.filterSheetLabel}>검색 대상</Text>
          <View style={localStyles.searchFieldRow}>
            {SEARCH_FIELD_OPTIONS.map((option) => {
              const selected = option.key === searchField;
              return (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    localStyles.searchFieldChip,
                    selected && localStyles.filterChipSelected,
                  ]}
                  onPress={() => setSearchField(option.key)}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      localStyles.searchFieldChipText,
                      selected && localStyles.filterChipTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={localStyles.searchBar}>
            <FontAwesome6
              name="magnifying-glass"
              size={14}
              color={theme.colors.textMuted}
            />
            <TextInput
              style={localStyles.searchInput}
              value={searchKeyword}
              onChangeText={setSearchKeyword}
              placeholder={`${searchFieldLabel} 검색어 입력`}
              placeholderTextColor={theme.colors.textMuted}
              returnKeyType="search"
              onSubmitEditing={onPressApplyFilter}
            />
            {searchKeyword.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchKeyword("")}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="검색어 지우기"
              >
                <FontAwesome6
                  name="circle-xmark"
                  size={16}
                  color={theme.colors.textMuted}
                />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={localStyles.openOnlyRow}
            onPress={() => setOpenOnly(!openOnly)}
            activeOpacity={0.7}
          >
            <FontAwesome6
              name={openOnly ? "square-check" : "square"}
              size={18}
              color={openOnly ? theme.colors.primary : theme.colors.textMuted}
            />
            <Text style={localStyles.openOnlyText}>모집 미완료만 보기</Text>
          </TouchableOpacity>
          <View style={localStyles.filterSheetActions}>
            <TouchableOpacity
              style={localStyles.resetButton}
              onPress={onPressResetFilter}
              activeOpacity={0.85}
            >
              <Text style={localStyles.resetButtonText}>초기화</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={localStyles.applyButton}
              onPress={onPressApplyFilter}
              activeOpacity={0.85}
            >
              <Text style={localStyles.applyButtonText}>적용</Text>
            </TouchableOpacity>
          </View>
        </View>
      </RBSheet>
      <TouchableOpacity onPress={onPressNewPost} activeOpacity={0.85} style={localStyles.fab}>
        <FontAwesome6 name="add" size={22} color={theme.colors.white} />
      </TouchableOpacity>
      <RBSheet
        ref={refRBSheet}
        useNativeDriver={false}
        height={screenHeight * 0.9}
        closeOnPressMask={true}
        customStyles={{
          wrapper: {
            backgroundColor: "rgba(25, 31, 40, 0.5)",
          },
          draggableIcon: {
            backgroundColor: theme.colors.border,
            width: 40,
            height: 4,
          },
          container: {
            borderTopLeftRadius: theme.radius.xl,
            borderTopRightRadius: theme.radius.xl,
            backgroundColor: theme.colors.surface,
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

          categoryOptions={categoryOptions}
          categoryPreset={categoryPreset}
          setCategoryPreset={setCategoryPreset}
          customCategoryInput={customCategoryInput}
          setCustomCategoryInput={setCustomCategoryInput}
          isCustomCategory={isCustomCategory}
          categoryInputErrorText={categoryInputErrorText}

          deadlineDts={deadlineDts}
          showDatePicker={showDatePicker}
          setShowDatePicker={setShowDatePicker}
          handleDeadlineDtsChange={handleDeadlineDtsChange}
        />
      </RBSheet>
    </SafeAreaView>
  );
}
