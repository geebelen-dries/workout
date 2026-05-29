import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StreakState } from '../streak/streakEngine';
import { createInitialStreak } from '../streak/streakEngine';
import type { SessionLog, UserDocument } from '../firestore/types';

const USER_KEY = '@workout/demo_user';
const SESSIONS_KEY = '@workout/demo_sessions';

export async function loadLocalUser(): Promise<UserDocument> {
  const raw = await AsyncStorage.getItem(USER_KEY);
  if (!raw) {
    const initial: UserDocument = {
      profile: {
        programId: 'lean-athletic-12w',
        currentPhase: 1,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      streak: createInitialStreak(),
    };
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(raw) as UserDocument;
}

export async function saveLocalUser(data: UserDocument): Promise<void> {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(data));
}

export async function loadLocalSessions(): Promise<SessionLog[]> {
  const raw = await AsyncStorage.getItem(SESSIONS_KEY);
  if (!raw) return [];
  return JSON.parse(raw) as SessionLog[];
}

export async function appendLocalSession(session: SessionLog): Promise<void> {
  const sessions = await loadLocalSessions();
  sessions.unshift(session);
  await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}
