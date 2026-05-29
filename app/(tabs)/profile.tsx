import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { ProgressBar } from '../../src/components/ProgressBar';
import { StravaConnectPanel } from '../../src/components/StravaConnectPanel';
import { StreakBadge } from '../../src/components/StreakBadge';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { isFirebaseConfigured } from '../../src/config/firebase';
import { useTrainingStreak } from '../../src/hooks/useTrainingStreak';
import { useUserData } from '../../src/hooks/useUserData';
import { useThemedStyles } from '../../src/hooks/useThemedStyles';
import { PHASE1_PLANNED_WORKOUT_COUNT } from '../../src/lib/program/bundledProgram';
import { getStreakMilestoneMessage } from '../../src/lib/streak/streakEngine';
import type { ColorPalette } from '../../src/theme/colors';
import {
  countPhase1Progress,
  getCompletedWorkoutSessions,
} from '../../src/lib/firestore/sessionRepository';

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
      padding: 20,
      gap: 16,
    },
    title: { color: colors.text, fontSize: 28, fontWeight: '800' },
    sectionTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '700',
      marginTop: 4,
    },
    milestone: {
      backgroundColor: colors.surfaceAlt,
      padding: 12,
      borderRadius: 10,
    },
    milestoneText: { color: colors.accent, fontWeight: '600' },
    card: {
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 4,
    },
    prefRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 4,
    },
    prefText: { flex: 1, paddingRight: 12 },
    prefLabel: { color: colors.text, fontSize: 16, fontWeight: '600' },
    prefHint: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
    label: { color: colors.textMuted, fontSize: 12, marginTop: 8 },
    value: { color: colors.text, fontSize: 16, fontWeight: '600' },
    tipsTitle: {
      color: colors.text,
      fontWeight: '700',
      marginTop: 8,
    },
    tip: { color: colors.textMuted, lineHeight: 22 },
    logout: {
      marginTop: 'auto',
      padding: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
    },
    logoutText: { color: colors.danger, fontWeight: '600' },
  });

export default function ProfileScreen() {
  const { logOut, uid, isDemoMode } = useAuth();
  const { userData } = useUserData();
  const { streak, hint: streakHint } = useTrainingStreak(uid, userData.streak.lastWorkoutDate);
  const router = useRouter();
  const { mode, toggleLightMode } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [phase1Done, setPhase1Done] = useState(0);

  useEffect(() => {
    if (!uid) return;
    getCompletedWorkoutSessions(uid, 1).then((s) =>
      setPhase1Done(countPhase1Progress(s)),
    );
  }, [uid, userData.streak.lastWorkoutDate]);

  const milestone = getStreakMilestoneMessage(streak.current);

  const onLogout = async () => {
    await logOut();
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>

      <StreakBadge
        current={streak.current}
        longest={streak.longest}
        hint={streakHint}
      />

      {milestone ? (
        <View style={styles.milestone}>
          <Text style={styles.milestoneText}>{milestone}</Text>
        </View>
      ) : null}

      <ProgressBar
        label="Phase 1 progress"
        current={phase1Done}
        total={PHASE1_PLANNED_WORKOUT_COUNT}
      />

      <Text style={styles.sectionTitle}>Integrations</Text>
      <View style={styles.card}>
        <StravaConnectPanel />
      </View>

      <Text style={styles.sectionTitle}>Preferences</Text>
      <View style={styles.card}>
        <View style={styles.prefRow}>
          <View style={styles.prefText}>
            <Text style={styles.prefLabel}>Light mode</Text>
            <Text style={styles.prefHint}>
              {mode === 'light' ? 'Light theme active' : 'Dark theme active'}
            </Text>
          </View>
          <Switch
            value={mode === 'light'}
            onValueChange={toggleLightMode}
            trackColor={{ false: undefined, true: undefined }}
            accessibilityLabel="Toggle light mode"
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Program</Text>
        <Text style={styles.value}>{userData.profile.programId}</Text>
        <Text style={styles.label}>Phase</Text>
        <Text style={styles.value}>{userData.profile.currentPhase}</Text>
        <Text style={styles.label}>Sync</Text>
        <Text style={styles.value}>
          {isFirebaseConfigured
            ? isDemoMode
              ? 'Demo (local)'
              : 'Firebase cloud'
            : 'Local only — add Firebase keys'}
        </Text>
      </View>

      <Text style={styles.tipsTitle}>Progression tips</Text>
      <Text style={styles.tip}>
        • Reduce rest by 15s when workouts feel easy
      </Text>
      <Text style={styles.tip}>
        • Slow eccentrics (3s down) before heavier kettlebell
      </Text>

      <Pressable style={styles.logout} onPress={onLogout}>
        <Text style={styles.logoutText}>Sign out</Text>
      </Pressable>
    </View>
  );
}
