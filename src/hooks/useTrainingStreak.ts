import { useCallback, useEffect, useState } from 'react';
import { isPlannedWorkoutDay } from '../lib/streak/scheduleStreak';
import { computeTrainingStreak } from '../lib/streak/scheduleStreak';
import { createInitialStreak, type StreakState } from '../lib/streak/streakEngine';
import { getCompletedWorkoutSessions } from '../lib/firestore/sessionRepository';
import { format } from 'date-fns';

export function getStreakHint(streak: StreakState): string | null {
  if (streak.current === 0 && streak.longest > 0) {
    return 'Missed a planned workout — next session starts a new streak.';
  }
  const today = format(new Date(), 'yyyy-MM-dd');
  if (
    streak.current > 0 &&
    streak.lastWorkoutDate !== today &&
    isPlannedWorkoutDay(new Date())
  ) {
    return 'Workout on plan today — keep your streak going.';
  }
  return null;
}

export function useTrainingStreak(uid: string | null, refreshKey?: unknown) {
  const [streak, setStreak] = useState<StreakState>(createInitialStreak());

  const refresh = useCallback(async () => {
    if (!uid) {
      setStreak(createInitialStreak());
      return;
    }
    const sessions = await getCompletedWorkoutSessions(uid, 1);
    setStreak(computeTrainingStreak(sessions));
  }, [uid]);

  useEffect(() => {
    refresh();
  }, [refresh, refreshKey]);

  return { streak, hint: getStreakHint(streak), refresh };
}
