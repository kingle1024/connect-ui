import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import Alert from "@blazejkustra/react-native-alert";
import { MaterialIcons } from "@expo/vector-icons";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AuthContext from "@/components/auth/AuthContext";
import { Post } from "@/types";
import { useRootNavigation } from "@/hooks/useNavigation";
import { formatRelativeTime } from "@/utils/formatRelativeTime";

const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL ?? "";

export default function MyPageScreen() {
  const { user, updateName, verifyDouzoneEmail } = useContext(AuthContext);
  const navigation = useRootNavigation<"ConnectDetail">();

  const [name, setName] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  // 더존 이메일 인증 상태
  const [douzoneEmail, setDouzoneEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // user 정보가 갱신되면 입력값도 동기화
  useEffect(() => {
    setName(user?.name ?? "");
  }, [user?.name]);

  // 내가 올린 글 조회
  const fetchMyPosts = useCallback(async () => {
    if (!user?.userId) {
      setMyPosts([]);
      return;
    }
    setLoadingPosts(true);
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const res = await fetch(
        `${API_BASE_URL}/api/boards/author/${encodeURIComponent(user.userId)}`,
        {
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setMyPosts(Array.isArray(data?.posts) ? data.posts : []);
      } else {
        console.warn("fetchMyPosts failed:", res.status);
      }
    } catch (e) {
      console.warn("fetchMyPosts error:", e);
    } finally {
      setLoadingPosts(false);
    }
  }, [user?.userId]);

  useEffect(() => {
    fetchMyPosts();
  }, [fetchMyPosts]);

  // 이름이 실제로 바뀌었고 비어있지 않을 때만 저장 가능
  const nameChanged = useMemo(() => {
    const trimmed = name.trim();
    return trimmed.length > 0 && trimmed !== (user?.name ?? "");
  }, [name, user?.name]);

  const onPressSave = useCallback(async () => {
    if (!nameChanged || saving) {
      return;
    }
    setSaving(true);
    try {
      await updateName(name.trim());
      Alert.alert(
        "저장 완료",
        "이름이 변경되었습니다. 새로 작성하는 모집 글부터 반영됩니다."
      );
    } catch (e: any) {
      Alert.alert("저장 실패", e?.message ?? "이름 변경 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }, [name, nameChanged, saving, updateName]);

  // 더존 이메일로 인증번호 발송
  const onSendCode = useCallback(async () => {
    const email = douzoneEmail.trim();
    if (!email.toLowerCase().endsWith("@douzone.com")) {
      Alert.alert("알림", "@douzone.com 이메일만 인증할 수 있습니다.");
      return;
    }
    setSendingCode(true);
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const res = await fetch(
        `${API_BASE_URL}/api/account/verify-douzone/send-code`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ email }),
        }
      );
      const data = await res.json().catch(() => null);
      if (res.ok) {
        setCodeSent(true);
        Alert.alert(
          "발송 완료",
          "인증번호를 이메일로 보냈습니다. 메일함을 확인해주세요."
        );
      } else {
        Alert.alert("발송 실패", data?.message ?? "인증번호 발송에 실패했습니다.");
      }
    } catch (e) {
      Alert.alert("발송 실패", "인증번호 발송 중 오류가 발생했습니다.");
    } finally {
      setSendingCode(false);
    }
  }, [douzoneEmail]);

  // 인증번호 확인 → 인증 완료
  const onVerify = useCallback(async () => {
    if (!code.trim()) {
      Alert.alert("알림", "인증번호를 입력해주세요.");
      return;
    }
    setVerifying(true);
    try {
      await verifyDouzoneEmail(douzoneEmail.trim(), code.trim());
      Alert.alert(
        "인증 완료",
        "더존 이메일 인증이 완료되었습니다. 모집 글 이름 옆에 인증 마크가 표시됩니다."
      );
      setCode("");
      setCodeSent(false);
      setDouzoneEmail("");
    } catch (e: any) {
      Alert.alert("인증 실패", e?.message ?? "인증에 실패했습니다.");
    } finally {
      setVerifying(false);
    }
  }, [code, douzoneEmail, verifyDouzoneEmail]);

  return (
    <View style={styles.container}>
      {/* 이름 수정 영역 */}
      <View style={styles.section}>
        <Text style={styles.label}>이름</Text>
        <View style={styles.nameRow}>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="이름을 입력하세요"
            maxLength={20}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={[
              styles.saveBtn,
              (!nameChanged || saving) && styles.saveBtnDisabled,
            ]}
            onPress={onPressSave}
            disabled={!nameChanged || saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>저장</Text>
            )}
          </TouchableOpacity>
        </View>
        <Text style={styles.hint}>
          모집 글에 표시되는 이름입니다. 변경하면 새로 쓰는 글부터 반영됩니다.
        </Text>
      </View>

      <View style={styles.divider} />

      {/* 더존 이메일 인증 */}
      <View style={styles.section}>
        <Text style={styles.label}>더존 이메일 인증</Text>
        {user?.verified ? (
          <View style={styles.verifiedBadge}>
            <MaterialIcons name="verified" size={20} color="#3B82F6" />
            <Text style={styles.verifiedText}>인증 완료</Text>
          </View>
        ) : (
          <>
            <View style={styles.nameRow}>
              <TextInput
                style={styles.input}
                value={douzoneEmail}
                onChangeText={setDouzoneEmail}
                placeholder="name@douzone.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={[styles.saveBtn, sendingCode && styles.saveBtnDisabled]}
                onPress={onSendCode}
                disabled={sendingCode}
              >
                {sendingCode ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>발송</Text>
                )}
              </TouchableOpacity>
            </View>
            {codeSent && (
              <View style={[styles.nameRow, { marginTop: 8 }]}>
                <TextInput
                  style={styles.input}
                  value={code}
                  onChangeText={setCode}
                  placeholder="인증번호 6자리"
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <TouchableOpacity
                  style={[styles.saveBtn, verifying && styles.saveBtnDisabled]}
                  onPress={onVerify}
                  disabled={verifying}
                >
                  {verifying ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.saveBtnText}>인증</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
            <Text style={styles.hint}>
              @douzone.com 이메일을 인증하면 모집 글 이름 옆에 인증 마크가 표시됩니다.
            </Text>
          </>
        )}
      </View>

      <View style={styles.divider} />

      {/* 내가 올린 글 */}
      <Text style={[styles.label, styles.postsHeader]}>내가 올린 글</Text>
      {loadingPosts ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={myPosts}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.postItem}
              onPress={() =>
                navigation.navigate("ConnectDetail", { parentId: item.id })
              }
            >
              <Text style={styles.postTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.postMeta} numberOfLines={1}>
                {item.destination} · {formatRelativeTime(item.insertDts)} · 댓글{" "}
                {item.commentCount}
              </Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>작성한 글이 없습니다.</Text>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  section: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginRight: 8,
  },
  saveBtn: {
    backgroundColor: "tomato",
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 64,
  },
  saveBtnDisabled: {
    backgroundColor: "#ccc",
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  hint: {
    marginTop: 8,
    fontSize: 12,
    color: "#888",
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  verifiedText: {
    marginLeft: 6,
    fontSize: 15,
    fontWeight: "600",
    color: "#3B82F6",
  },
  divider: {
    height: 8,
    backgroundColor: "#f0f2f5",
  },
  postsHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  postItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  postTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#222",
  },
  postMeta: {
    marginTop: 4,
    fontSize: 12,
    color: "#888",
  },
  empty: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
  },
});
