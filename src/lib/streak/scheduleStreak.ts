import {
  addDays,
  differenceInCalendarDays,
  format,
  parseISO,
  startOfDay,
} from 'date-fns';
import {
  getWorkoutDefinition,
  isWorkoutDay,
  phase1Schedule,
} from '../program/bundledProgram';
import type { DayKey } from '../../types/program';
import type { SessionLog } from '../firestore/types';
import type { StreakState } from './streakEngine';
import { createInitialStreak } from './streakEngine';

const DAY_KEYS: DayKey[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

export function getWorkoutIdForDate(date: Date): string | null {
  const dayKey = DAY_KEYS[date.getDay()];
  return phase1Schedule.days[dayKey] ?? null;
}

/** True when the program schedules a real training session (not rest / mobility day). */
export function isPlannedWorkoutDay(date: Date): boolean {
  const workoutId = getWorkoutIdForDate(date);
  if (!workoutId) return false;
  const workout = getWorkoutDefinition(workoutId);
  return workout != null && isWorkoutDay(workout);
}

export function getCompletedWorkoutDateSet(sessions: SessionLog[]): Set<string> {
  const dates = new Set<string>();
  for (const s of sessions) {
    if (s.kind !== 'workout') continue;
    dates.add(format(parseISO(s.completedAt), 'yyyy-MM-dd'));
  }
  return dates;
}

function sortedWorkoutDates(sessions: SessionLog[]): string[] {
  return [...getCompletedWorkoutDateSet(sessions)].sort();
}

/** Any scheduled workout day strictly between two completion dates that was not logged. */
export function hasMissedPlannedWorkoutBetween(
  earlierDate: string,
  laterDate: string,
  completedDates: Set<string>,
): boolean {
  let day = addDays(parseISO(earlierDate), 1);
  const end = startOfDay(parseISO(laterDate));

  while (day < end) {
    const key = format(day, 'yyyy-MM-dd');
    if (isPlannedWorkoutDay(day) && !completedDates.has(key)) {
      return true;
    }
    day = addDays(day, 1);
  }
  return false;
}

/**
 * Scheduled workout days after last completion that are already in the past
 * (before today) without a log. Today’s workout does not break an active streak.
 */
export function hasMissedPlannedWorkoutSince(
  lastCompletionDate: string,
  asOf: Date,
  completedDates: Set<string>,
): boolean {
  const todayStart = startOfDay(asOf);
  let day = addDays(parseISO(lastCompletionDate), 1);
  const end = addDays(todayStart, -1);

  if (day > end) return false;

  while (day <= end) {
    const key = format(day, 'yyyy-MM-dd');
    if (isPlannedWorkoutDay(day) && !completedDates.has(key)) {
      return true;
    }
    day = addDays(day, 1);
  }
  return false;
}

function chainLengthEndingAt(
  endDate: string,
  sortedDates: string[],
  completedDates: Set<string>,
): number {
  const idx = sortedDates.indexOf(endDate);
  if (idx < 0) return 0;

  let chain = 1;
  for (let i = idx - 1; i >= 0; i--) {
    const prev = sortedDates[i];
    if (hasMissedPlannedWorkoutBetween(prev, endDate, completedDates)) {
      break;
    }
    chain += 1;
    endDate = prev;
  }
  return chain;
}

/**
 * Training streak: consecutive planned workouts completed; rest days never break it.
 * Resets when a scheduled workout day passes without a completed session.
 */
export function computeTrainingStreak(
  sessions: SessionLog[],
  asOf: Date = new Date(),
): StreakState {
  const completedDates = getCompletedWorkoutDateSet(sessions);
  const sorted = sortedWorkoutDates(sessions);

  if (sorted.length === 0) {
    return createInitialStreak();
  }

  const last = sorted[sorted.length - 1];
  let longest = 0;
  for (const date of sorted) {
    longest = Math.max(longest, chainLengthEndingAt(date, sorted, completedDates));
  }

  const chainAtLast = chainLengthEndingAt(last, sorted, completedDates);
  const current = hasMissedPlannedWorkoutSince(last, asOf, completedDates)
    ? 0
    : chainAtLast;

  return {
    current,
    longest,
    lastWorkoutDate: last,
  };
}

/** Days since last completed workout (for gentle nudges). */
export function daysSinceLastWorkout(
  streak: StreakState,
  asOf: Date = new Date(),
): number | null {
  if (!streak.lastWorkoutDate) return null;
  return differenceInCalendarDays(asOf, parseISO(streak.lastWorkoutDate));
}
