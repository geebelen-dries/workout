import { addDoc, collection, getDocs } from 'firebase/firestore';
import { getFirestoreDb, isFirebaseConfigured } from '../../config/firebase';
import type { SessionLog } from './types';

export async function saveSession(
  uid: string,
  session: SessionLog,
): Promise<string | null> {
  if (!isFirebaseConfigured) {
    return `local-${Date.now()}`;
  }
  const ref = collection(getFirestoreDb(), 'users', uid, 'sessions');
  const docRef = await addDoc(ref, session);
  return docRef.id;
}

async function loadAllSessions(uid: string): Promise<SessionLog[]> {
  if (!isFirebaseConfigured) {
    const { loadLocalSessions } = await import('../storage/localStore');
    return loadLocalSessions();
  }
  const ref = collection(getFirestoreDb(), 'users', uid, 'sessions');
  const snap = await getDocs(ref);
  return snap.docs.map((d) => d.data() as SessionLog);
}

export async function getPhaseSessions(
  uid: string,
  phase?: number,
): Promise<SessionLog[]> {
  const sessions = await loadAllSessions(uid);
  const filtered =
    phase == null ? sessions : sessions.filter((s) => s.phase === phase);
  return filtered.sort(
    (a, b) =>
      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
  );
}

export async function getCompletedWorkoutSessions(
  uid: string,
  phase?: number,
): Promise<SessionLog[]> {
  const sessions = await getPhaseSessions(uid, phase);
  return sessions.filter((s) => s.kind === 'workout');
}

export function countPhase1Progress(sessions: SessionLog[]): number {
  return sessions.filter((s) => s.phase === 1 && s.kind === 'workout').length;
}
