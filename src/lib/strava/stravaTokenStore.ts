import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@workout/strava_tokens';

export type StravaTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
};

export async function saveStravaTokens(tokens: StravaTokens): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(tokens));
}

export async function loadStravaTokens(): Promise<StravaTokens | null> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return null;
  return JSON.parse(raw) as StravaTokens;
}

export async function clearStravaTokens(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
