import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { exerciseCatalog } from '../lib/program/bundledProgram';
import { useStravaConnection } from '../hooks/useStravaConnection';
import {
  checkStravaActivityForToday,
  formatStravaActivity,
  type StravaActivitySummary,
} from '../lib/strava/stravaApi';
import type { PlayerStep, WorkoutDefinition } from '../types/program';
import type { ColorPalette } from '../theme/colors';
import { ExerciseVisual } from './ExerciseVisual';

type Props = {
  workout: WorkoutDefinition;
  step: PlayerStep & { kind: 'strava_cardio' };
  onComplete: (activity: StravaActivitySummary) => void;
};

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 20, paddingBottom: 40 },
    title: {
      color: colors.text,
      fontSize: 26,
      fontWeight: '800',
      textAlign: 'center',
    },
    hint: {
      color: colors.accent,
      textAlign: 'center',
      marginTop: 8,
      fontWeight: '600',
    },
    cues: {
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: 12,
      lineHeight: 22,
    },
    notes: {
      color: colors.textMuted,
      marginTop: 16,
      lineHeight: 22,
    },
    card: {
      marginTop: 24,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12,
    },
    cardTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
    cardBody: { color: colors.textMuted, lineHeight: 22 },
    connected: { color: colors.accent, fontSize: 13, fontWeight: '600' },
    primaryBtn: {
      backgroundColor: colors.accent,
      padding: 14,
      borderRadius: 12,
      alignItems: 'center',
    },
    primaryBtnText: { color: colors.onAccent, fontWeight: '700', fontSize: 16 },
    matchBox: {
      backgroundColor: colors.surfaceAlt,
      padding: 12,
      borderRadius: 10,
    },
    matchLabel: { color: colors.textMuted, fontSize: 12 },
    matchText: { color: colors.text, fontWeight: '600', marginTop: 4 },
    error: { color: colors.warning, lineHeight: 20 },
    link: {
      color: colors.rest,
      textAlign: 'center',
      fontWeight: '600',
    },
    completeBtn: {
      marginTop: 20,
      backgroundColor: colors.accent,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    completeBtnDisabled: { opacity: 0.4 },
    completeBtnText: { color: colors.onAccent, fontWeight: '800', fontSize: 17 },
    disconnect: {
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: 16,
      fontSize: 13,
    },
  });

export function StravaWorkoutSession({ workout, step, onComplete }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [checking, setChecking] = useState(false);
  const [activity, setActivity] = useState<StravaActivitySummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runCheck = useCallback(async () => {
    setChecking(true);
    setError(null);
    const result = await checkStravaActivityForToday({
      sport: step.stravaSport,
      minDurationMin: step.minDurationMin,
    });
    setActivity(result.activity);
    if (result.error) setError(result.error);
    if (!result.connected) {
      setError(null);
    } else if (!result.activity) {
      setError(
        `No ${step.stravaSport === 'ride' ? 'ride' : 'run'} found on Strava for today` +
          (step.minDurationMin
            ? ` (min ${step.minDurationMin} min moving time).`
            : '. Log it in Strava, then check again.'),
      );
    }
    setChecking(false);
  }, [step.stravaSport, step.minDurationMin]);

  const { connected, connect, disconnect, error: connectError } =
    useStravaConnection(runCheck);

  const cues = exerciseCatalog[step.exerciseId]?.cues;
  const durationHint =
    step.durationMin != null
      ? `${step.durationMin}${step.durationMax ? `–${step.durationMax}` : ''} min target`
      : null;

  const sportLabel = step.stravaSport === 'ride' ? 'Ride' : 'Run';
  const displayError = connectError ?? error;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ExerciseVisual exerciseId={step.exerciseId} />
      <Text style={styles.title}>{step.label || workout.title}</Text>
      {durationHint ? (
        <Text style={styles.hint}>{durationHint} — track in Strava</Text>
      ) : (
        <Text style={styles.hint}>Track this workout in Strava</Text>
      )}
      {cues ? <Text style={styles.cues}>{cues}</Text> : null}
      {workout.notes ? <Text style={styles.notes}>{workout.notes}</Text> : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Complete via Strava</Text>
        <Text style={styles.cardBody}>
          Start your {sportLabel.toLowerCase()} in Strava. When you are done,
          come back here and verify today's activity.
        </Text>

        {!connected ? (
          <Pressable style={styles.primaryBtn} onPress={connect}>
            <Text style={styles.primaryBtnText}>Connect Strava</Text>
          </Pressable>
        ) : (
          <>
            <Text style={styles.connected}>Strava connected</Text>
            <Pressable
              style={styles.primaryBtn}
              onPress={runCheck}
              disabled={checking}
            >
              {checking ? (
                <ActivityIndicator color={colors.onAccent} />
              ) : (
                <Text style={styles.primaryBtnText}>Check Strava</Text>
              )}
            </Pressable>
          </>
        )}

        {activity ? (
          <View style={styles.matchBox}>
            <Text style={styles.matchLabel}>Found today</Text>
            <Text style={styles.matchText}>{formatStravaActivity(activity)}</Text>
          </View>
        ) : null}

        {displayError ? <Text style={styles.error}>{displayError}</Text> : null}

        <Pressable
          onPress={() =>
            Linking.openURL('https://www.strava.com/upload/manual')
          }
        >
          <Text style={styles.link}>Open Strava</Text>
        </Pressable>
      </View>

      <Pressable
        style={[styles.completeBtn, !activity && styles.completeBtnDisabled]}
        onPress={() => activity && onComplete(activity)}
        disabled={!activity}
      >
        <Text style={styles.completeBtnText}>Complete workout</Text>
      </Pressable>

      {connected && (
        <Pressable
          onPress={async () => {
            await disconnect();
            setActivity(null);
          }}
        >
          <Text style={styles.disconnect}>Disconnect Strava</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}
