import { StyleSheet, Text, View } from "react-native";

// 도움말 화면 (드로어 > 도움말 진입)
const HelpScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>도움말</Text>
      <Text style={styles.desc}>준비 중인 화면입니다.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f2f5",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  desc: {
    fontSize: 16,
    color: "#666",
    marginTop: 10,
  },
});

export default HelpScreen;
