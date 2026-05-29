import { useEffect, useRef } from 'react';
import {
  getGoogleAccessToken,
  useGoogleAuthRequest,
} from '../lib/calendar/googleCalendar';
import type * as AuthSession from 'expo-auth-session';

type Props = {
  onToken: (accessToken: string) => void;
  onReady: (api: {
    request: AuthSession.AuthRequest | null;
    promptAsync: (
      options?: AuthSession.AuthRequestPromptOptions,
    ) => Promise<AuthSession.AuthSessionResult>;
  }) => void;
};

/** Mount only when `isGoogleCalendarConfigured()` — avoids iOS crash without iosClientId. */
export function GoogleCalendarAuth({ onToken, onReady }: Props) {
  const [request, response, promptAsync] = useGoogleAuthRequest();
  const onReadyRef = useRef(onReady);
  const onTokenRef = useRef(onToken);
  const savedTokenRef = useRef<string | null>(null);

  useEffect(() => {
    onReadyRef.current = onReady;
    onTokenRef.current = onToken;
  });

  useEffect(() => {
    if (!request) return;
    onReadyRef.current({ request, promptAsync });
  }, [request, promptAsync]);

  useEffect(() => {
    const token = getGoogleAccessToken(response);
    if (!token) return;
    if (token === savedTokenRef.current) return;
    savedTokenRef.current = token;
    onTokenRef.current(token);
  }, [response]);

  useEffect(() => {
    if (response?.type === 'error' || response?.type === 'dismiss') {
      savedTokenRef.current = null;
    }
  }, [response]);

  return null;
}
