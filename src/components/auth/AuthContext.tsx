import { TypeBottomTabNavigationParams, User } from "@/types";
import { createContext } from "react";

export interface AuthContextProp {
  initialized: boolean;
  user: User | null;
  signup: (userId: string, email: string, password: string, name: string) => Promise<void>;
  processingSignup: boolean;
  signin: (
    userId: string,
    password: string,
    redirectTab?: keyof TypeBottomTabNavigationParams
  ) => Promise<void>;
  signout: () => Promise<void>;
  processingSignin: boolean;
  updateProfileImage: (filepath: string) => Promise<void>;
  addFcmToken: (token: string) => Promise<void>;
  // 서버에서 내 정보를 다시 가져와 컨텍스트를 갱신 (이름 변경·이메일 인증 후 사용)
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProp>({
  initialized: false,
  user: null,
  signup: async () => {},
  processingSignup: false,
  signin: async () => {},
  signout: async () => {},
  processingSignin: false,
  updateProfileImage: async () => {},
  addFcmToken: async () => {},
  refreshUser: async () => {},
});

export default AuthContext;
