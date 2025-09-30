import { useCallback, useMemo, useState } from "react";
import AuthContext from "./AuthContext";
import { User } from "@/types";

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [initialized, setInitialized] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [processingSignup, setProcessingSignup] = useState(false);
  const [processingSignin, setProcessingSignin] = useState(false);

  const signup = useCallback(
    async (email: string, password: string, name: string) => {},
    []
  );

  const signin = useCallback(async (email: string, password: string) => {}, []);

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
    processingSignin,
    updateProfileImage,
    addFcmToken,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
