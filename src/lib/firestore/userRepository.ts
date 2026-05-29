import {
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { getFirestoreDb, isFirebaseConfigured } from '../../config/firebase';
import { createInitialStreak, type StreakState } from '../streak/streakEngine';
import type { UserDocument, UserProfile } from './types';

const defaultProfile: UserProfile = {
  programId: 'lean-athletic-12w',
  currentPhase: 1,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
};

export function userDocRef(uid: string) {
  return doc(getFirestoreDb(), 'users', uid);
}

export async function ensureUserDocument(uid: string): Promise<UserDocument> {
  const ref = userDocRef(uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return snap.data() as UserDocument;
  }
  const initial: UserDocument = {
    profile: defaultProfile,
    streak: createInitialStreak(),
  };
  await setDoc(ref, initial);
  return initial;
}

export function subscribeToUser(
  uid: string,
  onData: (data: UserDocument | null) => void,
  onError?: (error: Error) => void,
): Unsubscribe | null {
  if (!isFirebaseConfigured) {
    onData({
      profile: defaultProfile,
      streak: createInitialStreak(),
    });
    return null;
  }
  return onSnapshot(
    userDocRef(uid),
    (snap) => {
      onData(snap.exists() ? (snap.data() as UserDocument) : null);
    },
    (err) => onError?.(err as Error),
  );
}

export async function updateUserStreak(
  uid: string,
  streak: StreakState,
): Promise<void> {
  if (!isFirebaseConfigured) return;
  await updateDoc(userDocRef(uid), { streak });
}

export async function updateUserProfile(
  uid: string,
  profile: Partial<UserProfile>,
): Promise<void> {
  if (!isFirebaseConfigured) return;
  const ref = userDocRef(uid);
  const snap = await getDoc(ref);
  const existing = snap.exists()
    ? (snap.data() as UserDocument).profile
    : defaultProfile;
  await setDoc(ref, { profile: { ...existing, ...profile } }, { merge: true });
}
