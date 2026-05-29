import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ExerciseDisplay } from '../../src/components/ExerciseDisplay';
import { SessionControls } from '../../src/components/SessionControls';
import { StravaWorkoutSession } from '../../src/components/StravaWorkoutSession';
import { WorkoutOverview } from '../../src/components/WorkoutOverview';
import { useAuth } from '../../src/context/AuthContext';
import { useSessionTimer } from '../../src/hooks/useSessionTimer';
import { useThemedStyles } from '../../src/hooks/useThemedStyles';
import { completeWorkoutSession } from '../../src/lib/firestore/completeSession';
import type { SessionLog } from '../../src/lib/firestore/types';
import {
  exerciseCatalog,
  getPlayerStepsForWorkout,
  getWorkoutDefinition,
} from '../../src/lib/program/bundledProgram';
import {
  getStravaStepFromWorkout,
  workoutUsesStrava,
} from '../../src/lib/program/workoutUtils';
import type { StravaActivitySummary } from '../../src/lib/strava/stravaApi';
import {
  formatStreakLabel,
  getStreakMilestoneMessage,
} from '../../src/lib/streak/streakEngine';
import { useSessionStore } from '../../src/stores/sessionStore';
import type { ColorPalette } from '../../src/theme/colors';

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { paddingBottom: 40 },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.bg,
    },
    error: { color: colors.danger },
    header: { padding: 20, paddingBottom: 8 },
    workoutTitle: { color: colors.text, fontSize: 22, fontWeight: '800' },
    progress: { color: colors.textMuted, marginTop: 4 },
    notes: {
      color: colors.textMuted,
      paddingHorizontal: 24,
      lineHeight: 22,
      marginTop: 8,
    },
    footer: { marginTop: 'auto', paddingBottom: 24 },
    doneBtn: {
      backgroundColor: colors.accent,
      marginHorizontal: 20,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 8,
    },
    doneBtnText: { color: colors.onAccent, fontWeight: '700', fontSize: 16 },
    finishEarly: {
      color: colors.textMuted,
      textAlign: 'center',
      padding: 12,
      fontSize: 14,
    },
  });

