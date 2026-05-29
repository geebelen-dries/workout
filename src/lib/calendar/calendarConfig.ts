/** Calendar to read events from. Defaults to `primary` if env is unset. */
export function getGoogleCalendarId(): string {
  const id = process.env.EXPO_PUBLIC_GOOGLE_CALENDAR_ID?.trim();
  return id || 'primary';
}

export function getGoogleCalendarEventsUrl(calendarId: string): string {
  const encoded = encodeURIComponent(calendarId);
  return `https://www.googleapis.com/calendar/v3/calendars/${encoded}/events`;
}

/** Google iOS/Android OAuth clients use a reversed client-id URL scheme. */
export function getGoogleNativeRedirectUri(clientId: string): string {
  const idPart = clientId.replace(/\.apps\.googleusercontent\.com$/i, '');
  return `com.googleusercontent.apps.${idPart}:/oauthredirect`;
}
