import {
  getDayCompletionStatus,
  getSessionOnDate,
} from '../weekCompletion';
import type { SessionLog } from '../../firestore/types';

const restSession: SessionLog = {
  workoutId: 'rest',
  workoutTitle: 'Rest',
  phase: 1,
  startedAt: '2026-05-19T10:00:00',
  completedAt: '2026-05-19T10:00:00',
  durationSec: 60,
  stepsCompleted: 1,
  stepsSkipped: 0,
  kind: 'rest',
};

describe('getDayCompletionStatus', () => {
  it('auto-completes rest days on or before today', () => {
    expect(
      getDayCompletionStatus(
        null,
        false,
        new Date('2026-05-19T12:00:00'),
        new Date('2026-05-20T12:00:00'),
      ),
    ).toBe('completed');
  });

  it('keeps future rest days pending', () => {
    expect(
      getDayCompletionStatus(
        null,
        false,
        new Date('2026-05-25T12:00:00'),
        new Date('2026-05-20T12:00:00'),
      ),
    ).toBe('pending');
  });

  it('requires a session for workout days', () => {
    expect(
      getDayCompletionStatus(
        null,
        true,
        new Date('2026-05-18T12:00:00'),
        new Date('2026-05-20T12:00:00'),
      ),
    ).toBe('pending');
  });

  it('completes workout day when session exists', () => {
    expect(
      getDayCompletionStatus(restSession, true, new Date('2026-05-19'), new Date()),
    ).toBe('completed');
  });
});

describe('getSessionOnDate', () => {
  it('finds session on matching day and workout', () => {
    const found = getSessionOnDate(
      [restSession],
      new Date('2026-05-19'),
      'rest',
    );
    expect(found?.workoutId).toBe('rest');
  });
});