export default function SessionScreen() {
  const { workoutId } = useLocalSearchParams<{ workoutId: string }>();
  const router = useRouter();
  const { uid } = useAuth();
  const styles = useThemedStyles(createStyles);
  const [hasStarted, setHasStarted] = useState(false);
  const [stravaStartedAt, setStravaStartedAt] = useState<number | null>(null);

  const workout = useMemo(
    () => (workoutId ? getWorkoutDefinition(workoutId) : null),
    [workoutId],
  );

  const stravaStep = useMemo(() => {
    if (!workout) return null;
    const step = getStravaStepFromWorkout(workout);
    if (!step) return null;
    const name = exerciseCatalog[step.exerciseId]?.name ?? step.exerciseId;
    return { ...step, label: name };
  }, [workout]);

  const initSession = useSessionStore((s) => s.initSession);
  const status = useSessionStore((s) => s.status);
  const stepIndex = useSessionStore((s) => s.stepIndex);
  const steps = useSessionStore((s) => s.steps);
  const startedAt = useSessionStore((s) => s.startedAt);
  const stepsCompleted = useSessionStore((s) => s.stepsCompleted);
  const stepsSkipped = useSessionStore((s) => s.stepsSkipped);
  const play = useSessionStore((s) => s.play);
  const pause = useSessionStore((s) => s.pause);
  const skipStep = useSessionStore((s) => s.skipStep);
  const completeStep = useSessionStore((s) => s.completeStep);
  const completeSession = useSessionStore((s) => s.completeSession);
  const reset = useSessionStore((s) => s.reset);

  const { currentStep, secondsRemaining, needsTimer } = useSessionTimer();

  const isStrava = workout && workoutUsesStrava(workout);

  const beginSession = useCallback(() => {
    if (!workout || !workoutId) return;

    if (isStrava) {
      setStravaStartedAt(Date.now());
      setHasStarted(true);
      return;
    }

    const playerSteps = getPlayerStepsForWorkout(workoutId);
    initSession({
      workoutId,
      workoutTitle: workout.title,
      phase: workout.phase,
      kind: workout.kind,
      steps: playerSteps,
    });
    setHasStarted(true);
  }, [workout, workoutId, isStrava, initSession]);

  if (!workout || !workoutId) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Workout not found</Text>
      </View>
    );
  }

  if (!hasStarted) {
    return (
      <WorkoutOverview
        workout={workout}
        catalog={exerciseCatalog}
        onStart={beginSession}
      />
    );
  }

  const finishSession = async (
    extra: Partial<SessionLog> = {},
    started: number = startedAt ?? stravaStartedAt ?? Date.now(),
  ) => {
    if (!uid) return;
    completeSession();
    const completedAt = new Date();
    const session: SessionLog = {
      workoutId,
      workoutTitle: workout.title,
      phase: workout.phase,
      startedAt: new Date(started).toISOString(),
      completedAt: completedAt.toISOString(),
      durationSec: Math.round((completedAt.getTime() - started) / 1000),
      stepsCompleted: isStrava ? 1 : stepsCompleted,
      stepsSkipped: isStrava ? 0 : stepsSkipped,
      kind: workout.kind,
      ...extra,
    };

    const result = await completeWorkoutSession(uid, session);
    const milestone = getStreakMilestoneMessage(result.streakCurrent);

    reset();
    Alert.alert(
      'Session complete',
      milestone ??
        (workout.kind === 'workout'
          ? `${formatStreakLabel(result.streakCurrent)}. Phase 1: ${result.phase1Completed}/12 workouts.`
          : 'Recovery logged.'),
      [{ text: 'OK', onPress: () => router.back() }],
    );
  };

  const onStravaComplete = (activity: StravaActivitySummary) => {
    finishSession(
      {
        stravaActivityId: activity.id,
        stravaActivityName: activity.name,
        durationSec: activity.moving_time,
      },
      stravaStartedAt ?? Date.now(),
    );
  };

  if (isStrava && stravaStep) {
    return (
      <StravaWorkoutSession
        workout={workout}
        step={stravaStep}
        onComplete={onStravaComplete}
      />
    );
  }

  const roundLabel =
    currentStep &&
    (currentStep.kind === 'exercise' ||
      currentStep.kind === 'rest' ||
      currentStep.kind === 'round_rest') &&
    'round' in currentStep
      ? `Round ${currentStep.round}/${currentStep.roundTotal}`
      : undefined;

  const progress =
    steps.length > 0 ? `${stepIndex + 1} / ${steps.length}` : '';

  const onFinish = async () => {
    if (!startedAt) return;
    await finishSession();
  };

  const isRestOnly =
    workout.kind === 'rest' && steps.every((s) => s.kind === 'rest_day');

  if (isRestOnly && status !== 'completed') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <ExerciseDisplay
          step={
            steps[0] ?? {
              kind: 'rest_day',
              title: workout.title,
              body: workout.notes,
              variant: 'full',
            }
          }
          secondsRemaining={0}
        />
        <Text style={styles.notes}>{workout.notes}</Text>
        <Pressable style={styles.doneBtn} onPress={onFinish}>
          <Text style={styles.doneBtnText}>Mark day complete</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.workoutTitle}>{workout.title}</Text>
        <Text style={styles.progress}>{progress}</Text>
      </View>

      {currentStep ? (
        <ExerciseDisplay
          step={currentStep}
          secondsRemaining={secondsRemaining}
          roundLabel={roundLabel}
        />
      ) : null}

      <View style={styles.footer}>
        {currentStep?.kind === 'exercise' &&
          currentStep.mode === 'reps' &&
          status === 'running' && (
            <Pressable style={styles.doneBtn} onPress={completeStep}>
              <Text style={styles.doneBtnText}>Set complete</Text>
            </Pressable>
          )}

        <SessionControls
          status={status}
          onPlay={play}
          onPause={pause}
          onSkip={skipStep}
          onComplete={
            status === 'completed' ||
            (stepIndex >= steps.length - 1 && !needsTimer)
              ? onFinish
              : undefined
          }
        />

        {status !== 'idle' && status !== 'completed' && (
          <Pressable onPress={onFinish}>
            <Text style={styles.finishEarly}>Finish workout early</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
