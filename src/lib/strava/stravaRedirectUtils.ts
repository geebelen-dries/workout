/** Parse host from `192.168.0.1:8081`, `exp://10.0.0.1:8081`, etc. */
export function parseRedirectHost(source: string): string | null {
  const trimmed = source.trim();
  if (!trimmed) return null;
  try {
    if (trimmed.includes('://')) {
      return new URL(trimmed).hostname || null;
    }
  } catch {
    // fall through
  }
  const host = trimmed.split(':')[0];
  return host || null;
}

/** Fixed host for Strava dashboard (dev build). See docs/STRAVA.md */
export const STRAVA_CALLBACK_DOMAIN = 'workout.app';

export function isStravaRedirectUriValid(uri: string): boolean {
  if (uri.startsWith('exp://')) {
    return false;
  }
  if (uri.startsWith('workout://')) {
    return true;
  }
  try {
    const { protocol, hostname } = new URL(uri);
    return (protocol === 'http:' || protocol === 'https:') && Boolean(hostname);
  } catch {
    return false;
  }
}

export function stravaRedirectValidationError(uri: string): string | null {
  if (!isStravaRedirectUriValid(uri)) {
    return (
      'Strava rejects exp:// redirects.\n\n' +
      'Expo Go on a phone: set EXPO_PUBLIC_STRAVA_REDIRECT_URI=http://YOUR_MAC_IP and matching Strava callback domain.\n\n' +
      'Better: use a development build (npx expo run:ios) — stable workout:// redirect, no IP. See docs/STRAVA.md.'
    );
  }
  return null;
}
