import { useRoute } from "@react-navigation/native";
import { FlatList, Image, Text, View } from "react-native";
import icon from "../../../assets/user-icon.jpg";
import { useState } from "react";
import { POST_COMMENTS } from "../../mock/data";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";

const SNAP_POINTS = [300, 600];

const ConnectDetail = () => {
  const routes = useRoute();
  const [comments, setComments] = useState(POST_COMMENTS);

  const renderItem = ({ item }) => {
    return (
      <View
        style={{
          backgroundColor: "#fff",
          padding: 15,
          borderRadius: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
        }}
      >
        <Text style={{ fontSize: 11, color: "gray" }}>{item.userId}</Text>
        <View style={{ height: 5 }}></View>
        <Text style={{ fontSize: 16 }}>{item.comment}</Text>
        <View style={{ height: 5 }}></View>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <View>
            <Text style={{ fontSize: 10 }}>30분 전</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flexDirection: "row" }}>
              <Ionicons name="chatbubble-ellipses-outline" />
              <Text style={{ fontSize: 10, paddingLeft: 4 }}>대댓글</Text>
            </View>
            <View style={{ flexDirection: "row" }}>
              <FontAwesome6 name="arrow-right-from-bracket" />
              <Text style={{ fontSize: 10, paddingLeft: 4 }}>대화하기</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      edges={["right", "bottom", "left"]}
      style={{ flex: 1, padding: 10 }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Image
          source={icon}
          style={{ width: 50, height: 50, borderRadius: 50 * 0.4 }}
        />
        <View style={{ paddingLeft: 10 }}>
          <Text style={{ fontSize: 20, fontWeight: "bold", paddingBottom: 3 }}>
            아이디
          </Text>
          <Text style={{ fontSize: 15 }}>방금</Text>
        </View>
      </View>
      <View
        style={{
          marginTop: 10,
        }}
      >
        <View style={{ paddingBottom: 20 }}>
          <Text style={{ fontSize: 24, fontWeight: "bold" }}>
            {routes.params.item.title}
          </Text>
        </View>
        <View>
          <Text>{routes.params.item.content}</Text>
        </View>
        <View style={{ height: 200 }}></View>
      </View>
      <FlatList
        data={comments}
        renderItem={renderItem}
        style={{ flex: 1 }}
        contentContainerStyle={{ gap: 10 }}
        keyExtractor={(item) => item.id}
        inverted
      />
    </SafeAreaView>
  );
};

export default ConnectDetail;
