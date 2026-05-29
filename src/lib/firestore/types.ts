import type { StreakState } from '../streak/streakEngine';

export type UserProfile = {
  programId: string;
  currentPhase: number;
  timezone: string;
};

export type SessionLog = {
  workoutId: string;
  workoutTitle: string;
  phase: number;
  startedAt: string;
  completedAt: string;
  durationSec: number;
  stepsCompleted: number;
  stepsSkipped: number;
  kind: 'workout' | 'rest';
  stravaActivityId?: number;
  stravaActivityName?: string;
};

export type UserDocument = {
  profile: UserProfile;
  streak: StreakState;
};
