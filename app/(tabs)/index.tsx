import { useRouter } from 'expo-router';
import {
  addDays,
  endOfWeek,
  format,
  isSameDay,
  startOfWeek,
} from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  getWorkoutDefinition,
  getWorkoutForToday,
  isWorkoutDay,
  phase1Schedule,
  PHASE1_PLANNED_WORKOUT_COUNT,
} from '../../src/lib/program/bundledProgram';
import type { DayKey } from '../../src/types/program';
import type { ColorPalette } from '../../src/theme/colors';
import { GoogleCalendarAuth } from '../../src/components/GoogleCalendarAuth';
import { ProgressBar } from '../../src/components/ProgressBar';
import { StreakBadge } from '../../src/components/StreakBadge';
import { useTrainingStreak } from '../../src/hooks/useTrainingStreak';
import { useUserData } from '../../src/hooks/useUserData';
import { useThemedStyles } from '../../src/hooks/useThemedStyles';
import { useTheme } from '../../src/context/ThemeContext';
import type * as AuthSession from 'expo-auth-session';
import {
  fetchWeekCalendarEvents,
  getGoogleCalendarId,
  getGoogleOAuthSetupHint,
  isGoogleCalendarConfigured,
  type CalendarEvent,
} from '../../src/lib/calendar/googleCalendar';
import {
  clearCalendarToken,
  loadCalendarToken,
  saveCalendarToken,
} from '../../src/lib/calendar/calendarTokenStore';
import { syncWeekWorkoutsToCalendar } from '../../src/lib/calendar/syncWorkoutsToCalendar';
import {
  countPhase1Progress,
  getPhaseSessions,
} from '../../src/lib/firestore/sessionRepository';
import { useAuth } from '../../src/context/AuthContext';
import type { SessionLog } from '../../src/lib/firestore/types';
import {
  getDayCompletionStatus,
  getSessionOnDate,
} from '../../src/lib/program/weekCompletion';

const DAY_ORDER: DayKey[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

const DAY_LABELS: Record<DayKey, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 20, paddingBottom: 40, gap: 16 },
    phase: {
      color: colors.textMuted,
      fontSize: 13,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    todayCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.accent,
    },
    todayLabel: { color: colors.accent, fontSize: 12, fontWeight: '700' },
    todayTitle: {
      color: colors.text,
      fontSize: 22,
      fontWeight: '800',
      marginTop: 4,
    },
    todayMeta: { color: colors.textMuted, marginTop: 4 },
    startCta: {
      color: colors.accent,
      fontWeight: '700',
      marginTop: 12,
      fontSize: 16,
    },
    calHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginTop: 8,
      gap: 12,
    },
    calActions: { alignItems: 'flex-end', gap: 8 },
    sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
    calSource: {
      color: colors.textMuted,
      fontSize: 11,
      marginTop: 2,
      maxWidth: 220,
    },
    calStatus: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
    link: { color: colors.accent, fontSize: 14, fontWeight: '600' },
    linkMuted: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
    dayRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    dayRowToday: { borderColor: colors.accentDim },
    dayRowDone: {
      borderColor: colors.accent,
      backgroundColor: colors.surfaceAlt,
    },
    dayLeft: { width: 52 },
    dayName: { color: colors.text, fontWeight: '700' },
    dayDate: { color: colors.textMuted, fontSize: 12 },
    dayCenter: { flex: 1 },
    workoutName: { color: colors.text, fontWeight: '600' },
    eventHint: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
    chevron: { color: colors.textMuted, fontSize: 22 },
    statusCol: { alignItems: 'flex-end', minWidth: 72, gap: 4 },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    statusDone: { backgroundColor: colors.accentDim },
    statusDoneText: { color: colors.accent, fontSize: 12, fontWeight: '700' },
    todayDone: { color: colors.accent, fontWeight: '700', marginTop: 12, fontSize: 16 },
  });

