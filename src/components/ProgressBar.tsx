import { StyleSheet, Text, View } from 'react-native';
import { useThemedStyles } from '../hooks/useThemedStyles';
import type { ColorPalette } from '../theme/colors';

type Props = {
  label: string;
  current: number;
  total: number;
};

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    wrap: { marginVertical: 8 },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    label: { color: colors.textMuted, fontSize: 13 },
    value: { color: colors.text, fontSize: 13, fontWeight: '600' },
    track: {
      height: 8,
      backgroundColor: colors.surfaceAlt,
      borderRadius: 4,
      overflow: 'hidden',
    },
    fill: {
      height: '100%',
      backgroundColor: colors.accent,
      borderRadius: 4,
    },
  });

export function ProgressBar({ label, current, total }: Props) {
  const styles = useThemedStyles(createStyles);
  const pct = total > 0 ? Math.min(100, (current / total) * 100) : 0;
  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>
          {current}/{total}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>
    </View>
  );
}
