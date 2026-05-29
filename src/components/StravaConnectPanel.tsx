import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useStravaConnection } from '../hooks/useStravaConnection';
import { useThemedStyles } from '../hooks/useThemedStyles';
import type { ColorPalette } from '../theme/colors';

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    textBlock: { flex: 1 },
    label: { color: colors.text, fontSize: 16, fontWeight: '600' },
    hint: { color: colors.textMuted, fontSize: 13, marginTop: 4, lineHeight: 18 },
    statusOk: { color: colors.accent, fontWeight: '600' },
    statusWarn: { color: colors.warning, fontWeight: '600' },
    btn: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: colors.accent,
      minWidth: 100,
      alignItems: 'center',
    },
    btnOutline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.border,
    },
    btnText: { color: colors.onAccent, fontWeight: '700', fontSize: 14 },
    btnTextMuted: { color: colors.text, fontWeight: '600', fontSize: 14 },
    error: { color: colors.warning, fontSize: 12, marginTop: 8 },
    disconnect: {
      color: colors.textMuted,
      fontSize: 13,
      marginTop: 10,
      fontWeight: '600',
    },
  });

export function StravaConnectPanel() {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const { connected, linking, error, connect, disconnect, configured } =
    useStravaConnection();

  return (
    <View>
      <View style={styles.row}>
        <View style={styles.textBlock}>
          <Text style={styles.label}>Strava</Text>
          <Text style={styles.hint}>
            {configured
              ? connected
                ? 'Connected — MTB rides verify on workout day'
                : 'For Saturday MTB: connect before your ride'
              : 'Add client ID + secret in .env (see docs/STRAVA.md)'}
          </Text>
          {configured ? (
            <Text
              style={connected ? styles.statusOk : styles.statusWarn}
            >
              {connected ? 'Connected' : 'Not connected'}
            </Text>
          ) : null}
        </View>
        <Pressable
          style={[styles.btn, connected && styles.btnOutline]}
          onPress={connected ? disconnect : connect}
          disabled={linking || !configured}
        >
          {linking ? (
            <ActivityIndicator color={connected ? colors.text : colors.onAccent} />
          ) : (
            <Text
              style={connected ? styles.btnTextMuted : styles.btnText}
            >
              {connected ? 'Disconnect' : 'Connect'}
            </Text>
          )}
        </Pressable>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}
