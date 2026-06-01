import { redirectSystemPath } from '../nativeIntent';

describe('redirectSystemPath', () => {
  it('rewrites bare workout scheme to index', () => {
    expect(redirectSystemPath({ path: 'workout:///', initial: true })).toBe('/');
    expect(redirectSystemPath({ path: '/', initial: true })).toBe('/');
  });

  it('rewrites Strava OAuth callback to index', () => {
    expect(
      redirectSystemPath({
        path: 'workout://workout.app/strava-auth',
        initial: false,
      }),
    ).toBe('/');
  });

  it('rewrites oauthredirect to index', () => {
    expect(
      redirectSystemPath({
        path: 'workout:///oauthredirect',
        initial: false,
      }),
    ).toBe('/');
  });

  it('rewrites expo dev client URL to index', () => {
    expect(
      redirectSystemPath({
        path: 'workout://expo-development-client/?url=http://192.168.0.1:8081',
        initial: true,
      }),
    ).toBe('/');
  });
});
