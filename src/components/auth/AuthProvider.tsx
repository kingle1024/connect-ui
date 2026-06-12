import { useCallback, useEffect, useMemo, useState } from "react";
import Constants from "expo-constants";
import AuthContext from "./AuthContext";
import { User } from "@/types";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRootNavigation } from "@/hooks/useNavigation";
import Alert from '@blazejkustra/react-native-alert';
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";

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
  const [processingSignup, setProcessingSignup] = useState(false);
  const [processingSignin, setProcessingSignin] = useState(false);

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
                  });
                } else {
                  await signout();
                }
              } else {
                await signout();
              }
            } catch (refreshError) {
              // refreshToken 만료 or 재발급 실패
              await signout();
            }
          } else {
            await signout();
          }
        } else {
          await signout();
        }
      } finally {
        setInitialized(true);
      }
    };
    unsubscribe();
  }, []);

  const signup = useCallback(
    async (email: string, password: string, name: string) => {
      setProcessingSignup(true);
      try {
        const response = await axiosInstance.post("/api/auth/register", {
          userId: email,
          password: password,
          email: email,
          name: name,
        });
        if (response.status === 200) {
          console.log("response.status", response.status);
          navigation.navigate("Signin");
        }
      } finally {
        setProcessingSignup(false);
      }
    },
    [navigation]
  );

  const signin = useCallback(
    async (email: string, password: string) => {
      setProcessingSignin(true);
      try {
        const response = await axiosInstance.post<SignInResponse>(
          "/api/auth/login",
          {
            userId: email,
            password: password,
          }
        );

        if (response.status === 200) {
          await AsyncStorage.setItem("accessToken", response.data.accessToken);
          await AsyncStorage.setItem(
            "refreshToken",
            response.data.refreshToken
          );

          setUser({
            userId: email,
            email: email,
            name: "익명",
            profileUrl: "",
          });
          navigation.navigate("BottomTab", {
            screen: "Connect",
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

  // 카카오 소셜 로그인
  // 1) 백엔드의 인가 시작 엔드포인트를 웹 인증 세션으로 연다
  // 2) 백엔드가 로그인 완료 후 redirectUri 로 accessToken/refreshToken 을 실어 돌려보낸다
  // 3) 토큰을 저장하고 /api/auth/me 로 사용자 정보를 채운 뒤 메인으로 이동
  const kakaoSignin = useCallback(async () => {
    setProcessingSignin(true);
    try {
      // 플랫폼에 맞는 콜백 주소 생성 (웹: origin, 네이티브: connect://oauth-callback)
      const redirectUri = Linking.createURL("oauth-callback");
      const authUrl = `${API_BASE_URL}/api/auth/kakao/authorize?redirectUri=${encodeURIComponent(
        redirectUri
      )}`;

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      if (result.type !== "success" || !result.url) {
        // 사용자가 취소했거나 실패한 경우 조용히 종료
        return;
      }

      const { queryParams } = Linking.parse(result.url);
      const accessToken = queryParams?.accessToken as string | undefined;
      const refreshToken = queryParams?.refreshToken as string | undefined;

      if (!accessToken || !refreshToken) {
        Alert.alert("카카오 로그인 실패", "토큰을 받지 못했습니다.");
        return;
      }

      await AsyncStorage.setItem("accessToken", accessToken);
      await AsyncStorage.setItem("refreshToken", refreshToken);

      // 발급받은 토큰으로 사용자 정보 조회
      const me = await axiosInstance.get("/api/auth/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      setUser({
        userId: me.data.userId || "",
        email: me.data.email || "",
        name: me.data.name || "",
        profileUrl: me.data.profileUrl || "",
      });

      navigation.navigate("BottomTab", { screen: "Connect" });
    } catch (error) {
      console.log("kakaoSignin error", error);
      Alert.alert("카카오 로그인 에러", "다시 시도해주세요.");
    } finally {
      setProcessingSignin(false);
    }
  }, [navigation]);

  const signout = useCallback(async () => {
    await AsyncStorage.removeItem("accessToken");
    await AsyncStorage.removeItem("refreshToken");
    setUser(null);

    navigation.navigate("Signin");
  }, [navigation]);

  const updateProfileImage = useCallback(
    async (filepath: string) => {},
    [user]
  );

  const addFcmToken = useCallback(async (token: string) => {}, [user]);

  const value = useMemo(() => {
    return {
      initialized,
      user,
      signup,
      processingSignup,
      signin,
      kakaoSignin,
      signout,
      processingSignin,
      updateProfileImage,
      addFcmToken,
    };
  }, [
    initialized,
    user,
    signup,
    processingSignup,
    signin,
    kakaoSignin,
    signout,
    processingSignin,
    updateProfileImage,
    addFcmToken,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
