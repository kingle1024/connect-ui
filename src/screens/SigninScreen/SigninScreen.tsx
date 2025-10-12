import AuthContext from "@/components/auth/AuthContext";
import Colors from "@/modules/Color";
import { useCallback, useContext, useMemo, useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import validator from "validator";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRootNavigation } from "@/hooks/useNavigation";

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

const SigninScreen = () => {
  const navigation = useRootNavigation<"Signin">();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { user, signin, processingSignin } = useContext(AuthContext);

  const emailErrorText = useMemo(() => {
    if (email.length === 0) {
      return "이메일을 입력해주세요.";
    }
    if (!validator.isEmail(email)) {
      return "올바른 이메일이 아닙니다.";
    }
    return null;
  }, [email]);

  const passwordErrorText = useMemo(() => {
    if (password.length === 0) {
      return "비밀번호를 입력해주세요.";
    }
    if (password.length < 6) {
      return "비밀번호는 6자리 이상이여야합니다";
    }
    return null;
  }, [password]);

  const onChangeEmailText = useCallback((text: string) => {
    setEmail(text);
  }, []);

  const onChangePasswordText = useCallback((text: string) => {
    setPassword(text);
  }, []);

  const signinButtonEnabled = useMemo(() => {
    return emailErrorText == null && passwordErrorText == null;
  }, [emailErrorText, passwordErrorText]);

  const signinButtonStyle = useMemo(() => {
    if (signinButtonEnabled) {
      return styles.signinButton;
    }
    return [styles.signinButton, styles.disabledSigninButton];
  }, [signinButtonEnabled]);

  const onPressSigninButton = useCallback(async () => {
    try {
      await signin(email, password);
    } catch (error: any) {
      Alert.alert(error.message);
    }
  }, [email, password, signin]);

  const onPressBackButton = useCallback(() => {
    navigation.goBack();
  }, [navigation.goBack]);

  const onPressSignUp = useCallback(() => {
    navigation.navigate("Signup");
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <View style={{ flex: 1 }}>
          <View style={styles.header}>
            <View style={styles.backButton}>
              {navigation.canGoBack() && (
                <TouchableOpacity
                  onPress={onPressBackButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialIcons
                    name="arrow-back-ios-new"
                    size={24}
                    color="black"
                  />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.center}>
              <Text style={styles.headerTitle}>로그인</Text>
            </View>
          </View>
        </View>
        <View>
          <View style={styles.section}>
            <Text style={styles.title}>이메일</Text>
            <TextInput
              value={email}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              onChangeText={onChangeEmailText}
            />
            {emailErrorText && (
              <Text style={styles.errorText}>{emailErrorText}</Text>
            )}
          </View>
          <View style={styles.section}>
            <Text style={styles.title}>비밀번호</Text>
            <TextInput
              value={password}
              style={styles.input}
              secureTextEntry
              onChangeText={onChangePasswordText}
            />
            {passwordErrorText && (
              <Text style={styles.errorText}>{passwordErrorText}</Text>
            )}
          </View>
          <View>
            {processingSignin ? (
              <View style={{ padding: 18 }}>
                <ActivityIndicator />
              </View>
            ) : (
              <TouchableOpacity
                style={signinButtonStyle}
                onPress={onPressSigninButton}
                disabled={!signinButtonEnabled}
              >
                <Text style={styles.signinButtonText}>로그인</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.signupButtonContainer}>
            <TouchableOpacity
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={{ fontSize: 16 }}>비밀번호 찾기</Text>
            </TouchableOpacity>
            <View style={{ paddingLeft: 10, paddingRight: 10 }} />
            <TouchableOpacity
              onPress={onPressSignUp}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={{ fontSize: 16 }}>회원가입</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SigninScreen;
