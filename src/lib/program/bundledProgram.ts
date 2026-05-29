import exercisesJson from '../../../programs/lean-athletic-12w/exercises.json';
import {
  buildPlayerSteps,
  enrichStepsWithExerciseNames,
  parseScheduleYaml,
  parseWorkoutMarkdown,
} from '../parser/workoutParser';
import type { ExerciseCatalog, WeeklySchedule, WorkoutDefinition } from '../../types/program';
import {
  mtbEnduranceMd,
  restMd,
  restMobilityMd,
  schedulePhase1Yaml,
  skippingConditioningMd,
  strengthFoundationMd,
} from './workoutContent';

const workoutSources: Record<string, string> = {
  'strength-foundation': strengthFoundationMd,
  'skipping-conditioning': skippingConditioningMd,
  'mtb-endurance': mtbEnduranceMd,
  'rest-mobility': restMobilityMd,
  rest: restMd,
};

export const exerciseCatalog = exercisesJson as ExerciseCatalog;

export const phase1Schedule: WeeklySchedule = parseScheduleYaml(schedulePhase1Yaml);

export function getWorkoutDefinition(workoutId: string): WorkoutDefinition | null {
  const source = workoutSources[workoutId];
  if (!source) return null;
  return parseWorkoutMarkdown(source);
}

export function getAllWorkoutIds(): string[] {
  return Object.keys(workoutSources);
}

const DAY_KEYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;

export function getWorkoutForDate(date: Date): {
  workoutId: string;
  workout: WorkoutDefinition;
} | null {
  const dayKey = DAY_KEYS[date.getDay()];
  const workoutId = phase1Schedule.days[dayKey];
  const workout = getWorkoutDefinition(workoutId);
  if (!workout) return null;
  return { workoutId, workout };
}

export function getWorkoutForToday(date = new Date()): {
  workoutId: string;
  workout: WorkoutDefinition;
} | null {
  return getWorkoutForDate(date);
}

export function getPlayerStepsForWorkout(workoutId: string) {
  const workout = getWorkoutDefinition(workoutId);
  if (!workout) return [];
  const steps = buildPlayerSteps(workout);
  return enrichStepsWithExerciseNames(steps, exerciseCatalog);
}

/** 3 workout types × 4 weeks in Phase 1 */
export const PHASE1_PLANNED_WORKOUT_COUNT = 12;

export function isWorkoutDay(workout: WorkoutDefinition): boolean {
  return workout.kind === 'workout';
}
