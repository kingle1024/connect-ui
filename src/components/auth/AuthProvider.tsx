import { useCallback, useEffect, useMemo, useState } from "react";
import Constants from "expo-constants";
import AuthContext from "./AuthContext";
import { User } from "@/types";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRootNavigation } from "@/hooks/useNavigation";

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
        }
      } finally {
        setProcessingSignin(false);
      }
    },
    [navigation]
  );

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
    signout,
    processingSignin,
    updateProfileImage,
    addFcmToken,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
