import { useRoute } from "@react-navigation/native";
import { FlatList, Image, Text, View } from "react-native";
import icon from "../../../assets/user-icon.jpg";
import { useState } from "react";
import { POST_COMMENTS } from "../../mock/data";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const ConnectDetail = () => {
  const routes = useRoute();
  const insets = useSafeAreaInsets();
  const [comments, setComments] = useState(POST_COMMENTS);

  const renderItem = ({ item }) => {
    return (
      <View style={{ backgroundColor: "blue", height: 100 }}>
        <Text>{item.comment}</Text>
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
      <View style={{ paddingTop: 10, paddingBottom: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: "bold" }}>
          {routes.params.item.title}
        </Text>
      </View>
      <View>
        <Text>{routes.params.item.content}</Text>
      </View>
      <FlatList
        data={comments}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
      />
    </SafeAreaView>
  );
};

export default ConnectDetail;
