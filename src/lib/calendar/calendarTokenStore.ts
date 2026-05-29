import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@workout/google_calendar_token';

export async function saveCalendarToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function loadCalendarToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function clearCalendarToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}
