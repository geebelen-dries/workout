import type { SessionLog } from '../../firestore/types';
import {
  computeTrainingStreak,
  hasMissedPlannedWorkoutBetween,
  isPlannedWorkoutDay,
} from '../scheduleStreak';
import {
  createInitialStreak,
  updateStreakOnWorkoutComplete,
} from '../streakEngine';

function workoutSession(completedAt: string): SessionLog {
  return {
    workoutId: 'strength-foundation',
    workoutTitle: 'Strength',
    phase: 1,
    startedAt: completedAt,
    completedAt,
    durationSec: 1800,
    stepsCompleted: 1,
    stepsSkipped: 0,
    kind: 'workout',
  };
}

describe('isPlannedWorkoutDay', () => {
  it('treats Tuesday as rest not workout', () => {
    expect(isPlannedWorkoutDay(new Date('2026-05-19T12:00:00'))).toBe(false);
  });

  it('treats Monday as workout', () => {
    expect(isPlannedWorkoutDay(new Date('2026-05-18T12:00:00'))).toBe(true);
  });
});

describe('training streak', () => {
  it('starts at zero', () => {
    expect(createInitialStreak()).toEqual({
      current: 0,
      longest: 0,
      lastWorkoutDate: null,
    });
  });

  it('counts Mon then Wed across rest days', () => {
    const sessions = [
      workoutSession('2026-05-18T10:00:00'),
      workoutSession('2026-05-20T10:00:00'),
    ];
    const streak = computeTrainingStreak(
      sessions,
      new Date('2026-05-20T18:00:00'),
    );
    expect(streak.current).toBe(2);
    expect(streak.longest).toBe(2);
  });

  it('does not require completion on rest days between workouts', () => {
    const completed = new Set(['2026-05-18', '2026-05-20']);
    expect(
      hasMissedPlannedWorkoutBetween('2026-05-18', '2026-05-20', completed),
    ).toBe(false);
  });

  it('resets when a scheduled workout day was skipped', () => {
    const sessions = [workoutSession('2026-05-18T10:00:00')];
    const streak = computeTrainingStreak(
      sessions,
      new Date('2026-05-22T10:00:00'),
    );
    expect(streak.current).toBe(0);
    expect(streak.longest).toBe(1);
  });

  it('keeps streak active when today’s workout is still ahead', () => {
    const sessions = [
      workoutSession('2026-05-18T10:00:00'),
      workoutSession('2026-05-20T10:00:00'),
    ];
    const streak = computeTrainingStreak(
      sessions,
      new Date('2026-05-22T12:00:00'),
    );
    expect(streak.current).toBe(2);
  });

  it('increments on back-to-back workout days', () => {
    const sessions = [
      workoutSession('2026-05-18T10:00:00'),
      workoutSession('2026-05-20T10:00:00'),
      workoutSession('2026-05-22T10:00:00'),
    ];
    const streak = computeTrainingStreak(
      sessions,
      new Date('2026-05-22T18:00:00'),
    );
    expect(streak.current).toBe(3);
  });

  it('does not double-count same day', () => {
    const d = '2026-05-18T10:00:00';
    const sessions = [workoutSession(d), workoutSession('2026-05-18T20:00:00')];
    const s1 = updateStreakOnWorkoutComplete(
      createInitialStreak(),
      new Date(d),
      [sessions[0]],
    );
    const s2 = updateStreakOnWorkoutComplete(s1, new Date(d), sessions);
    expect(s2.current).toBe(1);
  });
});
