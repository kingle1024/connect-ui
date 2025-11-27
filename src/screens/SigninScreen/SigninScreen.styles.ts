import { StyleSheet } from "react-native";
import Colors from "@/modules/Color"; // Colors 모듈도 필요하니 같이 가져옵니다.

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  backButton: {
    position: "absolute",
    left: 3,
    zIndex: 999,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.BLACK,
  },
  section: {
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.BLACK,
  },
  input: {
    marginTop: 10,
    borderWidth: 1,
    padding: 10,
    borderRadius: 10,
    borderColor: Colors.GRAY,
    fontSize: 16,
  },
  errorText: {
    fontSize: 15,
    color: Colors.RED,
    marginTop: 4,
  },
  signinButton: {
    backgroundColor: "tomato",
    borderRadius: 10,
    alignItems: "center",
    padding: 20,
  },
  signinButtonText: {
    color: Colors.WHITE,
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledSigninButton: {
    backgroundColor: Colors.GRAY,
  },
  signingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  signupButtonContainer: {
    flexDirection: "row",
    paddingTop: 20,
    paddingBottom: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default styles;