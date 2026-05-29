import { addDays, addMinutes, setHours, setMinutes } from 'date-fns';
import type { DayKey, WeeklySchedule, WorkoutDefinition } from '../../types/program';
import { getGoogleCalendarEventsUrl, getGoogleCalendarId } from './calendarConfig';

export const WORKOUT_APP_CALENDAR_TAG = 'workoutApp';
export const WORKOUT_APP_CALENDAR_TAG_VALUE = '1';

const DAY_ORDER: DayKey[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

export type PlannedDay = {
  dayKey: DayKey;
  date: Date;
  workoutId: string;
  workout: WorkoutDefinition;
};

export type SyncWorkoutsResult = {
  created: number;
  skipped: number;
  failed: number;
  /** First API error body (truncated) */
  errorDetail?: string;
  /** True when token lacks write scope — user must reconnect */
  needsReconnect?: boolean;
};

type GoogleEventItem = {
  id: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  extendedProperties?: { private?: Record<string, string> };
};

function calendarEventsBaseUrl(): string {
  return getGoogleCalendarEventsUrl(getGoogleCalendarId());
}

function defaultDurationMinutes(workout: WorkoutDefinition): number {
  if (workout.estimatedMinutes) {
    const [min, max] = workout.estimatedMinutes;
    return Math.round((min + (max ?? min)) / 2);
  }
  return workout.kind === 'rest' ? 30 : 45;
}

function workoutStartTime(date: Date, hour = 7, minute = 0): Date {
  return setMinutes(setHours(date, hour), minute);
}

export function buildPlannedDays(
  schedule: WeeklySchedule,
  weekStart: Date,
  getWorkout: (id: string) => WorkoutDefinition | null,
): PlannedDay[] {
  return DAY_ORDER.map((dayKey, i) => {
    const workoutId = schedule.days[dayKey];
    const workout = getWorkout(workoutId);
    return {
      dayKey,
      date: addDays(weekStart, i),
      workoutId,
      workout: workout ?? {
        id: workoutId,
        title: workoutId,
        phase: schedule.phase,
        kind: 'rest',
        blocks: [],
        notes: '',
      },
    };
  });
}

export function buildEventBody(
  planned: PlannedDay,
  timezone: string,
): Record<string, unknown> {
  const durationMin = defaultDurationMinutes(planned.workout);
  const start = workoutStartTime(planned.date);
  const end = addMinutes(start, durationMin);
  const prefix = planned.workout.kind === 'rest' ? '🧘 ' : '💪 ';

  return {
    summary: `${prefix}${planned.workout.title}`,
    description: `Scheduled by Workout app · ${planned.workoutId}`,
    start: { dateTime: start.toISOString(), timeZone: timezone },
    end: { dateTime: end.toISOString(), timeZone: timezone },
    extendedProperties: {
      private: {
        [WORKOUT_APP_CALENDAR_TAG]: WORKOUT_APP_CALENDAR_TAG_VALUE,
        workoutId: planned.workoutId,
        dayKey: planned.dayKey,
      },
    },
  };
}

async function listWorkoutAppEvents(
  accessToken: string,
  weekStart: Date,
  weekEnd: Date,
): Promise<GoogleEventItem[]> {
  const url = new URL(calendarEventsBaseUrl());
  url.searchParams.set('timeMin', weekStart.toISOString());
  url.searchParams.set('timeMax', weekEnd.toISOString());
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('maxResults', '50');
  url.searchParams.set(
    'privateExtendedProperty',
    `${WORKOUT_APP_CALENDAR_TAG}=${WORKOUT_APP_CALENDAR_TAG_VALUE}`,
  );

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Calendar list failed: ${res.status} ${text}`);
  }

  const data = (await res.json()) as { items?: GoogleEventItem[] };
  return data.items ?? [];
}

function eventMatchesDay(
  event: GoogleEventItem,
  planned: PlannedDay,
): boolean {
  const workoutId = event.extendedProperties?.private?.workoutId;
  if (workoutId === planned.workoutId) return true;
  const startRaw = event.start?.dateTime ?? event.start?.date;
  if (!startRaw) return false;
  const eventDay = startRaw.slice(0, 10);
  const plannedDay = planned.date.toISOString().slice(0, 10);
  return eventDay === plannedDay;
}

export async function syncWeekWorkoutsToCalendar(
  accessToken: string,
  schedule: WeeklySchedule,
  weekStart: Date,
  weekEnd: Date,
  getWorkout: (id: string) => WorkoutDefinition | null,
  timezone: string,
): Promise<SyncWorkoutsResult> {
  const planned = buildPlannedDays(schedule, weekStart, getWorkout);
  const existing = await listWorkoutAppEvents(accessToken, weekStart, weekEnd);

  let created = 0;
  let skipped = 0;
  let failed = 0;
  let errorDetail: string | undefined;
  let needsReconnect = false;

  for (const day of planned) {
    if (existing.some((e) => eventMatchesDay(e, day))) {
      skipped += 1;
      continue;
    }

    const res = await fetch(calendarEventsBaseUrl(), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildEventBody(day, timezone)),
    });

    if (res.ok) {
      created += 1;
    } else {
      failed += 1;
      if (!errorDetail) {
        const text = await res.text();
        errorDetail = `HTTP ${res.status}: ${text.slice(0, 280)}`;
        needsReconnect = res.status === 401 || res.status === 403;
      }
    }
  }

  return { created, skipped, failed, errorDetail, needsReconnect };
}
