import React, { useEffect } from "react";
import { TouchableOpacity, Text, StyleSheet, Alert } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { signInWithGoogle, signOutGoogle } from "../lib/googleAuth";
import { setAuthState, syncWithSupabase } from "../store/playbackSlice";
import { supabase } from "../lib/supabase";
import { SIZE } from "@/constants/Constants";

const GoogleSignInButton = () => {
    const dispatch = useDispatch();
    const { isAuthenticated, user } = useSelector((state) => state.playback);

    useEffect(() => {
        // Listen for auth state changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            dispatch(
                setAuthState({
                    isAuthenticated: !!session,
                    user: session?.user || null,
                })
            );

            if (event === "SIGNED_IN" && session) {
                // Sync data when user signs in
                try {
                    await dispatch(syncWithSupabase()).unwrap();
                    Alert.alert("Success", "Signed in and data synced!");
                } catch (error) {
                    Alert.alert(
                        "Warning",
                        "Signed in but sync failed. Data will sync later."
                    );
                }
            }

            if (event === "SIGNED_OUT") {
                Alert.alert("Success", "Signed out successfully!");
            }
        });

        return () => subscription.unsubscribe();
    }, [dispatch]);

    const handleSignIn = async () => {
        const result = await signInWithGoogle();

        if (!result.success) {
            Alert.alert("Error", result.error);
        }
    };

    const handleSignOut = async () => {
        Alert.alert("Sign Out", "Are you sure you want to sign out?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Sign Out",
                style: "destructive",
                onPress: async () => {
                    const result = await signOutGoogle();

                    if (!result.success) {
                        Alert.alert("Error", result.error);
                    }
                },
            },
        ]);
    };

    const handlePress = () => {
        if (isAuthenticated) {
            handleSignOut();
        } else {
            handleSignIn();
        }
    };

    return (
        <TouchableOpacity
            style={[
                styles.button,
                isAuthenticated ? styles.signOutButton : styles.signInButton,
            ]}
            onPress={handlePress}
        >
            <Text numberOfLines={2} style={styles.buttonText}>
                {isAuthenticated
                    ? `Sign out (${user?.email || "User"})`
                    : "Sign in with Google"}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        paddingHorizontal: SIZE(12),
        paddingVertical: SIZE(12),
        borderRadius: SIZE(8),
        alignItems: "center",
        marginVertical: SIZE(10),
        width: "90%",
        alignSelf: "center",
    },
    signInButton: {
        backgroundColor: "#4285F4",
    },
    signOutButton: {
        backgroundColor: "#EA4335", // Red color for sign out
    },
    buttonText: {
        color: "white",
        fontSize: SIZE(16),
        fontWeight: "600",
        fontFamily: "Exo2Regular",
    },
});

export default GoogleSignInButton;
