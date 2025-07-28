import {
    GoogleSignin,
    statusCodes,
} from "@react-native-google-signin/google-signin";
import { supabase } from "./supabase";
import { saveUserProfile } from "../store/storage"; // Add this import

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
        const userInfo = await GoogleSignin.signIn();

        const userProfile = {
            name: userInfo.data.user.name,
            photo: userInfo.data.user.photo,
            email: userInfo.data.user.email, // Also save email
            id: userInfo.data.user.id, // And user ID if needed
            lastUpdated: new Date().toISOString(),
        };

        saveUserProfile(userProfile);

        const { data, error } = await supabase.auth.signInWithIdToken({
            provider: "google",
            token: userInfo.data.idToken,
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, data, userProfile };
    } catch (error) {
        console.log("Google sign-in error:", error);

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
