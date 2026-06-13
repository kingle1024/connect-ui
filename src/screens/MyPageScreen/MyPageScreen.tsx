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
import CustomDateTimePicker from "@/components/CustomDateTimePicker";
import dayjs from "dayjs";

const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL ?? "";

// 날짜 알림 항목
type Reminder = {
  id: number;
  reminderDate: string;
  content: string;
  email: string;
  notified: boolean;
};

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

  // 일정 알림 상태
  const [reminderDate, setReminderDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [reminderContent, setReminderContent] = useState("");
  const [reminderEmail, setReminderEmail] = useState(user?.email ?? "");
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [addingReminder, setAddingReminder] = useState(false);

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
        "더존 이메일 인증이 완료되었습니다. 이제 일정 알림을 등록할 수 있습니다."
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

  // 내 알림 목록 조회
  const fetchReminders = useCallback(async () => {
    const token = await AsyncStorage.getItem("accessToken");
    if (!token) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/account/reminders`, {
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setReminders(await res.json());
      }
    } catch (e) {
      console.warn("fetchReminders error:", e);
    }
  }, []);

  useEffect(() => {
    // 알림은 누구나 마이페이지에서 조회 가능 (이메일 발송만 인증자 한정)
    fetchReminders();
  }, [fetchReminders]);

  // user 이메일 동기화 (알림 기본 수신 이메일)
  useEffect(() => {
    setReminderEmail(user?.email ?? "");
  }, [user?.email]);

  const onChangeReminderDate = useCallback((_event: any, selected?: Date) => {
    if (selected) {
      setReminderDate(selected);
    }
    setShowDatePicker(false);
  }, []);

  const onAddReminder = useCallback(async () => {
    if (!reminderContent.trim()) {
      Alert.alert("알림", "알림 내용을 입력해주세요. (예: 오전 반차)");
      return;
    }
    setAddingReminder(true);
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const res = await fetch(`${API_BASE_URL}/api/account/reminders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reminderDate: dayjs(reminderDate).format("YYYY-MM-DD"),
          content: reminderContent.trim(),
          email: reminderEmail.trim() || undefined,
        }),
      });
      if (res.ok) {
        setReminderContent("");
        fetchReminders();
        Alert.alert("등록 완료", "설정한 날짜 오전에 이메일로 알림을 보내드립니다.");
      } else {
        const msg = await res.text().catch(() => null);
        Alert.alert("등록 실패", msg || "알림 등록에 실패했습니다.");
      }
    } catch (e) {
      Alert.alert("등록 실패", "알림 등록 중 오류가 발생했습니다.");
    } finally {
      setAddingReminder(false);
    }
  }, [reminderContent, reminderDate, reminderEmail, fetchReminders]);

  const onDeleteReminder = useCallback(
    async (id: number) => {
      try {
        const token = await AsyncStorage.getItem("accessToken");
        await fetch(`${API_BASE_URL}/api/account/reminders/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchReminders();
      } catch (e) {
        console.warn("deleteReminder error:", e);
      }
    },
    [fetchReminders]
  );

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
              @douzone.com 이메일을 인증하면 모집 글 인증 마크 표시 및 일정 알림 기능을 사용할 수 있습니다.
            </Text>
          </>
        )}
      </View>

      <View style={styles.divider} />

      {/* 일정 알림 (누구나 등록·조회 / 이메일 발송은 인증자만) */}
      <View style={styles.section}>
        <Text style={styles.label}>일정 알림</Text>
        {!user?.verified && (
          <View style={styles.reminderNotice}>
            <MaterialIcons name="mark-email-unread" size={18} color="#3B82F6" />
            <Text style={styles.reminderNoticeText}>
              이메일 인증을 하면 설정한 날짜에 알림 메일을 받을 수 있어요. (미인증 시 마이페이지에서 보기만 가능)
            </Text>
          </View>
        )}
        <View style={styles.reminderRow}>
          <View style={styles.datePickerWrap}>
            <CustomDateTimePicker
              testID="reminderDatePicker"
              value={reminderDate}
              mode="date"
              is24Hour={true}
              onChange={onChangeReminderDate}
              datePickerButtonComponentStyle={styles.datePickerButton}
              datePickerTextComponentStyle={styles.datePickerText}
              showDatePicker={showDatePicker}
              setShowDatePicker={setShowDatePicker}
            />
          </View>
          <TextInput
            style={[styles.input, { flex: 1, marginRight: 0 }]}
            value={reminderContent}
            onChangeText={setReminderContent}
            placeholder="예: 오전 반차"
            maxLength={50}
          />
        </View>
        <TextInput
          style={[styles.input, { marginTop: 8 }]}
          value={reminderEmail}
          onChangeText={setReminderEmail}
          placeholder="알림 받을 이메일"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={[
            styles.saveBtn,
            styles.reminderAddBtn,
            addingReminder && styles.saveBtnDisabled,
          ]}
          onPress={onAddReminder}
          disabled={addingReminder}
        >
          {addingReminder ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>알림 추가</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.hint}>
          {user?.verified
            ? "설정한 날짜 오전에 입력한 이메일로 알림을 보내드립니다."
            : "지금은 마이페이지에서 보기만 가능합니다. 위에서 더존 이메일을 인증하면 알림 메일을 받을 수 있어요."}
        </Text>

        {reminders.map((r) => (
          <View key={r.id} style={styles.reminderItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.reminderItemDate}>{r.reminderDate}</Text>
              <Text style={styles.reminderItemContent}>{r.content}</Text>
            </View>
            <TouchableOpacity
              onPress={() => onDeleteReminder(r.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.reminderDelete}>삭제</Text>
            </TouchableOpacity>
          </View>
        ))}
        {reminders.length === 0 && (
          <Text style={styles.reminderEmpty}>등록된 알림이 없습니다.</Text>
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
  reminderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  datePickerWrap: {
    marginRight: 8,
  },
  datePickerButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minWidth: 150,
  },
  datePickerText: {
    fontSize: 15,
    color: "#222",
  },
  reminderAddBtn: {
    marginTop: 10,
    alignSelf: "flex-start",
    paddingHorizontal: 24,
  },
  reminderItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  reminderItemDate: {
    fontSize: 13,
    color: "#3B82F6",
    fontWeight: "600",
  },
  reminderItemContent: {
    fontSize: 15,
    color: "#222",
    marginTop: 2,
  },
  reminderDelete: {
    fontSize: 13,
    color: "#ff4444",
  },
  reminderEmpty: {
    fontSize: 13,
    color: "#999",
    marginTop: 10,
  },
  reminderNotice: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  reminderNoticeText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
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
