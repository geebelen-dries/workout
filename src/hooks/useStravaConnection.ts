import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import {
  exchangeStravaCode,
  isStravaConfigured,
} from '../lib/strava/stravaApi';
import {
  getStravaCallbackDomainHint,
  getStravaRedirectUri,
  getStravaSetupHint,
  useStravaAuthRequest,
} from '../lib/strava/stravaAuth';
import { stravaRedirectValidationError } from '../lib/strava/stravaRedirectUtils';
import { clearStravaTokens, loadStravaTokens } from '../lib/strava/stravaTokenStore';

export function useStravaConnection(onConnected?: () => void) {
  const [request, response, promptAsync] = useStravaAuthRequest();
  const [connected, setConnected] = useState(false);
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const tokens = await loadStravaTokens();
    setConnected(Boolean(tokens));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (response?.type !== 'success' || !response.params.code) return;
    setLinking(true);
    setError(null);
    exchangeStravaCode(String(response.params.code))
      .then(() => {
        setConnected(true);
        onConnected?.();
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLinking(false));
  }, [response, onConnected]);

  const connect = useCallback(() => {
    if (!isStravaConfigured()) {
      Alert.alert(
        'Strava not configured',
        'Add EXPO_PUBLIC_STRAVA_CLIENT_ID and EXPO_PUBLIC_STRAVA_CLIENT_SECRET to .env, then restart Metro.\n\n' +
          getStravaSetupHint(),
      );
      return;
    }
    if (!request) {
      Alert.alert('Strava', 'OAuth is still loading. Try again in a moment.');
      return;
    }
    const redirectUri = getStravaRedirectUri();
    const redirectError = stravaRedirectValidationError(redirectUri);
    if (redirectError) {
      Alert.alert('Strava redirect URI', redirectError);
      return;
    }
    const domain = getStravaCallbackDomainHint();
    Alert.alert(
      'Strava callback domain',
      `In strava.com/settings/api set Authorization Callback Domain to:\n\n${domain}\n\n(no http://, no workout://)\n\nRedirect URI used by this app:\n${redirectUri}\n\nIf Strava shows "redirect_uri invalid", the domain above must match exactly.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: () => promptAsync() },
      ],
    );
  }, [request, promptAsync]);

  const disconnect = useCallback(async () => {
    await clearStravaTokens();
    setConnected(false);
    setError(null);
  }, []);

  return {
    connected,
    linking,
    error,
    connect,
    disconnect,
    refresh,
    configured: isStravaConfigured(),
  };
}
