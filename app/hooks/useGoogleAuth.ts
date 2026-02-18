import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

// Required for web: tells the popup window to send auth result back to parent
WebBrowser.maybeCompleteAuthSession();

const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID!;

export function useGoogleAuth() {
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId,
  });

  return { request, response, promptAsync };
}
