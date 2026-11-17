import axios, { AxiosHeaders, InternalAxiosRequestConfig } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL || "";

// withCredentials: 비로그인 게스트는 서버가 심어준 HttpOnly 쿠키로 본인임을 확인한다.
// 쿠키가 요청에 실려야 하므로 반드시 켜둔다.
export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

const INVALID_BEARER = /^Bearer\s*(null|undefined)?\s*$/i;

/**
 * 로그인 상태면 저장된 Access Token 을 자동으로 붙인다.
 * (예전에는 화면마다 헤더를 직접 붙였고, 빠뜨린 곳은 요청 본문의 userId 를 서버가 그대로 믿었다)
 *
 * 토큰이 없을 때 "Bearer null" 같은 헤더가 나가면 서버는 그걸 회원 요청으로 보고
 * 게스트 쿠키를 확인하지 않는다. 그래서 그런 헤더는 지운다.
 */
axiosInstance.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const headers = AxiosHeaders.from(config.headers);
  const current = headers.get("Authorization");
  if (typeof current === "string" && INVALID_BEARER.test(current)) {
    headers.delete("Authorization");
  }
  if (!headers.has("Authorization")) {
    const accessToken = await AsyncStorage.getItem("accessToken");
    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }
  }
  config.headers = headers;
  return config;
});

let refreshing: Promise<string | null> | null = null;

// Refresh Token 으로 Access Token 을 새로 받는다. 동시에 여러 요청이 401 을 받아도 한 번만 갱신한다.
const refreshAccessToken = (): Promise<string | null> => {
  if (!refreshing) {
    refreshing = (async () => {
      const refreshToken = await AsyncStorage.getItem("refreshToken");
      if (!refreshToken) return null;
      try {
        const res = await axios.post(`${API_BASE_URL}/api/auth/refresh-token`, { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = res.data ?? {};
        if (!accessToken) return null;
        await AsyncStorage.setItem("accessToken", accessToken);
        if (newRefreshToken) await AsyncStorage.setItem("refreshToken", newRefreshToken);
        return accessToken as string;
      } catch {
        return null;
      }
    })().finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
};

// 로그인 사용자의 Access Token(1시간)이 만료돼 401 이 나면 한 번만 갱신해서 다시 보낸다.
axiosInstance.interceptors.response.use(undefined, async (error) => {
  const config = error?.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
  if (error?.response?.status !== 401 || !config || config._retried) {
    throw error;
  }
  const hadToken = !!(await AsyncStorage.getItem("accessToken"));
  if (!hadToken) throw error;

  const newToken = await refreshAccessToken();
  if (!newToken) throw error;

  config._retried = true;
  const headers = AxiosHeaders.from(config.headers);
  headers.set("Authorization", `Bearer ${newToken}`);
  config.headers = headers;
  return axiosInstance(config);
});

export default axiosInstance;
