import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { auth, firebaseReady } from "../firebase";

// 계정 없이 브라우저별 uid(익명 로그인). Convene 패턴. Firebase 미설정 시 uid=null.
const AuthContext = createContext({ uid: null, ready: false });

export function AuthProvider({ children }) {
  const [uid, setUid] = useState(null);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, async (u) => {
      if (u) setUid(u.uid);
      else {
        try {
          await signInAnonymously(auth);
        } catch {
          // 익명 로그인 실패 무시(앱은 계속 동작)
        }
      }
    });
  }, []);

  return (
    <AuthContext.Provider value={{ uid, ready: firebaseReady }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
