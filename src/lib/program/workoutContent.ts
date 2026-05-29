/** Bundled program sources (sync with programs/lean-athletic-12w/) */

export const schedulePhase1Yaml = `phase: 1
programId: lean-athletic-12w
days:
  monday: strength-foundation
  tuesday: rest-mobility
  wednesday: skipping-conditioning
  thursday: rest
  friday: strength-foundation
  saturday: mtb-endurance
  sunday: rest
`;

export const strengthFoundationMd = `---
id: strength-foundation
title: Strength Foundation
phase: 1
estimatedMinutes: [30, 40]
kind: workout
blocks:
  - type: circuit
    rounds: 3
    restBetweenRoundsSec: 120
    items:
      - exerciseId: kb-deadlift
        reps: 10
        restAfterSec: 45
      - exerciseId: incline-pushup
        reps: { min: 10, max: 12 }
        restAfterSec: 45
      - exerciseId: kb-goblet-squat
        reps: 8
        restAfterSec: 45
      - exerciseId: bodyweight-row
        reps: { min: 8, max: 10 }
        restAfterSec: 45
      - exerciseId: plank-hold
        durationSec: 45
        restAfterSec: 45
---
Perform as a circuit. Complete exercise 1, rest 45 seconds, move to exercise 2, etc. Repeat the whole circuit 3 times. Rest 2 minutes between full circuits.
`;

export const skippingConditioningMd = `---
id: skipping-conditioning
title: Skipping Conditioning
phase: 1
estimatedMinutes: [20, 25]
kind: workout
blocks:
  - type: note
    title: Warm-up
    body: 3 minutes of ankle circles and calf stretches. Do not overdo skipping early on.
  - type: interval
    rounds: 10
    workSec: 45
    restSec: 45
    items:
      - exerciseId: rope-basic
  - type: circuit
    rounds: 3
    restBetweenRoundsSec: 60
    items:
      - exerciseId: bird-dog
        reps: 15
        restAfterSec: 0
      - exerciseId: glute-bridge
        reps: 15
        restAfterSec: 30
---
Protect your achilles. Interval is 45 seconds jumping / 45 seconds rest, 10 times total.
`;

export const mtbEnduranceMd = `---
id: mtb-endurance
title: Mountain Biking Endurance
phase: 1
estimatedMinutes: [60, 90]
kind: workout
blocks:
  - type: strava_cardio
    exerciseId: mtb-steady
    stravaSport: ride
    durationMin: 60
    durationMax: 90
    minDurationMin: 45
---
Steady aerobic pace. Keep heart rate where you could hold a broken conversation. Focus on smooth pedaling cadence.
`;

export const restMobilityMd = `---
id: rest-mobility
title: Rest / Mobility
phase: 1
estimatedMinutes: [15, 30]
kind: rest
blocks:
  - type: rest_day
    variant: mobility
    body: Light stretching, foam rolling, or yoga. No intense training.
---
Recovery day. Optional mobility work only.
`;

export const restMd = `---
id: rest
title: Rest
phase: 1
kind: rest
blocks:
  - type: rest_day
    variant: full
    body: Pure rest. Hydrate and sleep.
---
Full rest day.
`;
