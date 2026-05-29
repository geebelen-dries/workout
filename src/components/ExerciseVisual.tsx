import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { exerciseCatalog } from '../lib/program/bundledProgram';
import type { ExerciseCatalogEntry } from '../types/program';
import type { ColorPalette } from '../theme/colors';

const ICON_BY_EXERCISE: Record<string, keyof typeof Ionicons.glyphMap> = {
  'kb-deadlift': 'barbell-outline',
  'incline-pushup': 'body-outline',
  'kb-goblet-squat': 'fitness-outline',
  'bodyweight-row': 'arrow-up-outline',
  'plank-hold': 'timer-outline',
  'rope-basic': 'ellipse-outline',
  'bird-dog': 'paw-outline',
  'glute-bridge': 'trending-up-outline',
  'mtb-steady': 'bicycle-outline',
};

type Props = {
  exerciseId?: string;
  size?: number;
  compact?: boolean;
  /** Play animated GIF when available. Defaults to !compact. */
  animated?: boolean;
};

function resolveMediaUrl(
  entry: ExerciseCatalogEntry | undefined,
  fallbackLevel: number,
  animated: boolean,
): string | null {
  if (!entry || fallbackLevel >= 2) return null;
  if (fallbackLevel === 0 && animated && entry.gifUrl) return entry.gifUrl;
  return entry.mediaUrl;
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    wrap: {
      alignSelf: 'center',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceAlt,
      borderRadius: 20,
      marginBottom: 16,
      overflow: 'hidden',
    },
    wrapCompact: {
      alignSelf: 'auto',
      marginBottom: 0,
      borderRadius: 10,
    },
    image: {
      borderRadius: 12,
    },
    caption: {
      color: colors.textMuted,
      fontSize: 10,
      marginTop: 4,
      textTransform: 'uppercase',
    },
  });

export function ExerciseVisual({
  exerciseId,
  size = 120,
  compact = false,
  animated,
}: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const showAnimated = animated ?? !compact;
  const [fallbackLevel, setFallbackLevel] = useState(0);
  const entry = exerciseId ? exerciseCatalog[exerciseId] : undefined;
  const mediaUrl = resolveMediaUrl(entry, fallbackLevel, showAnimated);
  const icon = (exerciseId && ICON_BY_EXERCISE[exerciseId]) || 'barbell-outline';
  const frameSize = compact ? size + 8 : size + 24;

  useEffect(() => {
    setFallbackLevel(0);
  }, [exerciseId, showAnimated]);

  if (mediaUrl) {
    return (
      <View
        style={[
          styles.wrap,
          compact && styles.wrapCompact,
          { width: frameSize, height: frameSize },
        ]}
      >
        <Image
          source={{ uri: mediaUrl }}
          style={[styles.image, { width: size, height: size }]}
          contentFit="cover"
          autoplay={showAnimated && fallbackLevel === 0}
          transition={150}
          accessibilityLabel={entry?.name ?? 'Exercise demo'}
          onError={() => setFallbackLevel((level) => level + 1)}
        />
        {!compact && showAnimated && fallbackLevel === 0 && entry?.gifUrl ? (
          <Text style={styles.caption}>Loop</Text>
        ) : null}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.wrap,
        compact && styles.wrapCompact,
        { width: frameSize, height: frameSize },
      ]}
    >
      <Ionicons name={icon} size={compact ? size * 0.55 : size * 0.6} color={colors.accent} />
      {!compact ? <Text style={styles.caption}>Demo</Text> : null}
    </View>
  );
}
