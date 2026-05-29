import { isFirebaseConfigured } from '../../config/firebase';
import {
  appendLocalSession,
  loadLocalUser,
  saveLocalUser,
} from '../storage/localStore';
import { computeTrainingStreak } from '../streak/scheduleStreak';
import {
  countPhase1Progress,
  getCompletedWorkoutSessions,
  saveSession,
} from './sessionRepository';
import type { SessionLog } from './types';
import { ensureUserDocument, updateUserStreak } from './userRepository';

export async function completeWorkoutSession(
  uid: string,
  session: SessionLog,
): Promise<{ streakCurrent: number; phase1Completed: number }> {
  await saveSession(uid, session);

  if (!isFirebaseConfigured) {
    await appendLocalSession(session);
    const user = await loadLocalUser();
    const sessions = await import('../storage/localStore').then((m) =>
      m.loadLocalSessions(),
    );
    const nextStreak = computeTrainingStreak(
      sessions,
      new Date(session.completedAt),
    );
    await saveLocalUser({ ...user, streak: nextStreak });
    return {
      streakCurrent: nextStreak.current,
      phase1Completed: countPhase1Progress(sessions),
    };
  }

  await ensureUserDocument(uid);
  const sessions = await getCompletedWorkoutSessions(uid, 1);
  const allWorkoutSessions =
    session.kind === 'workout'
      ? [
          session,
          ...sessions.filter((s) => s.completedAt !== session.completedAt),
        ]
      : sessions;
  const nextStreak = computeTrainingStreak(
    allWorkoutSessions,
    new Date(session.completedAt),
  );
  await updateUserStreak(uid, nextStreak);

  return {
    streakCurrent: nextStreak.current,
    phase1Completed: countPhase1Progress(sessions),
  };
}
