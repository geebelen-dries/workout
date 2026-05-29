import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useThemedStyles } from '../hooks/useThemedStyles';
import type { ColorPalette } from '../theme/colors';

type Props = {
  workoutTitle: string;
  durationSec: number;
  stepsCompleted: number;
  stepsSkipped: number;
  streakLabel?: string;
  phaseProgress?: string;
  saving?: boolean;
  onDone: () => void;
};

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 28,
    },
    iconRing: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.accentDim,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 28,
      borderWidth: 3,
      borderColor: colors.accent,
    },
    title: {
      color: colors.text,
      fontSize: 32,
      fontWeight: '800',
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 17,
      textAlign: 'center',
      lineHeight: 26,
      marginBottom: 32,
    },
    statsRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 28,
      width: '100%',
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    statValue: {
      color: colors.accent,
      fontSize: 22,
      fontWeight: '800',
      marginTop: 6,
    },
    statLabel: {
      color: colors.textMuted,
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    streak: {
      color: colors.accent,
      fontSize: 15,
      fontWeight: '600',
      marginBottom: 24,
      textAlign: 'center',
    },
    doneBtn: {
      backgroundColor: colors.accent,
      paddingVertical: 18,
      paddingHorizontal: 32,
      borderRadius: 16,
      width: '100%',
      alignItems: 'center',
    },
    doneBtnDisabled: { opacity: 0.6 },
    doneBtnText: {
      color: colors.onAccent,
      fontWeight: '800',
      fontSize: 18,
    },
  });

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m} min`;
  return `${m}m ${s}s`;
}

export function WorkoutCompleteScreen({
  workoutTitle,
  durationSec,
  stepsCompleted,
  stepsSkipped,
  streakLabel,
  phaseProgress,
  saving,
  onDone,
}: Props) {
  const styles = useThemedStyles(createStyles);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.iconRing}>
        <Ionicons name="checkmark-circle" size={72} color={styles.iconRing.borderColor} />
      </View>

      <Text style={styles.title}>Workout complete!</Text>
      <Text style={styles.subtitle}>
        {workoutTitle} — great work. You showed up and finished strong.
      </Text>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons name="time-outline" size={22} color={styles.statValue.color} />
          <Text style={styles.statValue}>{formatDuration(durationSec)}</Text>
          <Text style={styles.statLabel}>Duration</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="fitness-outline" size={22} color={styles.statValue.color} />
          <Text style={styles.statValue}>{stepsCompleted}</Text>
          <Text style={styles.statLabel}>Steps done</Text>
        </View>
        {stepsSkipped > 0 ? (
          <View style={styles.statCard}>
            <Ionicons
              name="play-skip-forward-outline"
              size={22}
              color={styles.statValue.color}
            />
            <Text style={styles.statValue}>{stepsSkipped}</Text>
            <Text style={styles.statLabel}>Skipped</Text>
          </View>
        ) : null}
      </View>

      {streakLabel ? (
        <Text style={styles.streak}>
          {streakLabel}
          {phaseProgress ? ` · ${phaseProgress}` : ''}
        </Text>
      ) : null}

      <Pressable
        style={[styles.doneBtn, saving && styles.doneBtnDisabled]}
        onPress={onDone}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color={styles.doneBtnText.color} />
        ) : (
          <Text style={styles.doneBtnText}>Back to week</Text>
        )}
      </Pressable>
    </View>
  );
}
