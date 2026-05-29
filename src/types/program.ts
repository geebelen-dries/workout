export type DayKey =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export type RepTarget = number | { min: number; max: number };

export type CircuitItem = {
  exerciseId: string;
  reps?: RepTarget;
  durationSec?: number;
  restAfterSec: number;
};

export type CircuitBlock = {
  type: 'circuit';
  rounds: number;
  restBetweenRoundsSec: number;
  items: CircuitItem[];
};

export type IntervalBlock = {
  type: 'interval';
  rounds: number;
  workSec: number;
  restSec: number;
  items: { exerciseId: string }[];
};

export type SteadyCardioBlock = {
  type: 'steady_cardio';
  exerciseId: string;
  durationMin: number;
  durationMax?: number;
};

/** Outdoor cardio tracked in Strava — no in-app timer */
export type StravaCardioBlock = {
  type: 'strava_cardio';
  exerciseId: string;
  stravaSport: 'ride' | 'run';
  durationMin?: number;
  durationMax?: number;
  minDurationMin?: number;
};

export type RestDayBlock = {
  type: 'rest_day';
  variant: 'full' | 'mobility';
  body: string;
};

export type NoteBlock = {
  type: 'note';
  title: string;
  body: string;
};

export type WorkoutBlock =
  | CircuitBlock
  | IntervalBlock
  | SteadyCardioBlock
  | StravaCardioBlock
  | RestDayBlock
  | NoteBlock;

export type WorkoutDefinition = {
  id: string;
  title: string;
  phase: number;
  estimatedMinutes?: [number, number];
  kind: 'workout' | 'rest';
  blocks: WorkoutBlock[];
  notes: string;
};

export type ExerciseCatalogEntry = {
  name: string;
  cues: string;
  /** exercises-dataset id — https://github.com/hasaneyldrm/exercises-dataset */
  datasetId?: string;
  mediaUrl: string | null;
  gifUrl?: string | null;
};

export type ExerciseCatalog = Record<string, ExerciseCatalogEntry>;

export type WeeklySchedule = {
  phase: number;
  programId: string;
  days: Record<DayKey, string>;
};

export type PlayerStep =
  | { kind: 'note'; title: string; body: string }
  | { kind: 'rest_day'; title: string; body: string; variant: string }
  | {
      kind: 'exercise';
      exerciseId: string;
      label: string;
      round: number;
      roundTotal: number;
      blockIndex: number;
      mode: 'reps' | 'duration' | 'interval_work' | 'interval_rest' | 'cardio';
      targetReps?: RepTarget;
      targetDurationSec?: number;
      workSec?: number;
      restSec?: number;
    }
  | {
      kind: 'rest';
      seconds: number;
      label: string;
      round: number;
      roundTotal: number;
    }
  | {
      kind: 'round_rest';
      seconds: number;
      round: number;
      roundTotal: number;
    }
  | {
      kind: 'cardio';
      exerciseId: string;
      label: string;
      durationMin: number;
      durationMax?: number;
    }
  | {
      kind: 'strava_cardio';
      exerciseId: string;
      label: string;
      stravaSport: 'ride' | 'run';
      durationMin?: number;
      durationMax?: number;
      minDurationMin?: number;
    };
