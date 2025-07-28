import {
    GoogleSignin,
    statusCodes,
} from "@react-native-google-signin/google-signin";
import { supabase } from "./supabase";
import { Platform } from "react-native";

// Generate a secure nonce for iOS
const generateNonce = () => {
    const charset =
        "0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._";
    let result = "";
    let remainingLength = 32;

    while (remainingLength > 0) {
        const randomBytes = new Uint8Array(
            Math.ceil((remainingLength * 3) / 4)
        );
        crypto.getRandomValues(randomBytes);

        for (let i = 0; i < randomBytes.length && remainingLength > 0; i++) {
            const byte = randomBytes[i];
            if (byte < charset.length) {
                result += charset[byte];
                remainingLength--;
            }
        }
    }

    return result;
};

GoogleSignin.configure({
    webClientId:
        "473935740233-tn9mkjv2jqbqb80v3i2id2733u25agjr.apps.googleusercontent.com", // From Google Cloud Console (Web)
    iosClientId:
        "473935740233-ao2prlvnb0b68csriousq0sml4o21hkf.apps.googleusercontent.com", // From Google Cloud Console (iOS)
    offlineAccess: true,
});

export const signInWithGoogle = async () => {
    try {
        await GoogleSignin.hasPlayServices();

        let nonce = null;
        let userInfo = null;

        if (Platform.OS === "ios") {
            // Generate nonce for iOS
            nonce = generateNonce();

            // Sign in with nonce
            userInfo = await GoogleSignin.signIn({
                nonce: nonce,
            });
        } else {
            // Android doesn't need nonce handling
            userInfo = await GoogleSignin.signIn();
        }

        // Sign in to Supabase with proper nonce handling
        const { data, error } = await supabase.auth.signInWithIdToken({
            provider: "google",
            token: userInfo.data.idToken,
            nonce: nonce, // Pass the nonce for verification
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, data };
    } catch (error) {
        console.error("Google sign-in error:", error);

        if (error.code === statusCodes.SIGN_IN_CANCELLED) {
            return { success: false, error: "Sign-in cancelled" };
        } else if (error.code === statusCodes.IN_PROGRESS) {
            return { success: false, error: "Sign-in in progress" };
        } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
            return { success: false, error: "Play services not available" };
        }

        return { success: false, error: "Unknown error occurred" };
    }
};

// Add this sign-out function
export const signOutGoogle = async () => {
    try {
        await GoogleSignin.signOut();
        await supabase.auth.signOut();
        return { success: true };
    } catch (error) {
        console.error("Sign-out error:", error);
        return { success: false, error: error.message };
    }
};
