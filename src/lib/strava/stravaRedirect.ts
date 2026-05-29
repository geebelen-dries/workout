import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as AuthSession from 'expo-auth-session';
import { Platform } from 'react-native';
import {
  parseRedirectHost,
  STRAVA_CALLBACK_DOMAIN,
} from './stravaRedirectUtils';

export {
  isStravaRedirectUriValid,
  parseRedirectHost,
  stravaRedirectValidationError,
} from './stravaRedirectUtils';

export function isExpoGo(): boolean {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}

/** HTTP redirect Strava accepts (not exp://). */
export function getLanHttpRedirectUri(): string | null {
  const expoGo = Constants.expoGoConfig as { debuggerHost?: string } | null;
  const linkingUri = (Constants as { linkingUri?: string }).linkingUri;
  const candidates = [
    Constants.expoConfig?.hostUri,
    expoGo?.debuggerHost,
    linkingUri,
    Constants.manifest2?.extra?.expoClient?.hostUri as string | undefined,
  ].filter((v): v is string => Boolean(v));

  for (const raw of candidates) {
    const host = parseRedirectHost(raw);
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}`;
    }
  }
  return null;
}

/** Stable redirect for dev/production builds (Strava mobile OAuth). */
export function getDevBuildStravaRedirectUri(): string {
  return `workout://${STRAVA_CALLBACK_DOMAIN}/strava-auth`;
}

export function resolveStravaRedirectUri(): string {
  const fromEnv = process.env.EXPO_PUBLIC_STRAVA_REDIRECT_URI?.trim();
  if (fromEnv) return fromEnv;

  // Dev build / standalone: fixed deep link — no LAN IP
  if (!isExpoGo() && Platform.OS !== 'web') {
    return getDevBuildStravaRedirectUri();
  }

  if (isExpoGo()) {
    const lan = getLanHttpRedirectUri();
    if (lan) return lan;
    if (Platform.OS === 'web') {
      return AuthSession.makeRedirectUri({
        preferLocalhost: true,
        path: 'strava-auth',
      });
    }
    return 'http://127.0.0.1';
  }

  return AuthSession.makeRedirectUri({
    preferLocalhost: true,
    path: 'strava-auth',
  });
}

export function getStravaCallbackDomainForRedirect(uri: string): string {
  if (uri.startsWith('workout://')) {
    return STRAVA_CALLBACK_DOMAIN;
  }
  try {
    return new URL(uri).hostname || 'localhost';
  } catch {
    return 'localhost';
  }
}
