import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';
import { isFirebaseConfigured } from '../src/config/firebase';
import { useThemedStyles } from '../src/hooks/useThemedStyles';
import type { ColorPalette } from '../src/theme/colors';

function firebaseAuthErrorMessage(error: unknown): string {
  const code =
    error && typeof error === 'object' && 'code' in error
      ? String((error as { code: string }).code)
      : '';
  if (code === 'auth/configuration-not-found') {
    return (
      'Firebase Authentication is not enabled for this project yet.\n\n' +
      'Open Firebase Console → Authentication → Get started, then enable Email/Password under Sign-in method.\n\n' +
      'Project: workout-driesgeebelen'
    );
  }
  return String(error);
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
      padding: 24,
      justifyContent: 'center',
    },
    title: {
      color: colors.text,
      fontSize: 36,
      fontWeight: '800',
      marginBottom: 8,
    },
    subtitle: { color: colors.textMuted, fontSize: 16, marginBottom: 32 },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 14,
      color: colors.text,
      marginBottom: 12,
      fontSize: 16,
    },
    primaryBtn: {
      backgroundColor: colors.accent,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 8,
    },
    primaryBtnText: { color: colors.onAccent, fontWeight: '700', fontSize: 16 },
    secondaryBtn: {
      padding: 16,
      alignItems: 'center',
      marginTop: 8,
    },
    secondaryBtnText: { color: colors.accent, fontWeight: '600' },
    banner: {
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    bannerText: { color: colors.textMuted, lineHeight: 22, marginBottom: 16 },
    demoBtn: {
      backgroundColor: colors.accent,
      padding: 14,
      borderRadius: 10,
      alignItems: 'center',
    },
    demoBtnText: { color: colors.onAccent, fontWeight: '700' },
  });

export default function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const onSignIn = async () => {
    setBusy(true);
    try {
      await signIn(email.trim(), password);
      router.replace('/');
    } catch (e) {
      Alert.alert('Sign in failed', firebaseAuthErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const onSignUp = async () => {
    setBusy(true);
    try {
      await signUp(email.trim(), password);
      router.replace('/');
    } catch (e) {
      Alert.alert('Sign up failed', firebaseAuthErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const onDemo = async () => {
    setBusy(true);
    try {
      await signIn('demo@local.app', 'demo');
      router.replace('/');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>Workout</Text>
      <Text style={styles.subtitle}>Your program. Your schedule.</Text>

      {!isFirebaseConfigured ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            Firebase not configured — using local demo mode. Add keys from
            .env.example to enable cloud sync.
          </Text>
          <Pressable style={styles.demoBtn} onPress={onDemo} disabled={busy}>
            <Text style={styles.demoBtnText}>Continue in demo mode</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <Pressable
            style={styles.primaryBtn}
            onPress={onSignIn}
            disabled={busy}
          >
            <Text style={styles.primaryBtnText}>Sign in</Text>
          </Pressable>
          <Pressable style={styles.secondaryBtn} onPress={onSignUp} disabled={busy}>
            <Text style={styles.secondaryBtnText}>Create account</Text>
          </Pressable>
        </>
      )}
    </KeyboardAvoidingView>
  );
}
