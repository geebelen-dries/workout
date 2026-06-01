import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import {
  getGoogleCalendarEventsUrl,
  getGoogleCalendarId,
  getGoogleNativeRedirectUri,
} from './calendarConfig';

export {
  getGoogleCalendarId,
  getGoogleCalendarEventsUrl,
  getGoogleNativeRedirectUri,
} from './calendarConfig';

WebBrowser.maybeCompleteAuthSession();

/** Read + create/update events on calendars the user can edit */
const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar';

export type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  isAllDay: boolean;
};

function getGoogleClientIds() {
  return {
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() || undefined,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() || undefined,
    androidClientId:
      process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim() || undefined,
  };
}

/** Bundle / package id for OAuth redirect (Expo Go vs dev build). */
export function getNativeApplicationId(): string {
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    return Platform.OS === 'ios' ? 'host.exp.Exponent' : 'host.exp.exponent';
  }
  return (
    Constants.expoConfig?.ios?.bundleIdentifier ??
    Constants.expoConfig?.android?.package ??
    'com.geebelen3s.workout'
  );
}

export function isGoogleCalendarConfigured(): boolean {
  const { webClientId, iosClientId, androidClientId } = getGoogleClientIds();
  if (Platform.OS === 'ios') return Boolean(iosClientId);
  if (Platform.OS === 'android') return Boolean(androidClientId);
  return Boolean(webClientId);
}

/** Redirect URI sent to Google for the current platform. */
export function getGoogleRedirectUri(): string {
  const fromEnv = process.env.EXPO_PUBLIC_GOOGLE_REDIRECT_URI?.trim();
  if (fromEnv) return fromEnv;

  const ids = getGoogleClientIds();
  if (Platform.OS === 'ios' && ids.iosClientId) {
    return getGoogleNativeRedirectUri(ids.iosClientId);
  }
  if (Platform.OS === 'android' && ids.androidClientId) {
    return getGoogleNativeRedirectUri(ids.androidClientId);
  }

  return AuthSession.makeRedirectUri({
    native: `${getNativeApplicationId()}:/oauthredirect`,
    scheme: 'workout',
    path: 'oauthredirect',
  });
}

export function getGoogleOAuthSetupHint(): string {
  const { webClientId, iosClientId } = getGoogleClientIds();
  const redirectUri = getGoogleRedirectUri();
  const appId = getNativeApplicationId();
  const lines = [
    '1. Google Cloud → APIs → enable "Google Calendar API"',
    '2. OAuth consent screen → add scope calendar (read/write) + add yourself as test user',
    '3. Credentials:',
  ];

  if (Platform.OS === 'ios') {
    lines.push(
      `   • iOS OAuth client — Bundle ID: ${appId}`,
      iosClientId
        ? '     (EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID is set)'
        : '     → set EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID in .env',
      `   • Redirect scheme (auto): ${redirectUri}`,
    );
    if (appId === 'host.exp.Exponent') {
      lines.push(
        '     Expo Go: iOS client must use bundle ID host.exp.Exponent',
      );
    }
  } else {
    lines.push(
      `   • Web client — add redirect URI:\n     ${redirectUri}`,
      webClientId
        ? '     (EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is set)'
        : '     → set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in .env',
    );
  }

  lines.push(
    '',
    '4. Calendar ID in .env:',
    `   EXPO_PUBLIC_GOOGLE_CALENDAR_ID=${getGoogleCalendarId() === 'primary' ? 'your-id@group.calendar.google.com' : getGoogleCalendarId()}`,
    '   (Google Calendar → Settings → your calendar → Integrate calendar)',
    '',
    'Restart Expo after editing .env (npm run dev).',
  );

  return lines.join('\n');
}

export function getGoogleAccessToken(
  response: AuthSession.AuthSessionResult | null,
): string | null {
  if (response?.type !== 'success') return null;
  if (response.authentication?.accessToken) {
    return response.authentication.accessToken;
  }
  const token = response.params?.access_token;
  return typeof token === 'string' ? token : null;
}

export function useGoogleAuthRequest() {
  const ids = getGoogleClientIds();
  const redirectUri = getGoogleRedirectUri();

  return Google.useAuthRequest({
    webClientId: ids.webClientId,
    iosClientId: ids.iosClientId,
    androidClientId: ids.androidClientId,
    redirectUri,
    scopes: [CALENDAR_SCOPE, 'openid', 'profile', 'email'],
    selectAccount: true,
  });
}

export async function fetchWeekCalendarEvents(
  accessToken: string,
  weekStart: Date,
  weekEnd: Date,
): Promise<CalendarEvent[]> {
  const timeMin = weekStart.toISOString();
  const timeMax = weekEnd.toISOString();
  const url = new URL(getGoogleCalendarEventsUrl(getGoogleCalendarId()));
  url.searchParams.set('timeMin', timeMin);
  url.searchParams.set('timeMax', timeMax);
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('orderBy', 'startTime');
  url.searchParams.set('maxResults', '50');

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Calendar API error: ${res.status} ${text}`);
  }

  const data = (await res.json()) as {
    items?: Array<{
      id: string;
      summary?: string;
      start?: { dateTime?: string; date?: string };
      end?: { dateTime?: string; date?: string };
    }>;
  };

  return (data.items ?? []).map((item) => {
    const isAllDay = Boolean(item.start?.date);
    const startRaw = item.start?.dateTime ?? item.start?.date ?? '';
    const endRaw = item.end?.dateTime ?? item.end?.date ?? startRaw;
    return {
      id: item.id,
      title: item.summary ?? 'Busy',
      start: new Date(startRaw),
      end: new Date(endRaw),
      isAllDay,
    };
  });
}
