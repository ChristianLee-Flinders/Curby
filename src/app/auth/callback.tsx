import { Redirect } from 'expo-router';

/** Landing route for the OAuth deep link. The code exchange itself happens in signInWithGoogle(). */
export default function AuthCallback() {
  return <Redirect href="/" />;
}
