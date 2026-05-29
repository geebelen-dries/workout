import { endOfDay, format, startOfDay } from 'date-fns';
import {
  loadStravaTokens,
  saveStravaTokens,
  type StravaTokens,
} from './stravaTokenStore';

export type StravaSport = 'ride' | 'run';

export type StravaActivitySummary = {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  start_date: string;
  moving_time: number;
  distance: number;
};

const RIDE_TYPES = new Set([
  'Ride',
  'MountainBikeRide',
  'GravelRide',
  'EBikeRide',
  'EMountainBikeRide',
  'VirtualRide',
  'Handcycle',
]);

const RUN_TYPES = new Set(['Run', 'TrailRun', 'VirtualRun']);

function getClientId() {
  return process.env.EXPO_PUBLIC_STRAVA_CLIENT_ID ?? '';
}

function getClientSecret() {
  return process.env.EXPO_PUBLIC_STRAVA_CLIENT_SECRET ?? '';
}

export function isStravaConfigured(): boolean {
  return Boolean(getClientId() && getClientSecret());
}

export async function exchangeStravaCode(code: string): Promise<StravaTokens> {
  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: getClientId(),
      client_secret: getClientSecret(),
      code,
      grant_type: 'authorization_code',
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Strava token exchange failed: ${res.status}${body ? ` — ${body.slice(0, 200)}` : ''}`,
    );
  }
  const data = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
  const tokens: StravaTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_at * 1000,
  };
  await saveStravaTokens(tokens);
  return tokens;
}

async function refreshAccessToken(refreshToken: string): Promise<StravaTokens> {
  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: getClientId(),
      client_secret: getClientSecret(),
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) {
    throw new Error(`Strava token refresh failed: ${res.status}`);
  }
  const data = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
  const tokens: StravaTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_at * 1000,
  };
  await saveStravaTokens(tokens);
  return tokens;
}

export async function getValidAccessToken(): Promise<string | null> {
  const stored = await loadStravaTokens();
  if (!stored) return null;
  if (Date.now() < stored.expiresAt - 60_000) {
    return stored.accessToken;
  }
  try {
    const refreshed = await refreshAccessToken(stored.refreshToken);
    return refreshed.accessToken;
  } catch {
    return null;
  }
}

export async function fetchRecentActivities(
  accessToken: string,
  after: Date,
): Promise<StravaActivitySummary[]> {
  const url = new URL('https://www.strava.com/api/v3/athlete/activities');
  url.searchParams.set('after', String(Math.floor(after.getTime() / 1000)));
  url.searchParams.set('per_page', '30');

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Strava activities failed: ${res.status}`);
  }
  return res.json() as Promise<StravaActivitySummary[]>;
}

function matchesSport(activity: StravaActivitySummary, sport: StravaSport): boolean {
  const sportType = activity.sport_type || activity.type;
  if (sport === 'ride') {
    return RIDE_TYPES.has(sportType) || sportType === 'Ride';
  }
  return RUN_TYPES.has(sportType) || sportType === 'Run';
}

function isSameCalendarDay(isoDate: string, day: Date): boolean {
  const activityDay = format(new Date(isoDate), 'yyyy-MM-dd');
  const targetDay = format(day, 'yyyy-MM-dd');
  return activityDay === targetDay;
}

export function findMatchingStravaActivity(
  activities: StravaActivitySummary[],
  sport: StravaSport,
  day: Date = new Date(),
  minDurationMin?: number,
): StravaActivitySummary | null {
  const minMovingSec = minDurationMin ? minDurationMin * 60 : 0;

  for (const activity of activities) {
    if (!isSameCalendarDay(activity.start_date, day)) continue;
    if (!matchesSport(activity, sport)) continue;
    if (minMovingSec > 0 && activity.moving_time < minMovingSec) continue;
    return activity;
  }
  return null;
}

export async function checkStravaActivityForToday(params: {
  sport: StravaSport;
  day?: Date;
  minDurationMin?: number;
}): Promise<{
  connected: boolean;
  activity: StravaActivitySummary | null;
  error?: string;
}> {
  const token = await getValidAccessToken();
  if (!token) {
    return { connected: false, activity: null };
  }

  const day = params.day ?? new Date();
  const after = startOfDay(day);
  void endOfDay(day);

  try {
    const activities = await fetchRecentActivities(token, after);
    const activity = findMatchingStravaActivity(
      activities,
      params.sport,
      day,
      params.minDurationMin,
    );
    return { connected: true, activity };
  } catch (e) {
    return {
      connected: true,
      activity: null,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export function formatStravaActivity(activity: StravaActivitySummary): string {
  const km = (activity.distance / 1000).toFixed(1);
  const mins = Math.round(activity.moving_time / 60);
  return `${activity.name} · ${km} km · ${mins} min`;
}
