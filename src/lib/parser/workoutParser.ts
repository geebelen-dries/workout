import yaml from 'js-yaml';
import type {
  DayKey,
  ExerciseCatalog,
  PlayerStep,
  RepTarget,
  WeeklySchedule,
  WorkoutBlock,
  WorkoutDefinition,
} from '../../types/program';

/** RN-safe frontmatter parse (gray-matter needs Node Buffer). */
function parseFrontmatter(content: string): {
  data: Record<string, unknown>;
  notes: string;
} {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    throw new Error('Invalid workout markdown: expected YAML frontmatter between --- markers');
  }
  const data = yaml.load(match[1]) as Record<string, unknown>;
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid workout markdown: empty frontmatter');
  }
  return { data, notes: (match[2] ?? '').trim() };
}

export function parseWorkoutMarkdown(content: string): WorkoutDefinition {
  const { data, notes } = parseFrontmatter(content);
  const blocks = (data.blocks ?? []) as WorkoutBlock[];

  return {
    id: String(data.id),
    title: String(data.title),
    phase: Number(data.phase),
    estimatedMinutes: data.estimatedMinutes as [number, number] | undefined,
    kind: (data.kind as 'workout' | 'rest') ?? 'workout',
    blocks,
    notes: notes.trim(),
  };
}

export function parseScheduleYaml(content: string): WeeklySchedule {
  const parsed = yaml.load(content) as WeeklySchedule;
  if (!parsed?.days) {
    throw new Error('Invalid schedule: missing days');
  }
  return parsed;
}

export function buildPlayerSteps(workout: WorkoutDefinition): PlayerStep[] {
  const steps: PlayerStep[] = [];

  workout.blocks.forEach((block, blockIndex) => {
    switch (block.type) {
      case 'note':
        steps.push({
          kind: 'note',
          title: block.title,
          body: block.body,
        });
        break;

      case 'rest_day':
        steps.push({
          kind: 'rest_day',
          title: workout.title,
          body: block.body,
          variant: block.variant,
        });
        break;

      case 'circuit':
        for (let round = 1; round <= block.rounds; round++) {
          block.items.forEach((item, itemIndex) => {
            const isDuration = item.durationSec != null;
            steps.push({
              kind: 'exercise',
              exerciseId: item.exerciseId,
              label: '',
              round,
              roundTotal: block.rounds,
              blockIndex,
              mode: isDuration ? 'duration' : 'reps',
              targetReps: item.reps,
              targetDurationSec: item.durationSec,
            });
            if (item.restAfterSec > 0) {
              steps.push({
                kind: 'rest',
                seconds: item.restAfterSec,
                label: 'Rest',
                round,
                roundTotal: block.rounds,
              });
            }
            if (
              itemIndex === block.items.length - 1 &&
              round < block.rounds &&
              block.restBetweenRoundsSec > 0
            ) {
              steps.push({
                kind: 'round_rest',
                seconds: block.restBetweenRoundsSec,
                round,
                roundTotal: block.rounds,
              });
            }
          });
        }
        break;

      case 'interval':
        for (let round = 1; round <= block.rounds; round++) {
          const exerciseId = block.items[0]?.exerciseId ?? 'interval';
          steps.push({
            kind: 'exercise',
            exerciseId,
            label: '',
            round,
            roundTotal: block.rounds,
            blockIndex,
            mode: 'interval_work',
            workSec: block.workSec,
          });
          if (block.restSec > 0 && round <= block.rounds) {
            steps.push({
              kind: 'rest',
              seconds: block.restSec,
              label: 'Rest',
              round,
              roundTotal: block.rounds,
            });
          }
        }
        break;

      case 'steady_cardio':
        steps.push({
          kind: 'cardio',
          exerciseId: block.exerciseId,
          label: '',
          durationMin: block.durationMin,
          durationMax: block.durationMax,
        });
        break;

      case 'strava_cardio':
        steps.push({
          kind: 'strava_cardio',
          exerciseId: block.exerciseId,
          label: '',
          stravaSport: block.stravaSport,
          durationMin: block.durationMin,
          durationMax: block.durationMax,
          minDurationMin: block.minDurationMin,
        });
        break;

      default:
        break;
    }
  });

  return steps;
}

export function formatRepTarget(reps?: RepTarget): string {
  if (reps == null) return '';
  if (typeof reps === 'number') return `${reps} reps`;
  return `${reps.min}–${reps.max} reps`;
}

export function getDayKey(date: Date): DayKey {
  const keys: DayKey[] = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];
  return keys[date.getDay()];
}

export function enrichStepsWithExerciseNames(
  steps: PlayerStep[],
  catalog: ExerciseCatalog,
): PlayerStep[] {
  return steps.map((step) => {
    if (
      step.kind === 'exercise' ||
      step.kind === 'cardio' ||
      step.kind === 'strava_cardio'
    ) {
      const name = catalog[step.exerciseId]?.name ?? step.exerciseId;
      return { ...step, label: name };
    }
    return step;
  });
}
