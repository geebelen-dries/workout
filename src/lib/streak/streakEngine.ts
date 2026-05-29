import type { SessionLog } from '../firestore/types';
import { computeTrainingStreak } from './scheduleStreak';

export type StreakState = {
  current: number;
  longest: number;
  lastWorkoutDate: string | null;
};

export function createInitialStreak(): StreakState {
  return { current: 0, longest: 0, lastWorkoutDate: null };
}

/**
 * Updates streak from session history after a completion.
 * Rest days on the plan do not break the streak; skipping a workout day does.
 */
export function updateStreakOnWorkoutComplete(
  _previous: StreakState,
  completedAt: Date,
  sessions: SessionLog[],
): StreakState {
  return computeTrainingStreak(sessions, completedAt);
}

export function getStreakMilestoneMessage(current: number): string | null {
  if ([3, 5, 7, 12].includes(current)) {
    return `${current} workouts in a row on plan — nice consistency.`;
  }
  return null;
}

export function formatStreakLabel(current: number): string {
  if (current === 0) {
    return 'No active streak';
  }
  if (current === 1) {
    return '1 workout on plan';
  }
  return `${current} workouts on plan`;
}
