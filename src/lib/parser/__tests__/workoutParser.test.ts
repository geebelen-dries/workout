import * as fs from 'fs';
import * as path from 'path';
import {
  buildPlayerSteps,
  parseScheduleYaml,
  parseWorkoutMarkdown,
} from '../workoutParser';

const programsRoot = path.join(
  __dirname,
  '../../../../programs/lean-athletic-12w',
);

function readWorkout(name: string) {
  return fs.readFileSync(
    path.join(programsRoot, 'workouts', `${name}.md`),
    'utf8',
  );
}

describe('parseWorkoutMarkdown', () => {
  it('parses strength foundation circuit', () => {
    const workout = parseWorkoutMarkdown(readWorkout('strength-foundation'));
    expect(workout.id).toBe('strength-foundation');
    expect(workout.kind).toBe('workout');
    expect(workout.blocks).toHaveLength(1);
    const block = workout.blocks[0];
    expect(block.type).toBe('circuit');
    if (block.type === 'circuit') {
      expect(block.rounds).toBe(3);
      expect(block.items).toHaveLength(5);
    }
  });

  it('parses skipping conditioning with interval and circuit', () => {
    const workout = parseWorkoutMarkdown(readWorkout('skipping-conditioning'));
    expect(workout.blocks.map((b) => b.type)).toEqual([
      'note',
      'interval',
      'circuit',
    ]);
    const interval = workout.blocks[1];
    if (interval.type === 'interval') {
      expect(interval.rounds).toBe(10);
      expect(interval.workSec).toBe(45);
    }
  });

  it('parses mtb strava cardio', () => {
    const workout = parseWorkoutMarkdown(readWorkout('mtb-endurance'));
    const block = workout.blocks[0];
    expect(block.type).toBe('strava_cardio');
    if (block.type === 'strava_cardio') {
      expect(block.stravaSport).toBe('ride');
      expect(block.durationMin).toBe(60);
      expect(block.minDurationMin).toBe(45);
    }
  });
});

describe('parseScheduleYaml', () => {
  it('parses phase 1 schedule', () => {
    const yaml = fs.readFileSync(
      path.join(programsRoot, 'schedule-phase-1.yaml'),
      'utf8',
    );
    const schedule = parseScheduleYaml(yaml);
    expect(schedule.phase).toBe(1);
    expect(schedule.days.monday).toBe('strength-foundation');
    expect(schedule.days.friday).toBe('strength-foundation');
  });
});

describe('buildPlayerSteps', () => {
  it('expands circuit with rests and round rests', () => {
    const workout = parseWorkoutMarkdown(readWorkout('strength-foundation'));
    const steps = buildPlayerSteps(workout);
    const exercises = steps.filter((s) => s.kind === 'exercise');
    const roundRests = steps.filter((s) => s.kind === 'round_rest');
    expect(exercises.length).toBe(15);
    expect(roundRests.length).toBe(2);
  });

  it('expands interval work and rest steps', () => {
    const workout = parseWorkoutMarkdown(readWorkout('skipping-conditioning'));
    const steps = buildPlayerSteps(workout);
    const workSteps = steps.filter(
      (s) => s.kind === 'exercise' && s.mode === 'interval_work',
    );
    expect(workSteps.length).toBe(10);
  });
});
