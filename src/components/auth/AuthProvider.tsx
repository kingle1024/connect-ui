import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Constants from "expo-constants";
import AuthContext from "./AuthContext";
import { TypeBottomTabNavigationParams, User } from "@/types";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRootNavigation } from "@/hooks/useNavigation";
import Alert from '@blazejkustra/react-native-alert';
import apiClient from "@/utils/api";
import { saveGuestToken } from "@/utils/guest";
import {
  GUEST_CLAIM_MENU_LABEL,
  claimGuestRecords,
  describeGuestRecords,
  fetchGuestClaimSummary,
  isGuestClaimDeclined,
  markGuestClaimDeclined,
} from "@/utils/guestClaim";

// 서버의 게스트 응답(UserInfoResponse)을 앱의 User 로 바꾼다.
const toGuestUser = (data: any): User => ({
  userId: data?.userId || "",
  email: "",
  name: data?.name || "",
  profileUrl: data?.profileUrl || "",
  verified: false,
  guest: true,
});

type SignInResponse = {
  accessToken: string;
  refreshToken: string;
};

const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL ?? "";
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const navigation = useRootNavigation<"BottomTab" | "Signin">();
  const [initialized, setInitialized] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  // 비로그인 게스트. 서버가 심어준 HttpOnly 쿠키로 식별되고, 앱은 그 결과(닉네임 등)만 들고 있는다.
  const [guest, setGuest] = useState<User | null>(null);
  const [processingSignup, setProcessingSignup] = useState(false);
  const [processingSignin, setProcessingSignin] = useState(false);

  // 세션만 정리 (화면 이동 없음) — 앱 초기화 시 만료 토큰 정리용
  const clearSession = useCallback(async () => {
    await AsyncStorage.removeItem("accessToken");
    await AsyncStorage.removeItem("refreshToken");
    setUser(null);
  }, []);

  // 쿠키(또는 저장해 둔 게스트 토큰)로 기존 게스트를 복원한다.
  // 없으면 만들지 않는다 (구경만 하는 방문자까지 계정을 만들지 않게).
  const loadGuest = useCallback(async () => {
    try {
      const res = await apiClient.get("/api/auth/guest");
      if (res.status === 200 && res.data?.userId) {
        // 만료가 연장된 새 토큰으로 바꿔 둔다 (Safari 처럼 쿠키가 막힌 곳에서 헤더로 쓴다)
        await saveGuestToken(res.data.guestToken);
        setGuest(toGuestUser(res.data));
      } else {
        // 서버가 모르는 토큰(만료·정지)이면 지워서 다음에 새 게스트를 받게 한다
        await saveGuestToken(null);
        setGuest(null);
      }
    } catch (error) {
      setGuest(null);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = async () => {
      try {
        // 토큰으로 사용자 정보 가져오기
        const accessToken = await AsyncStorage.getItem("accessToken");
        if (accessToken) {
          const response = await axiosInstance.get("/api/auth/me", {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          console.log("response.status", response.status);
          console.log("response.data", response.data);
          if (response.status === 200) {
            setUser({
              userId: response.data.userId || "",
              email: response.data.email || "",
              name: response.data.name || "",
              profileUrl: response.data.profileUrl || "",
              verified: !!response.data.verified,
            });
          }
        }
      } catch (error: any) {
        console.log("error", error.response);
        // 토큰 만료 or 유효하지 않음
        if (error.response?.status === 400) {
          const refreshToken = await AsyncStorage.getItem("refreshToken");
          if (refreshToken) {
            try {
              const refreshResponse = await axiosInstance.post(
                "/api/auth/refresh-token",
                {
                  refreshToken,
                }
              );
              console.log("refreshResponse.status", refreshResponse.status);
              console.log("refreshResponse.data", refreshResponse.data);
              if (refreshResponse.status === 200) {
                const {
                  accessToken: newAccessToken,
                  refreshToken: newRefreshToken,
                } = refreshResponse.data;

                await AsyncStorage.setItem("accessToken", newAccessToken);
                await AsyncStorage.setItem("refreshToken", newRefreshToken);

                const retryResponse = await axiosInstance.get("/api/auth/me", {
                  headers: { Authorization: `Bearer ${newAccessToken}` },
                });
                console.log("retryResponse.status", retryResponse.status);
                console.log("retryResponse.data", retryResponse.data);
                if (retryResponse.status === 200) {
                  setUser({
                    userId: retryResponse.data.userId || "",
                    email: retryResponse.data.email || "",
                    name: retryResponse.data.name || "",
                    profileUrl: retryResponse.data.profileUrl || "",
                    verified: !!retryResponse.data.verified,
                  });
                } else {
                  await clearSession();
                }
              } else {
                await clearSession();
              }
            } catch (refreshError) {
              // refreshToken 만료 or 재발급 실패
              await clearSession();
            }
          } else {
            await clearSession();
          }
        } else {
          await clearSession();
        }
      } finally {
        // 회원이 아니면 예전에 쓰던 게스트가 있는지 쿠키로 확인한다.
        if (!(await AsyncStorage.getItem("accessToken"))) {
          await loadGuest();
        }
        setInitialized(true);
      }
    };
    unsubscribe();
  }, []);

  const signup = useCallback(
    async (userId: string, password: string, name: string) => {
      setProcessingSignup(true);
      try {
        const response = await axiosInstance.post("/api/auth/register", {
          userId: userId,
          password: password,
          // 이메일은 회원가입에서 받지 않는다 (마이페이지 더존 이메일 인증 때 저장)
          name: name,
        });
        if (response.status === 200) {
          console.log("response.status", response.status);
          navigation.navigate("Signin");
        }
      } catch (error: any) {
        // 서버가 검증 실패 사유를 plain text로 내려주므로 그대로 사용자에게 전달
        const serverMessage =
          typeof error.response?.data === "string" ? error.response.data : null;
        throw new Error(serverMessage ?? "회원가입 중 오류가 발생했습니다.");
      } finally {
        setProcessingSignup(false);
      }
    },
    [navigation]
  );

  const signin = useCallback(
    async (
      userId: string,
      password: string,
      redirectTab: keyof TypeBottomTabNavigationParams = "Connect"
    ) => {
      setProcessingSignin(true);
      try {
        const response = await axiosInstance.post<SignInResponse>(
          "/api/auth/login",
          {
            userId: userId,
            password: password,
          }
        );

        if (response.status === 200) {
          await AsyncStorage.setItem("accessToken", response.data.accessToken);
          await AsyncStorage.setItem(
            "refreshToken",
            response.data.refreshToken
          );

          // 로그인 응답에는 사용자 정보가 없으므로 토큰으로 실제 프로필을 조회한다.
          try {
            const me = await axiosInstance.get("/api/auth/me", {
              headers: { Authorization: `Bearer ${response.data.accessToken}` },
            });
            setUser({
              userId: me.data?.userId || userId,
              email: me.data?.email || "",
              name: me.data?.name || "",
              profileUrl: me.data?.profileUrl || "",
              verified: !!me.data?.verified,
            });
          } catch (meError) {
            // 프로필 조회에 실패해도 로그인 자체는 성공 처리한다.
            setUser({
              userId: userId,
              email: "",
              name: "",
              profileUrl: "",
            });
          }
          // 로그인 진입 지점의 탭으로 복귀 (없으면 모집 탭)
          navigation.navigate("BottomTab", {
            screen: redirectTab,
          });
        } else {
          setUser(null);
          Alert.alert(
            "로그인 실패",
            "아이디 또는 비밀번호를 확인해주세요."              
          );
        }
      } catch(error) {
        Alert.alert(
          "로그인 에러",
          "아이디 또는 비밀번호를 확인해주세요."              
        );
      } finally {
        setProcessingSignin(false);
      }
    },
    [navigation]
  );

  const signout = useCallback(async () => {
    await clearSession();
    // 로그아웃하면 이 기기의 게스트로 돌아간다 (예전에 게스트로 쓴 글/채팅을 다시 이어갈 수 있게)
    loadGuest();

    navigation.navigate("Signin");
  }, [clearSession, loadGuest, navigation]);

  const updateProfileImage = useCallback(
    async (filepath: string) => {},
    [user]
  );

  // 이름 변경·이메일 인증 등 서버 상태가 바뀐 뒤 내 정보를 다시 가져온다
  const refreshUser = useCallback(async () => {
    const accessToken = await AsyncStorage.getItem("accessToken");
    if (!accessToken) return;
    try {
      const me = await axiosInstance.get("/api/auth/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setUser({
        userId: me.data?.userId || "",
        email: me.data?.email || "",
        name: me.data?.name || "",
        profileUrl: me.data?.profileUrl || "",
        verified: !!me.data?.verified,
      });
    } catch (error) {
      // 갱신 실패 시 기존 정보 유지 (세션 만료 처리는 기존 초기화 로직에 맡긴다)
      console.log("refreshUser failed", error);
    }
  }, []);

  const addFcmToken = useCallback(async (token: string) => {}, [user]);

  /**
   * 글/댓글/채팅을 쓰는 주체를 돌려준다.
   * 회원이면 회원 정보, 아니면 게스트. 게스트가 아직 없으면 서버에 요청해 랜덤 닉네임 게스트를 만든다.
   * (서버가 쿠키를 심어주므로 이후 요청부터 본인 확인은 쿠키로 된다)
   */
  const ensureActor = useCallback(async (): Promise<User | null> => {
    if (user) return user;
    if (guest) return guest;
    try {
      const res = await apiClient.post("/api/auth/guest");
      await saveGuestToken(res.data?.guestToken);
      const created = toGuestUser(res.data);
      setGuest(created);
      return created;
    } catch (error) {
      console.log("게스트 발급 실패", error);
      return null;
    }
  }, [user, guest]);

  // 게스트 기록을 가져왔으면 이 기기의 게스트 상태를 비운다 (서버에서 비활성화됨, 다음에 새 게스트로 시작)
  const onGuestClaimed = useCallback(() => {
    setGuest(null);
  }, []);

  /**
   * 로그인하면(앱을 다시 열어 로그인이 복구될 때 포함) 이 기기에 게스트로 쓴 기록이 있는지 확인하고
   * 내 계정으로 가져올지 묻는다. 공용 기기에서 남의 기록이 붙지 않도록 자동으로 옮기지 않는다.
   * "나중에"를 누르면 같은 회원+게스트 조합으로는 다시 묻지 않고, 마이페이지 버튼으로 가져오게 안내한다.
   */
  const promptedFor = useRef<string | null>(null);
  useEffect(() => {
    const memberUserId = user?.userId;
    if (!initialized || !memberUserId || promptedFor.current === memberUserId) return;
    promptedFor.current = memberUserId;

    (async () => {
      const summary = await fetchGuestClaimSummary();
      if (!summary?.available || !summary.guestUserId) return;
      if (await isGuestClaimDeclined(memberUserId, summary.guestUserId)) return;

      const guestUserId = summary.guestUserId;
      Alert.alert(
        "게스트로 쓴 기록이 있어요",
        `이 기기에서 '${summary.guestName}'(으)로 쓴 ${describeGuestRecords(summary)}을(를) 내 계정으로 가져올까요?`,
        [
          {
            text: "나중에",
            style: "cancel",
            onPress: async () => {
              await markGuestClaimDeclined(memberUserId, guestUserId);
              Alert.alert(
                "언제든 다시 가져올 수 있어요",
                `마이페이지의 '${GUEST_CLAIM_MENU_LABEL}' 버튼으로 나중에 가져올 수 있어요. 이 기기의 브라우저 데이터를 지우면 가져올 수 없으니 참고해주세요.`
              );
            },
          },
          {
            text: "가져오기",
            onPress: async () => {
              try {
                const moved = await claimGuestRecords();
                onGuestClaimed();
                Alert.alert("가져왔어요", `${describeGuestRecords(moved)}이(가) 내 계정으로 옮겨졌어요.`);
              } catch (error) {
                Alert.alert(
                  "가져오지 못했어요",
                  `잠시 후 마이페이지의 '${GUEST_CLAIM_MENU_LABEL}' 버튼으로 다시 시도해주세요.`
                );
              }
            },
          },
        ]
      );
    })();
  }, [initialized, user?.userId, onGuestClaimed]);

  // 로그아웃하면 다음 로그인 때 다시 확인할 수 있게 초기화
  useEffect(() => {
    if (!user) promptedFor.current = null;
  }, [user]);

  const value = useMemo(() => {
    return {
      initialized,
      user,
      guest,
      ensureActor,
      onGuestClaimed,
      signup,
      processingSignup,
      signin,
      signout,
      processingSignin,
      updateProfileImage,
      addFcmToken,
      refreshUser,
    };
  }, [
    initialized,
    user,
    guest,
    ensureActor,
    onGuestClaimed,
    signup,
    processingSignup,
    signin,
    signout,
    processingSignin,
    updateProfileImage,
    addFcmToken,
    refreshUser,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
