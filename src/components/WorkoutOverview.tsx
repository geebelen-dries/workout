import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { ExerciseVisual } from './ExerciseVisual';
import type { WorkoutDefinition } from '../types/program';
import {
  buildWorkoutOverview,
  getOverviewStartLabel,
  type OverviewSection,
} from '../lib/program/workoutOverview';
import type { ExerciseCatalog } from '../types/program';
import { useThemedStyles } from '../hooks/useThemedStyles';
import type { ColorPalette } from '../theme/colors';

type Props = {
  workout: WorkoutDefinition;
  catalog: ExerciseCatalog;
  onStart: () => void;
};

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    scroll: { flex: 1 },
    content: { padding: 20, paddingBottom: 24 },
    phase: {
      color: colors.textMuted,
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 4,
    },
    title: {
      color: colors.text,
      fontSize: 28,
      fontWeight: '800',
      marginBottom: 6,
    },
    duration: {
      color: colors.accent,
      fontSize: 15,
      fontWeight: '600',
      marginBottom: 12,
    },
    notes: {
      color: colors.textMuted,
      lineHeight: 22,
      marginBottom: 20,
    },
    exercisesHeading: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 12,
    },
    section: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 4,
    },
    sectionSubtitle: {
      color: colors.textMuted,
      fontSize: 13,
      marginBottom: 12,
    },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    itemRowFirst: {
      borderTopWidth: 0,
      paddingTop: 0,
    },
    itemContent: {
      flex: 1,
    },
    itemMain: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      gap: 12,
    },
    itemName: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '600',
      flex: 1,
    },
    itemDetail: {
      color: colors.accent,
      fontSize: 14,
      fontWeight: '700',
    },
    itemCues: {
      color: colors.textMuted,
      fontSize: 13,
      marginTop: 4,
      lineHeight: 18,
    },
    footer: {
      padding: 20,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    startBtn: {
      backgroundColor: colors.accent,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    startBtnText: {
      color: colors.onAccent,
      fontSize: 17,
      fontWeight: '800',
    },
  });

function SectionBlock({
  section,
  styles,
}: {
  section: OverviewSection;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      {section.subtitle ? (
        <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>
      ) : null}
      {section.items.map((item, i) => (
        <View
          key={`${item.name}-${i}`}
          style={[styles.itemRow, i === 0 && styles.itemRowFirst]}
        >
          {item.exerciseId ? (
            <ExerciseVisual exerciseId={item.exerciseId} size={44} compact />
          ) : null}
          <View style={styles.itemContent}>
            <View style={styles.itemMain}>
              <Text style={styles.itemName}>{item.name}</Text>
              {item.detail ? (
                <Text style={styles.itemDetail}>{item.detail}</Text>
              ) : null}
            </View>
            {item.cues ? (
              <Text style={styles.itemCues}>{item.cues}</Text>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}

export function WorkoutOverview({ workout, catalog, onStart }: Props) {
  const styles = useThemedStyles(createStyles);
  const sections = buildWorkoutOverview(workout, catalog);
  const duration =
    workout.estimatedMinutes != null
      ? `${workout.estimatedMinutes[0]}–${workout.estimatedMinutes[1]} min`
      : null;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.phase}>Phase {workout.phase}</Text>
        <Text style={styles.title}>{workout.title}</Text>
        {duration ? <Text style={styles.duration}>{duration}</Text> : null}
        {workout.notes ? (
          <Text style={styles.notes}>{workout.notes}</Text>
        ) : null}

        <Text style={styles.exercisesHeading}>Exercises</Text>
        {sections.map((section, i) => (
          <SectionBlock key={`${section.title}-${i}`} section={section} styles={styles} />
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.startBtn} onPress={onStart}>
          <Text style={styles.startBtnText}>{getOverviewStartLabel(workout)}</Text>
        </Pressable>
      </View>
    </View>
  );
}
