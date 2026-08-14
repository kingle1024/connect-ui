import { useCallback, useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Constants from "expo-constants";
import Toast from "react-native-toast-message";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AuthContext from "@/components/auth/AuthContext";
import theme from "@/modules/theme";

const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL ?? "";
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// 서버 ApiResponse<T> 형태: { success, message, data }
const errorMessageOf = (error: any, fallback: string) =>
  error?.response?.data?.message ?? fallback;

export default function MyPageScreen() {
  const { user: me, refreshUser } = useContext(AuthContext);
  const insets = useSafeAreaInsets();

  // 이름(별칭) 변경
  const [nameInput, setNameInput] = useState(me?.name ?? "");
  const [savingName, setSavingName] = useState(false);

  // 더존 이메일 인증
  const [emailInput, setEmailInput] = useState(
    me?.email?.toLowerCase().endsWith("@douzone.com") ? me.email : ""
  );
  const [codeInput, setCodeInput] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [confirmingCode, setConfirmingCode] = useState(false);

  // 로그인 상태가 바뀌면(예: 새로고침 후 복구) 입력값 동기화
  useEffect(() => {
    setNameInput(me?.name ?? "");
    if (me?.email?.toLowerCase().endsWith("@douzone.com")) {
      setEmailInput(me.email);
    }
  }, [me?.name, me?.email]);

  const showToast = useCallback(
    (type: "success" | "error", text1: string, text2?: string) => {
      Toast.show({ type, text1, text2, visibilityTime: 3000, topOffset: insets.top });
    },
    [insets.top]
  );

  const onSaveName = useCallback(async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      showToast("error", "이름을 입력해주세요.");
      return;
    }
    if (savingName) return;
    setSavingName(true);
    try {
      const accessToken = await AsyncStorage.getItem("accessToken");
      await axiosInstance.put(
        "/api/account/me/name",
        { name: trimmed },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      await refreshUser();
      showToast("success", "이름이 변경되었습니다.");
    } catch (error: any) {
      showToast("error", "이름 변경 실패", errorMessageOf(error, "잠시 후 다시 시도해주세요."));
    } finally {
      setSavingName(false);
    }
  }, [nameInput, savingName, refreshUser, showToast]);

  const onSendCode = useCallback(async () => {
    const email = emailInput.trim();
    if (!email.toLowerCase().endsWith("@douzone.com")) {
      showToast("error", "@douzone.com 이메일만 인증할 수 있습니다.");
      return;
    }
    if (sendingCode) return;
    setSendingCode(true);
    try {
      await axiosInstance.post("/api/account/verify-douzone/send-code", { email });
      setCodeSent(true);
      showToast("success", "인증번호가 이메일로 발송되었습니다.");
    } catch (error: any) {
      showToast("error", "인증번호 발송 실패", errorMessageOf(error, "잠시 후 다시 시도해주세요."));
    } finally {
      setSendingCode(false);
    }
  }, [emailInput, sendingCode, showToast]);

  const onConfirmCode = useCallback(async () => {
    const email = emailInput.trim();
    const code = codeInput.trim();
    if (code.length === 0) {
      showToast("error", "인증번호를 입력해주세요.");
      return;
    }
    if (confirmingCode) return;
    setConfirmingCode(true);
    try {
      const accessToken = await AsyncStorage.getItem("accessToken");
      await axiosInstance.post(
        "/api/account/verify-douzone/confirm",
        { email, code },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      await refreshUser();
      setCodeSent(false);
      setCodeInput("");
      showToast("success", "더존 이메일 인증이 완료되었습니다.");
    } catch (error: any) {
      showToast("error", "인증 실패", errorMessageOf(error, "인증번호를 다시 확인해주세요."));
    } finally {
      setConfirmingCode(false);
    }
  }, [emailInput, codeInput, confirmingCode, refreshUser, showToast]);

  if (!me) {
    return (
      <View style={styles.center}>
        <Text style={styles.mutedText}>로그인이 필요합니다.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 프로필 정보 수정 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>프로필</Text>
        <Text style={styles.label}>아이디</Text>
        <Text style={styles.readonlyValue}>{me.userId}</Text>

        <Text style={styles.label}>이름(별칭)</Text>
        <TextInput
          style={styles.input}
          value={nameInput}
          onChangeText={setNameInput}
          placeholder="이름을 입력해주세요."
          placeholderTextColor={theme.colors.textMuted}
        />
        <TouchableOpacity style={styles.primaryButton} onPress={onSaveName} disabled={savingName}>
          {savingName ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.primaryButtonText}>이름 저장</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* 더존 이메일 인증 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>더존 이메일 인증</Text>
        {me.verified ? (
          <View style={styles.verifiedRow}>
            <MaterialIcons name="verified" size={20} color={theme.colors.info} />
            <Text style={styles.verifiedText}>인증 완료 ({me.email})</Text>
          </View>
        ) : (
          <>
            <Text style={styles.helperText}>
              @douzone.com 이메일을 인증하면 작성한 글에 인증 마크가 표시됩니다.
            </Text>
            <Text style={styles.label}>더존 이메일</Text>
            <TextInput
              style={styles.input}
              value={emailInput}
              onChangeText={setEmailInput}
              placeholder="example@douzone.com"
              placeholderTextColor={theme.colors.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onSendCode}
              disabled={sendingCode}
            >
              {sendingCode ? (
                <ActivityIndicator color={theme.colors.primary} size="small" />
              ) : (
                <Text style={styles.secondaryButtonText}>
                  {codeSent ? "인증번호 재전송" : "인증번호 전송"}
                </Text>
              )}
            </TouchableOpacity>

            {codeSent ? (
              <>
                <Text style={styles.label}>인증번호</Text>
                <TextInput
                  style={styles.input}
                  value={codeInput}
                  onChangeText={setCodeInput}
                  placeholder="이메일로 받은 인증번호 6자리"
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={onConfirmCode}
                  disabled={confirmingCode}
                >
                  {confirmingCode ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.primaryButtonText}>인증 확인</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : null}
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  content: {
    padding: 20,
    gap: 24,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
  },
  mutedText: {
    fontSize: 15,
    color: theme.colors.textMuted,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 6,
  },
  helperText: {
    fontSize: 13,
    color: theme.colors.textMuted,
    lineHeight: 18,
  },
  readonlyValue: {
    fontSize: 15,
    color: theme.colors.textMuted,
    paddingVertical: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.divider,
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
  },
  primaryButton: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  secondaryButton: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primaryTint,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: theme.colors.primary,
    fontSize: 15,
    fontWeight: "600",
  },
  verifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
  },
  verifiedText: {
    fontSize: 15,
    color: theme.colors.text,
    fontWeight: "600",
  },
});
