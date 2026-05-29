import { StyleSheet, Text, View } from 'react-native';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { formatStreakLabel } from '../lib/streak/streakEngine';
import type { ColorPalette } from '../theme/colors';

type Props = {
  current: number;
  longest: number;
  /** Shown when streak is 0 but user had a streak before */
  hint?: string | null;
};

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    emoji: { fontSize: 32 },
    current: { color: colors.text, fontSize: 18, fontWeight: '700' },
    longest: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
    hint: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  });

export function StreakBadge({ current, longest, hint }: Props) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.wrap}>
      <Text style={styles.emoji}>{current > 0 ? '🔥' : '💤'}</Text>
      <View>
        <Text style={styles.current}>{formatStreakLabel(current)}</Text>
        <Text style={styles.longest}>
          Best: {longest} workout{longest === 1 ? '' : 's'} on plan
        </Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
    </View>
  );
}
