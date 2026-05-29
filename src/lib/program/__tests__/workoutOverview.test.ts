import { buildWorkoutOverview } from '../workoutOverview';
import { parseWorkoutMarkdown } from '../../parser/workoutParser';
import * as fs from 'fs';
import * as path from 'path';

const catalog = {
  'kb-deadlift': { name: 'Kettlebell Deadlift', cues: 'Hinge', mediaUrl: null },
};

const programsRoot = path.join(
  __dirname,
  '../../../../programs/lean-athletic-12w/workouts',
);

describe('buildWorkoutOverview', () => {
  it('summarizes strength circuit exercises', () => {
    const md = fs.readFileSync(
      path.join(programsRoot, 'strength-foundation.md'),
      'utf8',
    );
    const workout = parseWorkoutMarkdown(md);
    const sections = buildWorkoutOverview(workout, catalog);
    expect(sections[0].title).toContain('3 rounds');
    expect(sections[0].items.length).toBe(5);
  });

  it('summarizes skipping workout blocks', () => {
    const md = fs.readFileSync(
      path.join(programsRoot, 'skipping-conditioning.md'),
      'utf8',
    );
    const workout = parseWorkoutMarkdown(md);
    const sections = buildWorkoutOverview(workout, catalog);
    expect(sections.length).toBeGreaterThanOrEqual(3);
    expect(sections.some((s) => s.title.includes('Intervals'))).toBe(true);
  });
});
