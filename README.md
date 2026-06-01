# Workout

Configurable workout app — Phase 1 of the Lean Athletic 12-week program as markdown/YAML, with timers, streaks, and Google Calendar overlay.

## Features

- **Markdown/YAML programs** in `programs/lean-athletic-12w/`
- **Session player** — circuits, intervals, steady cardio; play/pause/skip; screen stays awake
- **Streaks & phase progress** — Firestore or local demo storage
- **Week view** — today’s workout + Google Calendar events (read-only)

## Quick start

```bash
npm install
npm test
npm run dev
```

### Local dev server

| Command | Use when |
|---------|----------|
| `npm run dev` | Default — LAN Metro for **dev build** on your phone (same Wi‑Fi) |
| `npm run dev:go` | Expo Go on your phone (legacy) |
| `npm run dev:tunnel` | Dev build when LAN discovery fails (VPN / guest Wi‑Fi) |
| `npm run dev:localhost` | Simulator only — `localhost` Strava callback domain |
| `npm start` | Expo CLI menu (press `i` / `a` / `w`) |
| `npm run web` | Browser at `http://localhost:8081` (or port shown in terminal) |

After `npm run dev`, open the **Workout dev build** on your phone (not Expo Go). If it says "No development servers found", tap **Enter URL manually** and paste the `http://<your-lan-ip>:8081` URL from the terminal.

For Strava on a physical device, use a **development build** ([docs/DEV_BUILD.md](docs/DEV_BUILD.md)) — stable `workout://` OAuth. Expo Go requires a LAN IP in `.env`.

### Demo mode (no Firebase)

If `.env` is missing, open the app and tap **Continue in demo mode**. Sessions and streaks persist locally via AsyncStorage.

### Firebase

Project: **workout-driesgeebelen** (`.firebaserc`)

**One-time (required):** [Authentication](https://console.firebase.google.com/project/workout-driesgeebelen/authentication) → **Get started** → enable **Email/Password**.

1. `.env` holds the Web app SDK config (`EXPO_PUBLIC_FIREBASE_*`).
2. Firestore is in **eur3**; deploy rules with `npm run firebase:deploy`
3. Restart Expo after changing `.env`.

Create an account in the app via **Create account** on the login screen.

### Google Calendar

Full guide: **[docs/GOOGLE_CALENDAR.md](docs/GOOGLE_CALENDAR.md)**

1. Enable **Google Calendar API** in Google Cloud (same project as Firebase).
2. OAuth consent screen → add `https://www.googleapis.com/auth/calendar` + your account as **test user**.
3. Create **iOS** OAuth client (`host.exp.Exponent` for Expo Go, `com.geebelen3s.workout` for builds).
4. Create **Web** OAuth client → add redirect URI shown in app (**Week** → **Connect calendar**).
5. Set `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` and `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` in `.env`.
6. Optional: `EXPO_PUBLIC_GOOGLE_CALENDAR_ID` for a specific calendar (not primary). Restart Expo.

### Strava (MTB / runs)

See **[docs/STRAVA.md](docs/STRAVA.md)**. Short version:

1. [strava.com/settings/api](https://www.strava.com/settings/api) → create app → copy Client ID + Secret
2. **Authorization Callback Domain** = host only (`localhost` on simulator, or your LAN IP on iPhone — shown in-app)
3. `.env` → `EXPO_PUBLIC_STRAVA_CLIENT_ID` + `EXPO_PUBLIC_STRAVA_CLIENT_SECRET` → `npm run dev`
4. **Profile → Strava → Connect** (or connect during Saturday MTB session)

No in-app timer for these sessions; completion requires a matching activity logged today (optional `minDurationMin` in workout YAML).

## Program layout

```
programs/lean-athletic-12w/
  program.yaml
  schedule-phase-1.yaml
  exercises.json
  workouts/*.md
```

Sync bundled copy in `src/lib/program/workoutContent.ts` when editing markdown (or add a sync script later).

## Scripts

| Command        | Description        |
|----------------|--------------------|
| `npm start`    | Expo dev server    |
| `npm test`     | Parser & streak tests |
| `npm run ios`  | iOS simulator      |
| `npm run android` | Android emulator |
