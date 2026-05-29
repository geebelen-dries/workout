import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useThemedStyles } from '../hooks/useThemedStyles';
import type { ColorPalette } from '../theme/colors';

type Props = {
  status: 'idle' | 'running' | 'paused' | 'completed';
  onPlay: () => void;
  onPause: () => void;
  onSkip: () => void;
  onComplete?: () => void;
};

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: 12,
      justifyContent: 'center',
      paddingVertical: 16,
    },
    btn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 14,
    },
    primary: {
      backgroundColor: colors.accent,
      flex: 1,
      justifyContent: 'center',
    },
    primaryLabel: {
      color: colors.onAccent,
      fontWeight: '700',
      fontSize: 16,
    },
    secondary: {
      backgroundColor: colors.surfaceAlt,
    },
    secondaryLabel: {
      color: colors.text,
      fontWeight: '600',
      fontSize: 14,
    },
  });

export function SessionControls({
  status,
  onPlay,
  onPause,
  onSkip,
  onComplete,
}: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const isRunning = status === 'running';
  const isPaused = status === 'paused';
  const isDone = status === 'completed';

  return (
    <View style={styles.row}>
      {!isDone && (
        <Pressable
          style={[styles.btn, styles.primary]}
          onPress={isRunning ? onPause : onPlay}
        >
          <Ionicons
            name={isRunning ? 'pause' : 'play'}
            size={28}
            color={colors.onAccent}
          />
          <Text style={styles.primaryLabel}>
            {status === 'idle' ? 'Start' : isPaused ? 'Resume' : 'Pause'}
          </Text>
        </Pressable>
      )}
      {!isDone && (
        <Pressable style={[styles.btn, styles.secondary]} onPress={onSkip}>
          <Ionicons name="play-skip-forward" size={24} color={colors.text} />
          <Text style={styles.secondaryLabel}>Skip</Text>
        </Pressable>
      )}
      {onComplete && !isDone && (
        <Pressable style={[styles.btn, styles.secondary]} onPress={onComplete}>
          <Ionicons name="checkmark-done" size={24} color={colors.accent} />
          <Text style={[styles.secondaryLabel, { color: colors.accent }]}>
            Done
          </Text>
        </Pressable>
      )}
    </View>
  );
}
