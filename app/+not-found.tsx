import { Redirect } from 'expo-router';

/** Bare scheme opens (workout:///) and stale deep links fall back to index. */
export default function NotFound() {
  return <Redirect href="/" />;
}
