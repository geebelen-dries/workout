import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useEffect, useRef } from 'react';
import { useSessionStore } from '../stores/sessionStore';
import type { PlayerStep } from '../types/program';

function stepNeedsTimer(step: PlayerStep | undefined): boolean {
  if (!step) return false;
  if (step.kind === 'rest' || step.kind === 'round_rest') return true;
  if (step.kind === 'cardio') return true;
  if (step.kind === 'exercise') {
    return (
      step.mode === 'duration' ||
      step.mode === 'interval_work' ||
      (step.targetDurationSec != null && step.targetDurationSec > 0)
    );
  }
  return false;
}

export function useSessionTimer() {
  const status = useSessionStore((s) => s.status);
  const stepIndex = useSessionStore((s) => s.stepIndex);
  const steps = useSessionStore((s) => s.steps);
  const secondsRemaining = useSessionStore((s) => s.secondsRemaining);
  const setSecondsRemaining = useSessionStore((s) => s.setSecondsRemaining);
  const completeStep = useSessionStore((s) => s.completeStep);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentStep = steps[stepIndex];

  useEffect(() => {
    if (status === 'running' || status === 'paused') {
      activateKeepAwakeAsync('workout-session');
    } else {
      deactivateKeepAwake('workout-session');
    }
    return () => {
      deactivateKeepAwake('workout-session');
    };
  }, [status]);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (status !== 'running' || !stepNeedsTimer(currentStep)) {
      return;
    }

    intervalRef.current = setInterval(() => {
      const remaining = useSessionStore.getState().secondsRemaining;
      if (remaining <= 1) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        completeStep();
        return;
      }
      setSecondsRemaining(remaining - 1);
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [
    status,
    stepIndex,
    currentStep,
    setSecondsRemaining,
    completeStep,
  ]);

  return { currentStep, secondsRemaining, needsTimer: stepNeedsTimer(currentStep) };
}
