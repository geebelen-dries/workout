import { buildEventBody, buildPlannedDays } from '../syncWorkoutsToCalendar';
import type { WeeklySchedule, WorkoutDefinition } from '../../../types/program';

const schedule: WeeklySchedule = {
  phase: 1,
  programId: 'lean-athletic-12w',
  days: {
    monday: 'strength-foundation',
    tuesday: 'rest-mobility',
    wednesday: 'skipping-conditioning',
    thursday: 'rest',
    friday: 'strength-foundation',
    saturday: 'mtb-endurance',
    sunday: 'rest',
  },
};

const workouts: Record<string, WorkoutDefinition> = {
  'strength-foundation': {
    id: 'strength-foundation',
    title: 'Strength Foundation',
    phase: 1,
    kind: 'workout',
    estimatedMinutes: [30, 40],
    blocks: [],
    notes: '',
  },
  rest: {
    id: 'rest',
    title: 'Rest',
    phase: 1,
    kind: 'rest',
    blocks: [],
    notes: '',
  },
};

describe('syncWorkoutsToCalendar helpers', () => {
  const weekStart = new Date('2026-05-25T12:00:00.000Z');

  it('builds seven planned days from schedule', () => {
    const days = buildPlannedDays(schedule, weekStart, (id) => workouts[id] ?? null);
    expect(days).toHaveLength(7);
    expect(days[0].workoutId).toBe('strength-foundation');
    expect(days[3].workoutId).toBe('rest');
  });

  it('tags calendar events for idempotent sync', () => {
    const planned = buildPlannedDays(schedule, weekStart, (id) => workouts[id] ?? null);
    const body = buildEventBody(planned[0], 'Europe/Brussels');
    expect(body.summary).toBe('💪 Strength Foundation');
    expect(
      (body.extendedProperties as { private: Record<string, string> }).private
        .workoutId,
    ).toBe('strength-foundation');
  });
});
