import AuthContext from "@/components/auth/AuthContext";
import { useCallback, useContext, useMemo, useState } from "react";
import {
  Text,
  View,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Alert from '@blazejkustra/react-native-alert';
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRootNavigation, useRootRoute } from "@/hooks/useNavigation";
import styles from "./SigninScreen.styles";

const SigninScreen = () => {
  const navigation = useRootNavigation<"Signin">();
  const route = useRootRoute<"Signin">();
  const redirectTab = route.params?.redirectTab;
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const { signin, processingSignin } = useContext(AuthContext);

  const userIdErrorText = useMemo(() => {
    if (userId.length === 0) {
      return "아이디를 입력해주세요.";
    }
    return null;
  }, [userId]);

  const passwordErrorText = useMemo(() => {
    if (password.length === 0) {
      return "비밀번호를 입력해주세요.";
    }
    if (password.length < 4) {
      return "비밀번호는 4자리 이상이여야합니다";
    }
    return null;
  }, [password]);

  const onChangeUserIdText = useCallback((text: string) => {
    setUserId(text);
  }, []);

  const onChangePasswordText = useCallback((text: string) => {
    setPassword(text);
  }, []);

  const signinButtonEnabled = useMemo(() => {
    return userIdErrorText == null && passwordErrorText == null;
  }, [userIdErrorText, passwordErrorText]);

  const signinButtonStyle = useMemo(() => {
    if (signinButtonEnabled) {
      return styles.signinButton;
    }
    return [styles.signinButton, styles.disabledSigninButton];
  }, [signinButtonEnabled]);

  const onPressSigninButton = useCallback(async () => {
    try {
      await signin(userId, password, redirectTab);
    } catch (error: any) {
      Alert.alert(error.message);
    }
  }, [userId, password, signin, redirectTab]);

  const onPressBackButton = useCallback(() => {
    navigation.goBack();
  }, [navigation.goBack]);

  const onPressSignUp = useCallback(() => {
    navigation.navigate("Signup");
  }, [navigation]);

  const onPressFindPassword = useCallback(() => {
    navigation.navigate("FindPassword");
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
            <Text style={styles.title}>아이디</Text>
            <TextInput
              value={userId}
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={onChangeUserIdText}
            />
            {userIdErrorText && (
              <Text style={styles.errorText}>{userIdErrorText}</Text>
            )}
          </View>
          <View style={styles.section}>
            <Text style={styles.title}>비밀번호</Text>
            <TextInput
              value={password}
              style={styles.input}
              secureTextEntry
              onChangeText={onChangePasswordText}
              returnKeyType="done"
              onSubmitEditing={() => {
                if (signinButtonEnabled) {
                  onPressSigninButton();
                }
              }}
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
              onPress={onPressFindPassword}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.linkText}>비밀번호 찾기</Text>
            </TouchableOpacity>
            <View style={{ paddingLeft: 10, paddingRight: 10 }} />
            <TouchableOpacity
              onPress={onPressSignUp}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.linkText}>회원가입</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SigninScreen;
