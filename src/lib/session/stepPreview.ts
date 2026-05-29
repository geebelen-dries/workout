import type { ExerciseCatalog, PlayerStep } from '../../types/program';
import { formatRepTarget } from '../parser/workoutParser';

export function getNextStep(
  steps: PlayerStep[],
  stepIndex: number,
): PlayerStep | null {
  if (stepIndex >= steps.length - 1) return null;
  return steps[stepIndex + 1] ?? null;
}

/** Next step that is not a rest (for prep hints during rest). */
export function getNextExerciseStep(
  steps: PlayerStep[],
  stepIndex: number,
): PlayerStep | null {
  for (let i = stepIndex + 1; i < steps.length; i++) {
    const step = steps[i];
    if (
      step.kind === 'exercise' ||
      step.kind === 'cardio' ||
      step.kind === 'note'
    ) {
      return step;
    }
  }
  return null;
}

export function formatStepPreview(
  step: PlayerStep,
  catalog: ExerciseCatalog,
): string {
  if (step.kind === 'note') return step.title;
  if (step.kind === 'rest' || step.kind === 'round_rest') {
    const mins = Math.floor(step.seconds / 60);
    const secs = step.seconds % 60;
    if (mins > 0 && secs > 0) return `${mins}:${secs.toString().padStart(2, '0')} rest`;
    if (mins > 0) return `${mins} min rest`;
    return `${step.seconds}s rest`;
  }
  if (step.kind === 'cardio') {
    const name = catalog[step.exerciseId]?.name ?? step.label;
    return `${name} · ${step.durationMin} min`;
  }
  if (step.kind !== 'exercise') return '';

  const name = catalog[step.exerciseId]?.name ?? step.label;
  if (step.mode === 'reps' && step.targetReps) {
    return `${name} · ${formatRepTarget(step.targetReps)}`;
  }
  if (step.mode === 'duration' && step.targetDurationSec) {
    return `${name} · ${step.targetDurationSec}s hold`;
  }
  if (step.mode === 'interval_work' && step.workSec) {
    return `${name} · ${step.workSec}s work`;
  }
  return name;
}
