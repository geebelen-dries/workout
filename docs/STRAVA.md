# Strava setup

MTB endurance (Saturday) completes via Strava: ride in Strava, then **Check Strava** in the app to match today’s ride.

## 1. Create a Strava API application

1. Open [strava.com/settings/api](https://www.strava.com/settings/api)
2. **Create an app** (or use an existing one)
3. Copy **Client ID** and **Client Secret**

## 2. Authorization Callback Domain

Strava only accepts redirect hosts you register here. Enter **host only** — no `http://`, no path, no `workout://`.

### Pick one approach

| How you run | Callback domain (Strava settings) | Redirect URI (in app) | IP changes? |
|-------------|-----------------------------------|------------------------|-------------|
| **Development build** (`npx expo run:ios`) — **recommended** | `workout.app` | `workout://workout.app/strava-auth` | **No** — set once |
| iOS Simulator | `localhost` | `http://localhost` (auto) | No |
| iPhone + **Expo Go** | Your Mac’s LAN IP, e.g. `10.1.81.101` | `http://<that-ip>` | **Yes** — update when Wi‑Fi changes |

**Expo Go on a real phone** cannot use a custom URL scheme, so Strava forces the LAN-IP workaround. For day-to-day use, install a **development build** once:

See [DEV_BUILD.md](./DEV_BUILD.md) — `npx eas-cli build --profile development --platform ios` (or `npm run ios:dev` with Xcode).

Then in Strava API settings set **Authorization Callback Domain** to `workout.app` (never changes). Remove `EXPO_PUBLIC_STRAVA_REDIRECT_URI` from `.env` so the app uses `workout://workout.app/strava-auth`.

For Google Calendar in the dev build, use an iOS OAuth client with bundle ID `com.geebelen3s.workout` (not `host.exp.Exponent`).

The app shows the exact domain and redirect URI when you tap **Connect**.

### Expo Go only (LAN IP)

Auto-detects LAN IP when Metro runs with `--lan` (`npm run dev`). Override if detection is wrong:

```bash
EXPO_PUBLIC_STRAVA_REDIRECT_URI=http://10.1.81.101
```

Restart Metro after changing `.env`.

## 3. `.env`

```bash
EXPO_PUBLIC_STRAVA_CLIENT_ID=12345
EXPO_PUBLIC_STRAVA_CLIENT_SECRET=your-secret-here
```

Restart:

```bash
npm run dev
```

## 4. Connect in the app

**Profile → Strava → Connect**, or on an MTB day open the workout and tap **Connect Strava**.

1. Confirm callback domain in Strava settings matches the alert
2. Tap **Continue** → authorize in Strava
3. You should see **Connected** on Profile

## 5. Complete an MTB workout

1. **Week** → Saturday **MTB Endurance** → start session
2. Record the ride in Strava (app or watch)
3. Return to the workout → **Check Strava**
4. When today’s ride is found → **Complete workout**

## Troubleshooting

| Error | Fix |
|-------|-----|
| `invalid redirect_uri` | Callback domain must match redirect host; copy values from the in-app alert |
| `Strava not configured` | Set client ID + secret in `.env`, restart Metro |
| Token exchange failed | Wrong client secret, or code already used — tap Connect again |
| No ride found today | Activity must be logged **today** as a Ride (or MTB type); then Check again |
| OAuth opens but app doesn’t return | iPhone: use `npm run dev` (LAN), not localhost-only; phone and Mac on same Wi‑Fi |

Tokens are stored locally (`@workout/strava_tokens`), not in Firebase.
