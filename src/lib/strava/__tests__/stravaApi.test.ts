import {
  findMatchingStravaActivity,
  type StravaActivitySummary,
} from '../stravaApi';

const base: StravaActivitySummary = {
  id: 1,
  name: 'Morning ride',
  type: 'Ride',
  sport_type: 'MountainBikeRide',
  start_date: '2026-05-20T08:00:00Z',
  moving_time: 3600,
  distance: 25000,
};

describe('findMatchingStravaActivity', () => {
  it('matches ride on same day', () => {
    const match = findMatchingStravaActivity(
      [base],
      'ride',
      new Date('2026-05-20T18:00:00'),
      45,
    );
    expect(match?.id).toBe(1);
  });

  it('rejects short rides when min duration set', () => {
    const short = { ...base, moving_time: 1200 };
    const match = findMatchingStravaActivity(
      [short],
      'ride',
      new Date('2026-05-20'),
      45,
    );
    expect(match).toBeNull();
  });

  it('matches run sport type', () => {
    const run = {
      ...base,
      id: 2,
      sport_type: 'Run',
      type: 'Run',
    };
    const match = findMatchingStravaActivity(
      [run],
      'run',
      new Date('2026-05-20'),
    );
    expect(match?.id).toBe(2);
  });
});
