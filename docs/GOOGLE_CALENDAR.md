# Google Calendar setup

The Week tab reads Google Calendar events and can **Sync schedule** to create workout events. By default it uses your account **primary** calendar; set `EXPO_PUBLIC_GOOGLE_CALENDAR_ID` to use a specific one.

## 1. Google Cloud project

Use the same project as Firebase (**workout-driesgeebelen**):

- [Google Cloud Console](https://console.cloud.google.com/) → select project `workout-driesgeebelen` (or the project linked to your Firebase app)

## 2. Enable the API

1. **APIs & Services** → **Library**
2. Search **Google Calendar API** → **Enable**

## 3. OAuth consent screen

1. **APIs & Services** → **OAuth consent screen**
2. User type: **External** (or Internal if Workspace)
3. App name, support email, developer contact
4. **Scopes** → Add:
   - `https://www.googleapis.com/auth/calendar` (full access — required for **Sync schedule**)
   - `openid`, `email`, `profile` (usually added automatically)
5. **Test users** → add your Google account (required while app is in "Testing")
6. Save

## 4. OAuth clients

### A. iOS (required for iPhone + Expo Go)

1. **Credentials** → **Create credentials** → **OAuth client ID** → **iOS**
2. Bundle ID depends how you run the app:

| How you run | Bundle ID |
|-------------|-----------|
| **Expo Go** on iPhone | `host.exp.Exponent` |
| Dev / production build | `com.workout.app` |

3. Copy **Client ID** → `.env`:

```bash
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=123456789-abc.apps.googleusercontent.com
```

### B. Web (only for web / Android without native client)

1. **Create credentials** → **OAuth client ID** → **Web application**
2. **Authorized redirect URIs** — only needed if you are **not** using the iOS client on iPhone.

3. Copy **Client ID** → `.env`:

```bash
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=123456789-xyz.apps.googleusercontent.com
```

### iPhone redirect URI (important)

On iOS the app does **not** use `exp://…`. Google expects:

`com.googleusercontent.apps.<YOUR_IOS_CLIENT_PREFIX>:/oauthredirect`

Example: client `825965189413-abc.apps.googleusercontent.com` →  
`com.googleusercontent.apps.825965189413-abc:/oauthredirect`

You do **not** add this in Google Console — it is derived from the iOS client ID. The app now sets this automatically.

If you still see **Error 400: invalid_request**:

1. OAuth consent screen → **Test users** → add `geebelen3s@gmail.com` (your sign-in account)
2. Scopes → include `https://www.googleapis.com/auth/calendar`
3. iOS client bundle ID = `host.exp.Exponent` (Expo Go)
4. Restart Expo after `.env` changes

### C. Android (optional)

Only if you test on Android emulator/device:

```bash
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=...
```

## 5. Choose which calendar

1. Open [Google Calendar](https://calendar.google.com/) on the web
2. **Settings** (gear) → select the calendar under “Settings for my calendars”
3. **Integrate calendar** → copy **Calendar ID**  
   Examples: `name@gmail.com`, `abc123@group.calendar.google.com`
4. Add to `.env`:

```bash
EXPO_PUBLIC_GOOGLE_CALENDAR_ID=abc123@group.calendar.google.com
```

The signed-in Google account must have access to that calendar (owner or shared). Omit this variable to keep using **primary**.

## 6. `.env` and restart

```bash
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_CALENDAR_ID=your-id@group.calendar.google.com
# optional
# EXPO_PUBLIC_GOOGLE_REDIRECT_URI=exp://192.168.0.206:8081/--/oauthredirect
```

Restart Metro after changes:

```bash
npm run dev
```

## 7. Connect in the app

1. Open **Week** tab
2. Tap **Connect calendar**
3. Read the redirect URI in the alert — if Google returns `redirect_uri_mismatch`, add that exact URI in the Web client
4. Sign in with a **test user** account (if consent screen is in Testing)
5. Pull to refresh — events show under each day as `📅 …`
6. Tap **Sync schedule** to push this week’s workouts to the calendar

If you connected before write sync existed, or only had read-only scope: tap **Reconnect** (clears the old token), sign in again, then **Sync schedule**.

## Troubleshooting

| Error | Fix |
|-------|-----|
| `redirect_uri_mismatch` | Add the URI from the in-app alert to Web client redirect URIs |
| `access_denied` / app not verified | Add your Google account under OAuth consent → Test users |
| Sync: **N failed**, HTTP 403 | Consent screen needs **calendar** (not read-only); tap **Reconnect**, sign in again |
| `Calendar API error: 403` | Enable Google Calendar API; wait a few minutes |
| Connect does nothing | Set `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` for iPhone (Expo Go → bundle `host.exp.Exponent`) |
| Token works once then stops | Pull to refresh; **Reconnect** — token is stored locally |

Token is stored in AsyncStorage (`@workout/google_calendar_token`), not Firebase.
