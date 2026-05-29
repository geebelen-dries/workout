import {
  getGoogleCalendarEventsUrl,
  getGoogleCalendarId,
} from '../calendarConfig';
import { getGoogleNativeRedirectUri } from '../calendarConfig';

describe('googleCalendar config', () => {
  const original = process.env.EXPO_PUBLIC_GOOGLE_CALENDAR_ID;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.EXPO_PUBLIC_GOOGLE_CALENDAR_ID;
    } else {
      process.env.EXPO_PUBLIC_GOOGLE_CALENDAR_ID = original;
    }
  });

  it('defaults to primary when env is unset', () => {
    delete process.env.EXPO_PUBLIC_GOOGLE_CALENDAR_ID;
    expect(getGoogleCalendarId()).toBe('primary');
  });

  it('uses EXPO_PUBLIC_GOOGLE_CALENDAR_ID when set', () => {
    process.env.EXPO_PUBLIC_GOOGLE_CALENDAR_ID =
      'abc123@group.calendar.google.com';
    expect(getGoogleCalendarId()).toBe('abc123@group.calendar.google.com');
  });

  it('encodes calendar id in API url', () => {
    const url = getGoogleCalendarEventsUrl('abc@group.calendar.google.com');
    expect(url).toContain(
      'calendars/abc%40group.calendar.google.com/events',
    );
  });

  it('builds iOS redirect URI from client id', () => {
    expect(
      getGoogleNativeRedirectUri(
        '825965189413-abc.apps.googleusercontent.com',
      ),
    ).toBe('com.googleusercontent.apps.825965189413-abc:/oauthredirect');
  });
});
