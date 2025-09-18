import { NavigationProp, useNavigation } from "@react-navigation/native";
import { useEffect, useCallback, useRef, useState } from "react";
import {
  Text,
  View,
  FlatList,
  TouchableOpacity,
  TextInput,
  Dimensions,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { Post } from "@/types";
import localStyles from "./ConnectScreen.styles";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useBoard } from "@/hooks/useBoard";
import { SafeAreaView } from "react-native-safe-area-context";
import RBSheet from "react-native-raw-bottom-sheet";
import { MaterialIcons } from "@expo/vector-icons";

const screenHeight = Dimensions.get("window").height;

export default function ConnectScreen() {
  const navigation = useNavigation<NavigationProp<any>>();
  const refRBSheet = useRef<any>(null);
  const flatListRef = useRef<FlatList<any>>(null);
  const {
    posts,
    fetchPosts,
    titleInput,
    setTitleInput,
    titleInputErrorText,
    resetTitleInput,
    contentInput,
    setContentInput,
    contentInputErrorText,
    resetContenInput,
  } = useBoard();

  const onPressListItem = useCallback((item: Post) => {
    navigation.navigate("ConnectDetail", { item });
  }, []);

  const onPressPost = () => {
    if (titleInputErrorText || contentInputErrorText) {
      return;
    }
    resetTitleInput();
    resetContenInput();
    refRBSheet.current?.close();
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const renderItem = ({ item }: { item: Post }) => (
    <TouchableOpacity
      style={localStyles.postItem}
      onPress={() => onPressListItem(item)}
    >
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
          5분 전
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
            댓글 {item.comments}
          </Text>
        </View>

        {/* 오른쪽: 참여 인원 */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <MaterialIcons name="person" size={18} color="#6B7280" />
          <Text style={{ fontSize: 12, color: "#6B7280" }}>2/4</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

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
      />
      <TouchableOpacity onPress={() => refRBSheet.current?.open()}>
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
        height={screenHeight * 0.7}
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
          <View style={{ flex: 1, padding: 10 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "flex-end",
                marginBottom: 10,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "bold",
                  marginTop: 10,
                  marginBottom: 5,
                  color: "#333",
                  position: "absolute",
                  left: 0,
                  right: 0,
                  textAlign: "center",
                }}
              >
                새 글
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: `${
                    titleInputErrorText || contentInputErrorText
                      ? "rgba(255, 99, 71, 0.5)"
                      : "rgba(255, 99, 71, 1)"
                  }`,
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                }}
                onPress={onPressPost}
              >
                <Text style={{ color: "white", fontWeight: "bold" }}>Post</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              value={titleInput}
              placeholder="제목"
              onChangeText={setTitleInput}
              placeholderTextColor="tomato"
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
            <TextInput
              value={contentInput}
              onChangeText={setContentInput}
              placeholder="내용을 입력하세요"
              placeholderTextColor="tomato"
              multiline={true}
              textAlignVertical="top"
              style={{
                height: 150,
                padding: 10,
                color: "black",
                fontSize: 16,
                fontWeight: "bold",
                backgroundColor: "white",
                borderWidth: 1,
                borderColor: "black",
                borderRadius: 8,
              }}
            />
            {contentInputErrorText && (
              <View style={{ marginTop: 10 }}>
                <Text style={{ color: "red" }}>{contentInputErrorText}</Text>
              </View>
            )}
          </View>
        </TouchableWithoutFeedback>
      </RBSheet>
    </SafeAreaView>
  );
}
