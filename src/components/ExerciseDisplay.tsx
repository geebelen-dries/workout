import { StyleSheet, Text, View } from 'react-native';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { exerciseCatalog } from '../lib/program/bundledProgram';
import type { ColorPalette } from '../theme/colors';
import { ExerciseVisual } from './ExerciseVisual';
import { formatRepTarget } from '../lib/parser/workoutParser';
import type { PlayerStep } from '../types/program';

type Props = {
  step: PlayerStep;
  secondsRemaining: number;
  roundLabel?: string;
};

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 28,
      marginHorizontal: 20,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: 220,
      justifyContent: 'center',
    },
    restCard: {
      borderColor: colors.rest,
    },
    label: {
      color: colors.textMuted,
      fontSize: 13,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 8,
    },
    title: {
      color: colors.text,
      fontSize: 28,
      fontWeight: '700',
      marginBottom: 12,
    },
    reps: {
      color: colors.accent,
      fontSize: 36,
      fontWeight: '800',
      marginBottom: 8,
    },
    timer: {
      color: colors.accent,
      fontSize: 56,
      fontWeight: '800',
      fontVariant: ['tabular-nums'],
    },
    body: {
      color: colors.textMuted,
      fontSize: 16,
      lineHeight: 24,
    },
    cues: {
      color: colors.textMuted,
      fontSize: 15,
      marginTop: 16,
      lineHeight: 22,
    },
    hint: {
      color: colors.textMuted,
      fontSize: 14,
      marginTop: 8,
    },
    muted: {
      color: colors.textMuted,
      fontSize: 14,
      marginBottom: 8,
    },
    restLabel: {
      color: colors.rest,
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 12,
    },
  });

export function ExerciseDisplay({ step, secondsRemaining, roundLabel }: Props) {
  const styles = useThemedStyles(createStyles);

  if (step.kind === 'note' || step.kind === 'rest_day') {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>{step.kind === 'note' ? step.title : step.title}</Text>
        <Text style={styles.body}>{step.body}</Text>
      </View>
    );
  }

  if (step.kind === 'rest' || step.kind === 'round_rest') {
    return (
      <View style={[styles.card, styles.restCard]}>
        <Text style={styles.restLabel}>
          {step.kind === 'round_rest' ? 'Round rest' : step.label}
        </Text>
        <Text style={styles.timer}>{secondsRemaining}s</Text>
        {roundLabel ? (
          <Text style={styles.muted}>{roundLabel}</Text>
        ) : null}
      </View>
    );
  }

  if (step.kind === 'strava_cardio') {
    return null;
  }

  if (step.kind === 'cardio') {
    const cues = exerciseCatalog[step.exerciseId]?.cues;
    const mins = Math.floor(secondsRemaining / 60);
    const secs = secondsRemaining % 60;
    return (
      <View style={styles.card}>
        <ExerciseVisual exerciseId={step.exerciseId} />
        <Text style={styles.label}>Cardio</Text>
        <Text style={styles.title}>{step.label}</Text>
        <Text style={styles.timer}>
          {mins}:{secs.toString().padStart(2, '0')}
        </Text>
        <Text style={styles.muted}>
          Target {step.durationMin}
          {step.durationMax ? `–${step.durationMax}` : ''} min
        </Text>
        {cues ? <Text style={styles.cues}>{cues}</Text> : null}
      </View>
    );
  }

  if (step.kind !== 'exercise') {
    return null;
  }

  const cues = exerciseCatalog[step.exerciseId]?.cues;
  const repText =
    step.mode === 'reps' && step.targetReps
      ? formatRepTarget(step.targetReps)
      : step.mode === 'duration'
        ? `${step.targetDurationSec}s hold`
        : step.mode === 'interval_work'
          ? `${step.workSec}s work`
          : '';

  return (
    <View style={styles.card}>
      <ExerciseVisual exerciseId={step.exerciseId} />
      {roundLabel ? <Text style={styles.muted}>{roundLabel}</Text> : null}
      <Text style={styles.title}>{step.label}</Text>
      {repText ? <Text style={styles.reps}>{repText}</Text> : null}
      {(step.mode === 'duration' || step.mode === 'interval_work') && (
        <Text style={styles.timer}>{secondsRemaining}s</Text>
      )}
      {step.mode === 'reps' && (
        <Text style={styles.hint}>Tap Done when set is complete</Text>
      )}
      {cues ? <Text style={styles.cues}>{cues}</Text> : null}
    </View>
  );
}
