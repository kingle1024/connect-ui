import { TypeBottomTabNavigationParams, User } from "@/types";
import { createContext } from "react";

export interface AuthContextProp {
  initialized: boolean;
  // 로그인한 회원. 게스트는 여기에 들어가지 않는다 (마이페이지·친구 등 회원 전용 화면 판단용)
  user: User | null;
  // 로그인하지 않은 게스트(쿠키로 식별). 아직 글/댓글/채팅을 써본 적 없으면 null
  guest: User | null;
  // 글/댓글/채팅을 쓰는 주체: 회원이면 회원, 아니면 게스트(없으면 서버에서 새로 발급). 실패하면 null
  ensureActor: () => Promise<User | null>;
  signup: (userId: string, password: string, name: string) => Promise<void>;
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
  guest: null,
  ensureActor: async () => null,
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
