import { useRoute } from "@react-navigation/native";
import { FlatList, Image, Text, View } from "react-native";
import icon from "../../../assets/user-icon.jpg";
import { useState } from "react";
import { POST_COMMENTS } from "../../mock/data";

const ConnectDetail = () => {
  const routes = useRoute();
  const [comments, setComments] = useState(POST_COMMENTS);

  const renderItem = ({ item }) => {
    <View style={{ backgroundColor: "red", width: "100%", height: 300 }}>
      <Text>{item.comment}</Text>;
    </View>;
  };

  return (
    <View style={{ margin: 10 }}>
      <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
        <Image
          source={icon}
          style={{ width: 50, height: 50, borderRadius: 50 * 0.4 }}
        />
        <View style={{ paddingLeft: 7 }}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: "bold",
            }}
          >
            아이디
          </Text>
          <Text style={{ fontSize: 10 }}>방금</Text>
        </View>
      </View>
      <View
        style={{
          paddingTop: 10,
          paddingBottom: 10,
          fontSize: 24,
          fontWeight: "bold",
        }}
      >
        {routes.params.item.title}
      </View>
      <View>
        <Text>{routes.params.item.content}</Text>
      </View>
      <FlatList
        data={comments}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};

export default ConnectDetail;
