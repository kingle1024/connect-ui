import { StyleSheet, Text, View } from "react-native";

// 설정 화면 (드로어 > 설정 진입)
const SettingsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>설정</Text>
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

export default SettingsScreen;
