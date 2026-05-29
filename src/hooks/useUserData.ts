import { useEffect, useState } from 'react';
import { isFirebaseConfigured } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import type { UserDocument } from '../lib/firestore/types';
import { subscribeToUser } from '../lib/firestore/userRepository';
import { loadLocalUser } from '../lib/storage/localStore';
import { createInitialStreak } from '../lib/streak/streakEngine';

const fallback: UserDocument = {
  profile: {
    programId: 'lean-athletic-12w',
    currentPhase: 1,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  },
  streak: createInitialStreak(),
};

export function useUserData() {
  const { uid } = useAuth();
  const [userData, setUserData] = useState<UserDocument>(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    if (!isFirebaseConfigured) {
      loadLocalUser()
        .then(setUserData)
        .catch((e) => setError(String(e)))
        .finally(() => setLoading(false));
      return;
    }

    const unsub = subscribeToUser(
      uid,
      (data) => {
        if (data) setUserData(data);
        setLoading(false);
      },
      (e) => {
        setError(e.message);
        setLoading(false);
      },
    );

    return () => unsub?.();
  }, [uid]);

  return { userData, loading, error };
}
