# iOS development build

Use a **development build** instead of Expo Go for stable Strava OAuth (`workout://workout.app`) and Google Calendar native redirects.

Bundle ID: `com.geebelen3s.workout` (registered to your Apple Developer team).

## Prerequisites

- **Apple Developer** account (free or paid) for device installs
- Either **Xcode** from the Mac App Store (local build), or **EAS Build** (cloud — no local Xcode)

## Strava (one-time)

At [strava.com/settings/api](https://www.strava.com/settings/api):

- **Authorization Callback Domain:** `workout.app`
- Do **not** set `EXPO_PUBLIC_STRAVA_REDIRECT_URI` in `.env`

## Option A — EAS cloud build (no Xcode on Mac) — **your Mac**

Project is linked: [@geebelen3s/workout](https://expo.dev/accounts/geebelen3s/projects/workout)

Run **in your terminal** (interactive — sets up Apple signing):

```bash
npx eas-cli build --profile development --platform ios
```

Follow prompts to sign in with Apple ID and register your iPhone. When the build finishes, open the install QR/link on your phone.

Then start Metro and open the **Workout** dev client (not Expo Go):

```bash
npm run dev
```

## Option B — Local build (requires Xcode)

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
npm run ios:prebuild
npm run ios:dev
```

Pick your physical iPhone or a simulator in Xcode.

## Daily workflow

1. `npm run dev` on your Mac (starts Metro for the **dev build**, not Expo Go)
2. Open the **Workout** dev build on your phone (same Wi‑Fi)
3. Pick the server from the list, or tap **Enter URL manually** → `http://<mac-lan-ip>:8081`
4. Shake device → dev menu if you need to change bundler URL

### "No development servers found"

- Metro must be running (`npm run dev`) **before** you open the app
- iPhone and Mac on the **same Wi‑Fi** (not guest network / VPN)
- If auto-discovery fails, tap **Enter URL manually** and use the `http://…:8081` URL printed in the terminal
- Different networks or strict Wi‑Fi: `npm run dev:tunnel` (slower, but works across networks)
- Mac firewall: allow incoming connections for **Node** / **Terminal**

### "Cannot find native module ExpoFontLoader"

`@expo/vector-icons` needs `expo-font` compiled into the dev build. After adding it (or changing native deps), **rebuild and reinstall**:

```bash
npm run build:ios:dev
```

Install the new build on your phone, then `npm run dev`.

## Profiles in `eas.json`

| Profile | Use |
|---------|-----|
| `development` | Install on physical iPhone |
| `development-simulator` | iOS Simulator only (no Apple device UDID) |