export default function WeekScreen() {
  const router = useRouter();
  const { uid } = useAuth();
  const { userData } = useUserData();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const today = getWorkoutForToday();
  const [phase1Done, setPhase1Done] = useState(0);
  const [phaseSessions, setPhaseSessions] = useState<SessionLog[]>([]);
  const { streak, hint: streakHint, refresh: refreshStreak } = useTrainingStreak(
    uid,
    phase1Done,
  );
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [calLoading, setCalLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [calendarOAuth, setCalendarOAuth] = useState<{
    request: AuthSession.AuthRequest | null;
    promptAsync: (
      options?: AuthSession.AuthRequestPromptOptions,
    ) => Promise<AuthSession.AuthSessionResult>;
  } | null>(null);
  const savedTokenRef = useRef<string | null>(null);

  const weekKey = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const { weekStart, weekEnd } = useMemo(
    () => ({
      weekStart: startOfWeek(new Date(), { weekStartsOn: 1 }),
      weekEnd: endOfWeek(new Date(), { weekStartsOn: 1 }),
    }),
    [weekKey],
  );

  const loadSessions = useCallback(async () => {
    if (!uid) return;
    const sessions = await getPhaseSessions(uid, 1);
    setPhaseSessions(sessions);
    setPhase1Done(countPhase1Progress(sessions));
  }, [uid]);

  const loadCalendar = useCallback(async () => {
    const token = await loadCalendarToken();
    setCalendarConnected(Boolean(token));
    if (!token) {
      setCalendarEvents([]);
      return;
    }
    setCalLoading(true);
    try {
      const events = await fetchWeekCalendarEvents(token, weekStart, weekEnd);
      setCalendarEvents(events);
    } catch {
      setCalendarEvents([]);
    } finally {
      setCalLoading(false);
    }
  }, [weekStart, weekEnd]);

  useEffect(() => {
    loadCalendar();
  }, [loadCalendar]);

  useFocusEffect(
    useCallback(() => {
      loadSessions();
      refreshStreak();
    }, [loadSessions, refreshStreak]),
  );

  const onCalendarToken = useCallback(
    async (token: string) => {
      if (savedTokenRef.current === token) return;
      savedTokenRef.current = token;
      await saveCalendarToken(token);
      setCalendarConnected(true);
      await loadCalendar();
    },
    [loadCalendar],
  );

  const onSyncToCalendar = useCallback(async () => {
    const token = await loadCalendarToken();
    if (!token) {
      Alert.alert('Connect Google Calendar', 'Sign in first to sync your schedule.');
      return;
    }
    setSyncing(true);
    try {
      const result = await syncWeekWorkoutsToCalendar(
        token,
        phase1Schedule,
        weekStart,
        weekEnd,
        getWorkoutDefinition,
        userData.profile.timezone,
      );
      await loadCalendar();
      if (result.failed > 0) {
        const hint = result.needsReconnect
          ? '\n\nTap Reconnect (clears old read-only token), sign in again, then Sync schedule.\n\nAlso check Google Cloud → Data access → scope "Google Calendar API" (full access, not read-only).'
          : '';
        Alert.alert(
          'Sync incomplete',
          `Created ${result.created}. ${result.skipped} already on calendar. ${result.failed} failed.` +
            (result.errorDetail ? `\n\n${result.errorDetail}` : '') +
            hint,
        );
      } else {
        Alert.alert(
          'Schedule synced',
          `Created ${result.created} events. ${result.skipped} already on calendar.`,
        );
      }
    } catch (e) {
      Alert.alert(
        'Sync failed',
        String(e) +
          '\n\nReconnect calendar after adding the full Calendar scope in Google Cloud → Data access.',
      );
    } finally {
      setSyncing(false);
    }
  }, [weekStart, weekEnd, loadCalendar, userData.profile.timezone]);

  const weekDays = useMemo(() => {
    const now = new Date();
    return DAY_ORDER.map((dayKey, i) => {
      const date = addDays(weekStart, i);
      const workoutId = phase1Schedule.days[dayKey];
      const workout = getWorkoutDefinition(workoutId);
      const dayEvents = calendarEvents.filter((e) =>
        isSameDay(e.start, date),
      );
      const session = workout
        ? getSessionOnDate(phaseSessions, date, workoutId)
        : null;
      const plannedWorkout = workout ? isWorkoutDay(workout) : false;
      const completionStatus = workout
        ? getDayCompletionStatus(session, plannedWorkout, date, now)
        : 'pending';
      return {
        dayKey,
        date,
        workoutId,
        workout,
        events: dayEvents,
        isToday: isSameDay(date, now),
        session,
        completionStatus,
      };
    });
  }, [weekStart, calendarEvents, phaseSessions]);

  const todaySession = useMemo(() => {
    if (!today) return null;
    return getSessionOnDate(phaseSessions, new Date(), today.workoutId);
  }, [today, phaseSessions]);

  const todayIsComplete = useMemo(() => {
    if (!today) return false;
    return (
      getDayCompletionStatus(
        todaySession,
        isWorkoutDay(today.workout),
        new Date(),
        new Date(),
      ) === 'completed'
    );
  }, [today, todaySession]);

  const onConnectCalendar = async () => {
    if (!isGoogleCalendarConfigured()) {
      Alert.alert('Google Calendar setup', getGoogleOAuthSetupHint());
      return;
    }
    const reconnecting = calendarConnected;
    Alert.alert(
      reconnecting ? 'Reconnect Google Calendar' : 'Connect Google Calendar',
      (reconnecting
        ? 'This clears your saved token so Google can grant write access (required to create events).\n\n'
        : '') +
        getGoogleOAuthSetupHint() +
        '\n\nAfter connecting, tap Sync schedule.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: async () => {
            await clearCalendarToken();
            savedTokenRef.current = null;
            setCalendarConnected(false);
            setCalendarEvents([]);
            await calendarOAuth?.promptAsync();
          },
        },
      ],
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadSessions(), loadCalendar(), refreshStreak()]);
    setRefreshing(false);
  };

  const calBusy = calLoading || syncing;

  return (
    <>
      {isGoogleCalendarConfigured() ? (
        <GoogleCalendarAuth
          onReady={setCalendarOAuth}
          onToken={onCalendarToken}
        />
      ) : null}
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
      >
        <Text style={styles.phase}>Phase 1 — Foundation & Form</Text>

        <StreakBadge
          current={streak.current}
          longest={streak.longest}
          hint={streakHint}
        />

        <ProgressBar
          label="Phase 1 workouts"
          current={phase1Done}
          total={PHASE1_PLANNED_WORKOUT_COUNT}
        />

        {today && (
          <Pressable
            style={styles.todayCard}
            onPress={() => router.push(`/session/${today.workoutId}`)}
          >
            <Text style={styles.todayLabel}>Today</Text>
            <Text style={styles.todayTitle}>{today.workout.title}</Text>
            {today.workout.estimatedMinutes && (
              <Text style={styles.todayMeta}>
                {today.workout.estimatedMinutes[0]}–
                {today.workout.estimatedMinutes[1]} min
              </Text>
            )}
            {todayIsComplete ? (
              <Text style={styles.todayDone}>
                {isWorkoutDay(today.workout)
                  ? 'Completed today ✓'
                  : 'Rest day — nothing required ✓'}
              </Text>
            ) : (
              <Text style={styles.startCta}>
                {isWorkoutDay(today.workout) ? 'Start workout →' : 'View day →'}
              </Text>
            )}
          </Pressable>
        )}

        <View style={styles.calHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>This week</Text>
            {isGoogleCalendarConfigured() ? (
              <Text style={styles.calSource} numberOfLines={1}>
                Calendar: {getGoogleCalendarId()}
              </Text>
            ) : null}
            {calendarConnected ? (
              <Text style={styles.calStatus}>Google Calendar connected</Text>
            ) : null}
          </View>
          <View style={styles.calActions}>
            {calendarConnected ? (
              <Pressable onPress={onSyncToCalendar} disabled={calBusy}>
                <Text style={styles.link}>
                  {syncing ? 'Syncing…' : 'Sync schedule'}
                </Text>
              </Pressable>
            ) : null}
            <Pressable onPress={onConnectCalendar} disabled={calBusy}>
              <Text style={calendarConnected ? styles.linkMuted : styles.link}>
                {calendarConnected ? 'Reconnect' : 'Connect calendar'}
              </Text>
            </Pressable>
          </View>
        </View>
        {calBusy ? (
          <ActivityIndicator color={colors.accent} style={{ marginBottom: 8 }} />
        ) : null}

        {weekDays.map(
          ({
            dayKey,
            date,
            workoutId,
            workout,
            events,
            isToday,
            completionStatus,
          }) => (
            <Pressable
              key={dayKey}
              style={[
                styles.dayRow,
                isToday && styles.dayRowToday,
                completionStatus === 'completed' && styles.dayRowDone,
              ]}
              onPress={() => router.push(`/session/${workoutId}`)}
            >
              <View style={styles.dayLeft}>
                <Text style={styles.dayName}>{DAY_LABELS[dayKey]}</Text>
                <Text style={styles.dayDate}>{format(date, 'd MMM')}</Text>
              </View>
              <View style={styles.dayCenter}>
                <Text style={styles.workoutName}>
                  {workout?.title ?? workoutId}
                </Text>
                {events.length > 0 && (
                  <Text style={styles.eventHint} numberOfLines={1}>
                    📅 {events.map((e) => e.title).join(', ')}
                  </Text>
                )}
              </View>
              <View style={styles.statusCol}>
                {completionStatus === 'completed' ? (
                  <View style={styles.statusBadge}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={colors.accent}
                    />
                    <Text style={styles.statusDoneText}>Done</Text>
                  </View>
                ) : null}
                <Text style={styles.chevron}>›</Text>
              </View>
            </Pressable>
          ),
        )}
      </ScrollView>
    </>
  );
}
