import { create } from 'zustand';
import type { PlayerStep } from '../types/program';

export type SessionStatus = 'idle' | 'running' | 'paused' | 'completed';

type SessionState = {
  workoutId: string | null;
  workoutTitle: string;
  phase: number;
  kind: 'workout' | 'rest';
  steps: PlayerStep[];
  stepIndex: number;
  status: SessionStatus;
  startedAt: number | null;
  secondsRemaining: number;
  stepsCompleted: number;
  stepsSkipped: number;
  initSession: (params: {
    workoutId: string;
    workoutTitle: string;
    phase: number;
    kind: 'workout' | 'rest';
    steps: PlayerStep[];
  }) => void;
  setStepIndex: (index: number) => void;
  setSecondsRemaining: (seconds: number) => void;
  play: () => void;
  pause: () => void;
  skipStep: () => void;
  completeStep: () => void;
  completeSession: () => void;
  reset: () => void;
};

const initialState = {
  workoutId: null as string | null,
  workoutTitle: '',
  phase: 1,
  kind: 'workout' as const,
  steps: [] as PlayerStep[],
  stepIndex: 0,
  status: 'idle' as SessionStatus,
  startedAt: null as number | null,
  secondsRemaining: 0,
  stepsCompleted: 0,
  stepsSkipped: 0,
};

export const useSessionStore = create<SessionState>((set, get) => ({
  ...initialState,

  initSession: ({ workoutId, workoutTitle, phase, kind, steps }) => {
    set({
      ...initialState,
      workoutId,
      workoutTitle,
      phase,
      kind,
      steps,
      stepIndex: 0,
      status: 'idle',
      startedAt: Date.now(),
      secondsRemaining: getInitialSeconds(steps[0]),
    });
  },

  setStepIndex: (index) => {
    const { steps } = get();
    set({
      stepIndex: index,
      secondsRemaining: getInitialSeconds(steps[index]),
    });
  },

  setSecondsRemaining: (seconds) => set({ secondsRemaining: seconds }),

  play: () => set({ status: 'running' }),

  pause: () => set({ status: 'paused' }),

  skipStep: () => {
    const { stepIndex, steps, stepsSkipped } = get();
    if (stepIndex >= steps.length - 1) {
      set({ status: 'completed', stepsSkipped: stepsSkipped + 1 });
      return;
    }
    const next = stepIndex + 1;
    set({
      stepIndex: next,
      stepsSkipped: stepsSkipped + 1,
      secondsRemaining: getInitialSeconds(steps[next]),
      status: 'running',
    });
  },

  completeStep: () => {
    const { stepIndex, steps, stepsCompleted } = get();
    if (stepIndex >= steps.length - 1) {
      set({
        status: 'completed',
        stepsCompleted: stepsCompleted + 1,
      });
      return;
    }
    const next = stepIndex + 1;
    set({
      stepIndex: next,
      stepsCompleted: stepsCompleted + 1,
      secondsRemaining: getInitialSeconds(steps[next]),
      status: 'running',
    });
  },

  completeSession: () => set({ status: 'completed' }),

  reset: () => set(initialState),
}));

function getInitialSeconds(step: PlayerStep | undefined): number {
  if (!step) return 0;
  if (step.kind === 'rest' || step.kind === 'round_rest') return step.seconds;
  if (step.kind === 'exercise') {
    if (step.mode === 'duration' && step.targetDurationSec) {
      return step.targetDurationSec;
    }
    if (step.mode === 'interval_work' && step.workSec) return step.workSec;
    return 0;
  }
  if (step.kind === 'cardio') return step.durationMin * 60;
  return 0;
}
