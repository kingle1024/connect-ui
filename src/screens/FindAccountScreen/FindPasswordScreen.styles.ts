import { StyleSheet } from "react-native";
import Colors from "@/modules/Color"; // Colors 모듈도 필요하니 같이 가져옵니다.

const styles = StyleSheet.create({
  eyeIcon: {
    padding: 5,
  },
  passwordHint: {
    fontSize: 12,
    color: 'gray',
    alignSelf: 'flex-start',
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  linkButton: {
    marginTop: 20,
    padding: 5,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 50,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.GRAY,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    paddingRight: 10, // 아이콘과의 간격
  },
  linkText: {
    color: '#007bff',
    fontSize: 14,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#007bff',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#a0c7ff',
  },
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