import { GoogleSignin, isSuccessResponse } from "@react-native-google-signin/google-signin";
import { AuthCredential, GoogleAuthProvider, User, UserCredential, linkWithCredential, signInWithCredential } from "firebase/auth";
import { Platform } from "react-native";
import { auth } from "./firebase";

// OAuth client IDs from the Firebase project. The iOS one is CLIENT_ID in the iOS app's
// GoogleService-Info.plist (its reversed form is a URL scheme in Info.plist). Android
// will also need the web client ID (Authentication > Sign-in method > Google).
export const GOOGLE_IOS_CLIENT_ID = "967442204309-in2io4t6746h4ai3idl2qssh4oeej59b.apps.googleusercontent.com";
export const GOOGLE_WEB_CLIENT_ID: string | undefined = undefined;

GoogleSignin.configure({ iosClientId: GOOGLE_IOS_CLIENT_ID, webClientId: GOOGLE_WEB_CLIENT_ID });

/** Shows Google's account picker. Resolves null if the user cancels. */
export async function getGoogleCredential(): Promise<AuthCredential | null> {
  if (Platform.OS === "android") await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();
  if (!isSuccessResponse(response)) return null;
  if (!response.data.idToken) throw new Error("Google sign-in returned no ID token.");
  return GoogleAuthProvider.credential(response.data.idToken);
}

/**
 * Signs in with Google. An anonymous session is upgraded in place (same uid), so
 * solutions posted before signing in stay attributed; if that Google account
 * already exists, we just sign in to it. Resolves null if the user cancels.
 *
 * Throws auth/account-exists-with-different-credential when the email already has
 * a password account Firebase won't merge automatically (non-Gmail addresses);
 * the error carries the credential so it can be linked after a password sign-in.
 */
export async function signInWithGoogle(): Promise<UserCredential | null> {
  const credential = await getGoogleCredential();
  if (!credential) return null;

  const current = auth.currentUser;
  if (current?.isAnonymous) {
    try {
      return await linkWithCredential(current, credential);
    } catch (error: any) {
      if (error.code !== "auth/credential-already-in-use") throw error;
      return signInWithCredential(auth, GoogleAuthProvider.credentialFromError(error) ?? credential);
    }
  }
  return signInWithCredential(auth, credential);
}

export function usesPassword(user: User) {
  return user.providerData.some(provider => provider.providerId === "password");
}

/** Forgets the Google account choice, so the picker shows again next time. */
export function signOutOfGoogle() {
  return GoogleSignin.signOut().catch(() => { });
}
