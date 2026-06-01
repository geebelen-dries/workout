import { STRAVA_CALLBACK_DOMAIN } from '../strava/stravaRedirectUtils';

/** OAuth / dev-client URLs are not screens — send them to index. */
export function normalizeIncomingNativePath(path: string): string {
  const trimmed = path?.trim() ?? '';
  if (!trimmed || trimmed === '/' || trimmed === 'workout:///') {
    return '/';
  }

  if (trimmed.includes('://')) {
    const url = trimmed.startsWith('workout:///')
      ? new URL('workout://localhost/')
      : new URL(trimmed);

    const { hostname, pathname } = url;

    if (hostname === 'expo-development-client') return '/';
    if (hostname === STRAVA_CALLBACK_DOMAIN && pathname.includes('strava-auth')) {
      return '/';
    }
    if (pathname.includes('oauthredirect') || pathname.includes('strava-auth')) {
      return '/';
    }
    if (pathname === '/' || pathname === '') return '/';

    return pathname.startsWith('/') ? pathname : `/${pathname}`;
  }

  if (trimmed.includes('strava-auth') || trimmed.includes('oauthredirect')) {
    return '/';
  }

  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

export function redirectSystemPath({
  path,
}: {
  path: string;
  initial: boolean;
}): string {
  try {
    return normalizeIncomingNativePath(path);
  } catch {
    return '/';
  }
}
