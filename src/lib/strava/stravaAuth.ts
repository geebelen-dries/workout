import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import {
  getLanHttpRedirectUri,
  getStravaCallbackDomainForRedirect,
  isExpoGo,
  resolveStravaRedirectUri,
} from './stravaRedirect';
import { stravaRedirectValidationError } from './stravaRedirectUtils';

WebBrowser.maybeCompleteAuthSession();

const STRAVA_SCOPE = 'activity:read';

/** Web OAuth (simulator / default). */
export const STRAVA_WEB_AUTHORIZE_URL = 'https://www.strava.com/oauth/authorize';

/** Opens Strava app when installed (iOS/Android dev builds). */
export const STRAVA_MOBILE_AUTHORIZE_URL =
  'https://www.strava.com/oauth/mobile/authorize';

/**
 * Strava "Authorization Callback Domain" = host only (e.g. `localhost`, `10.1.81.101`).
 * The redirect_uri host must match that domain. Do not use `workout://` or `exp://`.
 */
export function getStravaRedirectUri(): string {
  return resolveStravaRedirectUri();
}

export { getLanHttpRedirectUri, stravaRedirectValidationError };

export function getStravaCallbackDomainHint(): string {
  return getStravaCallbackDomainForRedirect(getStravaRedirectUri());
}

export function getStravaAuthorizeEndpoint(): string {
  return Platform.OS === 'web' || isExpoGo()
    ? STRAVA_WEB_AUTHORIZE_URL
    : STRAVA_MOBILE_AUTHORIZE_URL;
}

export function getStravaSetupHint(): string {
  const domain = getStravaCallbackDomainHint();
  const redirectUri = getStravaRedirectUri();
  const lines = [
    '1. strava.com/settings/api → create app',
    `2. Authorization Callback Domain → ${domain} (host only, no http://)`,
    '3. .env → EXPO_PUBLIC_STRAVA_CLIENT_ID + EXPO_PUBLIC_STRAVA_CLIENT_SECRET',
    '4. Restart Metro (npm run dev)',
    `5. Redirect URI this app uses:\n${redirectUri}`,
  ];
  if (isExpoGo() && !process.env.EXPO_PUBLIC_STRAVA_REDIRECT_URI?.trim()) {
    lines.splice(
      2,
      0,
      '   On iPhone: run npm run dev (LAN). Callback domain is usually your Mac’s Wi‑Fi IP.',
    );
  }
  return lines.join('\n');
}

export function useStravaAuthRequest() {
  const clientId = process.env.EXPO_PUBLIC_STRAVA_CLIENT_ID ?? '';
  const redirectUri = getStravaRedirectUri();

  return AuthSession.useAuthRequest(
    {
      clientId,
      scopes: [STRAVA_SCOPE],
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      extraParams: {
        approval_prompt: 'auto',
      },
    },
    { authorizationEndpoint: getStravaAuthorizeEndpoint() },
  );
}
