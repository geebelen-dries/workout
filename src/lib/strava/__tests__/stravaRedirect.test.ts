import {
  isStravaRedirectUriValid,
  parseRedirectHost,
} from '../stravaRedirectUtils';

describe('parseRedirectHost', () => {
  it('parses exp linking URI', () => {
    expect(parseRedirectHost('exp://10.1.81.101:8081')).toBe('10.1.81.101');
  });

  it('parses host:port', () => {
    expect(parseRedirectHost('192.168.0.206:8081')).toBe('192.168.0.206');
  });
});

describe('isStravaRedirectUriValid', () => {
  it('accepts http LAN', () => {
    expect(isStravaRedirectUriValid('http://10.1.81.101')).toBe(true);
  });

  it('rejects exp scheme', () => {
    expect(isStravaRedirectUriValid('exp://10.1.81.101:8081/--/strava-auth')).toBe(
      false,
    );
  });

  it('accepts workout scheme for dev build', () => {
    expect(isStravaRedirectUriValid('workout://workout.app/strava-auth')).toBe(
      true,
    );
  });
});
