import { format, isAfter, isBefore, parseISO, startOfDay } from 'date-fns';
import type { SessionLog } from '../firestore/types';

export type DayCompletionStatus = 'completed' | 'pending';

export function getSessionOnDate(
  sessions: SessionLog[],
  date: Date,
  workoutId: string,
): SessionLog | null {
  const dayKey = format(date, 'yyyy-MM-dd');
  return (
    sessions.find(
      (s) =>
        s.workoutId === workoutId &&
        format(parseISO(s.completedAt), 'yyyy-MM-dd') === dayKey,
    ) ?? null
  );
}

export function getDayCompletionStatus(
  session: SessionLog | null,
  isWorkoutDay: boolean,
  date: Date,
  now: Date = new Date(),
): DayCompletionStatus {
  if (session) return 'completed';

  const dayStart = startOfDay(date);
  const todayStart = startOfDay(now);

  // Rest / mobility days need no session — count as done once the day arrives
  if (!isWorkoutDay && !isAfter(dayStart, todayStart)) {
    return 'completed';
  }

  if (isBefore(todayStart, dayStart)) return 'pending';
  return 'pending';
}
