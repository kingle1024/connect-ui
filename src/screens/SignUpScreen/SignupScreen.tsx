import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import Alert from '@blazejkustra/react-native-alert';
import validator from "validator";
import { useCallback, useContext, useMemo, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import AuthContext from "@/components/auth/AuthContext";
import theme from "@/modules/theme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRootNavigation } from "@/hooks/useNavigation";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: theme.colors.surface,
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
    fontWeight: "700",
    color: theme.colors.text,
    letterSpacing: -0.2,
  },
  section: {
    marginBottom: 20,
  },
  scrollContainer: {
    paddingTop: 20,
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  input: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.field,
    fontSize: 16,
    color: theme.colors.text,
  },
  errorText: {
    fontSize: 13,
    color: theme.colors.danger,
    marginTop: 6,
    paddingHorizontal: 4,
  },
  signupButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    alignItems: "center",
    paddingVertical: 16,
  },
  signupButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  disabledSignupButton: {
    backgroundColor: theme.colors.textDisabled,
  },
  signinTextButton: {
    marginTop: 5,
    alignItems: "center",
    padding: 10,
  },
  signinButtonText: {
    fontSize: 15,
    color: theme.colors.textSecondary,
  },
  signingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

const SignupScreen = () => {
  const navigation = useRootNavigation<"Signup">();
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmedPassword, setConfirmedPassword] = useState("");
  const [name, setName] = useState("");
  const { processingSignup, signup } = useContext(AuthContext);

  const userIdRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmedPasswordRef = useRef<TextInput>(null);
  const nameRef = useRef<TextInput>(null);

  const userIdErrorText = useMemo(() => {
    if (userId.length === 0) {
      return "아이디를 입력해주세요.";
    }
    if (userId.toLowerCase().startsWith("kakao_")) {
      return "'kakao_'로 시작하는 아이디는 사용할 수 없습니다.";
    }
    if (!/^[a-zA-Z0-9._-]{4,20}$/.test(userId)) {
      return "아이디는 4~20자의 영문, 숫자, 점(.), 밑줄(_), 하이픈(-)만 사용할 수 있습니다.";
    }
    return null;
  }, [userId]);

  const emailErrorText = useMemo(() => {
    if (email.length === 0) {
      return "이메일을 입력해주세요.";
    }
    if (!validator.normalizeEmail(email)) {
      return "올바른 이메일이 아닙니다.";
    }
    return null;
  }, [email]);

  const passwordErrorText = useMemo(() => {
    if (password.length === 0) {
      return "비밀번호를 입력해주세요.";
    }
    if (password.length < 4) {
      return "비밀번호는 4자리 이상이여야합니다";
    }
    if (password !== confirmedPassword) {
      return "비밀번호를 확인해주세요.";
    }
    return null;
  }, [password, confirmedPassword]);

  const confirmedPasswordErrorText = useMemo(() => {
    if (confirmedPassword.length === 0) {
      return "비밀번호를 입력해주세요.";
    }
    if (confirmedPassword.length < 4) {
      return "비밀번호는 4자리 이상이여야합니다";
    }
    if (password !== confirmedPassword) {
      return "비밀번호를 확인해주세요.";
    }
  }, [password, confirmedPassword]);

  const nameErrorText = useMemo(() => {
    if (name.length === 0) {
      return "이름을 입력해주세요.";
    }
    return null;
  }, [name.length]);

  const onChangeUserIdText = useCallback((text: string) => {
    setUserId(text);
  }, []);

  const onChangeEmailText = useCallback((text: string) => {
    setEmail(text);
  }, []);

  const onChangePasswordText = useCallback((text: string) => {
    setPassword(text);
  }, []);

  const onChangeConfirmedPasswordText = useCallback((text: string) => {
    setConfirmedPassword(text);
  }, []);

  const onChangeNameText = useCallback((text: string) => {
    setName(text);
  }, []);

  const signupButtonEnabled = useMemo(() => {
    return (
      userIdErrorText == null &&
      emailErrorText == null &&
      passwordErrorText == null &&
      confirmedPasswordErrorText == null &&
      nameErrorText == null
    );
  }, [
    userIdErrorText,
    emailErrorText,
    passwordErrorText,
    confirmedPasswordErrorText,
    nameErrorText,
  ]);

  const signupButtonStyle = useMemo(() => {
    if (signupButtonEnabled) {
      return styles.signupButton;
    }
    return [styles.signupButton, styles.disabledSignupButton];
  }, [signupButtonEnabled]);

  const onPressSignupButton = useCallback(async () => {
    try {
      await signup(userId, email, password, name);
    } catch (error: any) {
      Alert.alert(error.message);
    }
  }, [userId, email, password, name, signup]);

  const firstInvalidInputRef = useMemo(() => {
    if (userIdErrorText != null) {
      return userIdRef;
    }
    if (emailErrorText != null) {
      return emailRef;
    }
    if (passwordErrorText != null) {
      return passwordRef;
    }
    if (confirmedPasswordErrorText != null) {
      return confirmedPasswordRef;
    }
    if (nameErrorText != null) {
      return nameRef;
    }
    return null;
  }, [
    userIdErrorText,
    emailErrorText,
    passwordErrorText,
    confirmedPasswordErrorText,
    nameErrorText,
  ]);

  const onSubmitEditing = useCallback(() => {
    if (processingSignup) {
      return;
    }
    if (firstInvalidInputRef != null) {
      firstInvalidInputRef.current?.focus();
      return;
    }
    onPressSignupButton();
  }, [processingSignup, firstInvalidInputRef, onPressSignupButton]);

  const onPressBackButton = useCallback(() => {
    try {
      const canGoBack = typeof navigation.canGoBack === "function" ? navigation.canGoBack() : false;
      console.log("[Signup] onPressBackButton - Platform", Platform.OS, "canGoBack", canGoBack);
      if (canGoBack) {
        navigation.goBack();
        return;
      }
    } catch (err) {
      console.log("[Signup] onPressBackButton - canGoBack error", err);
    }

    if (Platform.OS === "web") {
      try {
        console.log("[Signup] onPressBackButton - window.history.back()");
        // @ts-ignore
        window.history.back();
        return;
      } catch (e) {
        console.log("[Signup] onPressBackButton - window.history.back error", e);
      }
    }

    navigation.goBack();
  }, [navigation]);

  const onPressSigninButton = useCallback(() => {
    navigation.navigate("Signin");
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.backButton}>
          <TouchableOpacity
            onPress={onPressBackButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="arrow-back-ios-new" size={24} color="black" />
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <Text style={styles.headerTitle}>회원가입</Text>
        </View>
      </View>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.section}>
          <Text style={styles.title}>아이디</Text>
          <TextInput
            ref={userIdRef}
            value={userId}
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={onChangeUserIdText}
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={onSubmitEditing}
          />
          {userIdErrorText && (
            <Text style={styles.errorText}>{userIdErrorText}</Text>
          )}
        </View>
        <View style={styles.section}>
          <Text style={styles.title}>이메일</Text>
          <TextInput
            ref={emailRef}
            value={email}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            onChangeText={onChangeEmailText}
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={onSubmitEditing}
          />
          {emailErrorText && (
            <Text style={styles.errorText}>{emailErrorText}</Text>
          )}
        </View>
        <View style={styles.section}>
          <Text style={styles.title}>비밀번호</Text>
          <TextInput
            ref={passwordRef}
            value={password}
            style={styles.input}
            secureTextEntry
            onChangeText={onChangePasswordText}
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={onSubmitEditing}
          />
          {passwordErrorText && (
            <Text style={styles.errorText}>{passwordErrorText}</Text>
          )}
        </View>
        <View style={styles.section}>
          <Text style={styles.title}>비밀번호 확인</Text>
          <TextInput
            ref={confirmedPasswordRef}
            value={confirmedPassword}
            style={styles.input}
            secureTextEntry
            onChangeText={onChangeConfirmedPasswordText}
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={onSubmitEditing}
          />
          {confirmedPasswordErrorText && (
            <Text style={styles.errorText}>{confirmedPasswordErrorText}</Text>
          )}
        </View>
        <View style={styles.section}>
          <Text style={styles.title}>이름</Text>
          <TextInput
            ref={nameRef}
            value={name}
            style={styles.input}
            onChangeText={onChangeNameText}
            returnKeyType="done"
            submitBehavior="submit"
            onSubmitEditing={onSubmitEditing}
          />
          {nameErrorText && (
            <Text style={styles.errorText}>{nameErrorText}</Text>
          )}
        </View>
        <View>
          {processingSignup ? (
            <View style={styles.signingContainer}>
              <ActivityIndicator />
            </View>
          ) : (
            <TouchableOpacity
              style={signupButtonStyle}
              onPress={onPressSignupButton}
              disabled={!signupButtonEnabled}
            >
              <Text style={styles.signupButtonText}>회원 가입</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.signinTextButton}
            onPress={onPressSigninButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.signinButtonText}>이미 계정이 있으신가요?</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SignupScreen;
