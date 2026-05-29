import type { PlayerStep, StravaCardioBlock, WorkoutDefinition } from '../../types/program';

export function workoutUsesStrava(workout: WorkoutDefinition): boolean {
  return workout.blocks.some((b) => b.type === 'strava_cardio');
}

export function getStravaStepFromWorkout(
  workout: WorkoutDefinition,
): (PlayerStep & { kind: 'strava_cardio' }) | null {
  const block = workout.blocks.find(
    (b): b is StravaCardioBlock => b.type === 'strava_cardio',
  );
  if (!block) return null;
  return {
    kind: 'strava_cardio',
    exerciseId: block.exerciseId,
    label: '',
    stravaSport: block.stravaSport,
    durationMin: block.durationMin,
    durationMax: block.durationMax,
    minDurationMin: block.minDurationMin,
  };
}
