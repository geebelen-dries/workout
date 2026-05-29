import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { getFirebaseAuth, isFirebaseConfigured } from '../config/firebase';
import { ensureUserDocument } from '../lib/firestore/userRepository';

type AuthContextValue = {
  user: User | null;
  uid: string | null;
  loading: boolean;
  isDemoMode: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const DEMO_UID = 'demo-user-local';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [demoUid, setDemoUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const isDemoMode = !isFirebaseConfigured;

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, async (next) => {
      setUser(next);
      if (next) {
        await ensureUserDocument(next.uid);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!isFirebaseConfigured) {
      setDemoUid(DEMO_UID);
      return;
    }
    await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    if (!isFirebaseConfigured) {
      setDemoUid(DEMO_UID);
      return;
    }
    const cred = await createUserWithEmailAndPassword(
      getFirebaseAuth(),
      email,
      password,
    );
    await ensureUserDocument(cred.user.uid);
  }, []);

  const logOut = useCallback(async () => {
    if (!isFirebaseConfigured) {
      setDemoUid(null);
      return;
    }
    await signOut(getFirebaseAuth());
  }, []);

  const uid = user?.uid ?? demoUid;

  const value = useMemo(
    () => ({
      user,
      uid,
      loading,
      isDemoMode,
      signIn,
      signUp,
      logOut,
    }),
    [user, uid, loading, isDemoMode, signIn, signUp, logOut],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
