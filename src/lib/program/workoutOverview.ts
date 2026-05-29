import { formatRepTarget } from '../parser/workoutParser';
import type {
  ExerciseCatalog,
  RepTarget,
  WorkoutBlock,
  WorkoutDefinition,
} from '../../types/program';

export type OverviewItem = {
  exerciseId?: string;
  name: string;
  detail: string;
  cues?: string;
};

export type OverviewSection = {
  title: string;
  subtitle?: string;
  items: OverviewItem[];
};

function exerciseName(catalog: ExerciseCatalog, id: string): string {
  return catalog[id]?.name ?? id;
}

function exerciseCues(catalog: ExerciseCatalog, id: string): string | undefined {
  const cues = catalog[id]?.cues;
  return cues || undefined;
}

function repOrDuration(
  reps?: RepTarget,
  durationSec?: number,
): string {
  if (durationSec != null) return `${durationSec}s hold`;
  if (reps != null) return formatRepTarget(reps);
  return '';
}

function blockToSections(
  block: WorkoutBlock,
  catalog: ExerciseCatalog,
): OverviewSection[] {
  switch (block.type) {
    case 'note':
      return [
        {
          title: block.title,
          items: [{ name: block.body, detail: '' }],
        },
      ];

    case 'rest_day':
      return [
        {
          title: block.variant === 'mobility' ? 'Rest / Mobility' : 'Rest',
          items: [{ name: block.body, detail: '' }],
        },
      ];

    case 'circuit':
      return [
        {
          title: `Circuit · ${block.rounds} rounds`,
          subtitle:
            block.restBetweenRoundsSec > 0
              ? `${block.restBetweenRoundsSec}s rest between rounds`
              : undefined,
          items: block.items.map((item) => ({
            exerciseId: item.exerciseId,
            name: exerciseName(catalog, item.exerciseId),
            detail: repOrDuration(item.reps, item.durationSec),
            cues: exerciseCues(catalog, item.exerciseId),
          })),
        },
      ];

    case 'interval':
      return [
        {
          title: `Intervals · ${block.rounds} rounds`,
          subtitle: `${block.workSec}s work / ${block.restSec}s rest`,
          items: block.items.map((item) => ({
            exerciseId: item.exerciseId,
            name: exerciseName(catalog, item.exerciseId),
            detail: `${block.workSec}s each round`,
            cues: exerciseCues(catalog, item.exerciseId),
          })),
        },
      ];

    case 'steady_cardio':
      return [
        {
          title: 'Cardio',
          items: [
            {
              exerciseId: block.exerciseId,
              name: exerciseName(catalog, block.exerciseId),
              detail: `${block.durationMin}${block.durationMax ? `–${block.durationMax}` : ''} min`,
              cues: exerciseCues(catalog, block.exerciseId),
            },
          ],
        },
      ];

    case 'strava_cardio': {
      const sport = block.stravaSport === 'ride' ? 'Ride' : 'Run';
      const duration =
        block.durationMin != null
          ? `${block.durationMin}${block.durationMax ? `–${block.durationMax}` : ''} min target`
          : undefined;
      return [
        {
          title: `${sport} · Strava`,
          subtitle: 'Track in Strava, verify in app',
          items: [
            {
              exerciseId: block.exerciseId,
              name: exerciseName(catalog, block.exerciseId),
              detail: duration ?? 'Log activity in Strava',
              cues: exerciseCues(catalog, block.exerciseId),
            },
          ],
        },
      ];
    }

    default:
      return [];
  }
}

export function buildWorkoutOverview(
  workout: WorkoutDefinition,
  catalog: ExerciseCatalog,
): OverviewSection[] {
  return workout.blocks.flatMap((block) => blockToSections(block, catalog));
}

export function getOverviewStartLabel(workout: WorkoutDefinition): string {
  if (workout.kind === 'rest') return 'Continue';
  if (workout.blocks.some((b) => b.type === 'strava_cardio')) return 'Continue';
  return 'Start workout';
}
