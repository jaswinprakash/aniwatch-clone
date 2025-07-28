import React, { useEffect, useState } from "react";
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    Image,
    View,
    ActivityIndicator,
    Pressable,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { signInWithGoogle, signOutGoogle } from "../lib/googleAuth";
import {
    setAuthState,
    setUserProfile,
    syncWithSupabase,
} from "../store/playbackSlice";
import { supabase } from "../lib/supabase";
import { SIZE } from "@/constants/Constants";
import { getUserProfile } from "@/store/storage";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";

const GoogleSignInButton = () => {
    const dispatch = useDispatch();
    const { isAuthenticated, user } = useSelector((state) => state.playback);
    const userProfile = useSelector((state) => state.playback.userProfile);

    const [loadingState, setLoadingState] = useState("idle");

    // Animation values
    const buttonWidth = useSharedValue(120);
    const buttonOpacity = useSharedValue(1);

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
                const storedProfile = getUserProfile();
                if (storedProfile) {
                    dispatch(setUserProfile(storedProfile));
                }

                setLoadingState("syncing");

                try {
                    await dispatch(syncWithSupabase()).unwrap();
                    console.log("Success: Signed in and data synced!");
                } catch (error) {
                    console.log(
                        "Warning: Signed in but sync failed. Data will sync later."
                    );
                }

                setLoadingState("idle");
            }

            if (event === "SIGNED_OUT") {
                dispatch(setUserProfile(null));
                setLoadingState("idle");
                console.log("Success: Signed out successfully!");
            }
        });

        return () => subscription.unsubscribe();
    }, [dispatch]);

    // Update width based on content
    useEffect(() => {
        let targetWidth = 120;

        switch (loadingState) {
            case "signing-in":
                targetWidth = 140;
                break;
            case "syncing":
                targetWidth = 110;
                break;
            case "signing-out":
                targetWidth = 150;
                break;
            default:
                if (isAuthenticated && userProfile) {
                    const nameLength = userProfile.name?.length || 0;
                    targetWidth = Math.max(
                        120,
                        Math.min(200, 80 + nameLength * 8)
                    );
                } else {
                    targetWidth = 120;
                }
        }

        buttonWidth.value = withSpring(targetWidth, {
            damping: 15,
            stiffness: 100,
        });
    }, [loadingState, isAuthenticated, userProfile]);

    // Animated styles
    const animatedButtonStyle = useAnimatedStyle(() => {
        return {
            width: buttonWidth.value,
            opacity: buttonOpacity.value,
        };
    });

    const handleSignIn = async () => {
        setLoadingState("signing-in");

        const result = await signInWithGoogle();

        if (!result.success) {
            console.log("Error:", result.error);
            setLoadingState("idle");
        }
    };

    const handleSignOut = async () => {
        setLoadingState("signing-out");

        const result = await signOutGoogle();

        if (!result.success) {
            console.log("Error:", result.error);
        }
    };

    // Handle press - only for sign in and non-authenticated states
    const handlePress = () => {
        if (loadingState !== "idle") return;

        // Only handle sign in, not sign out (sign out is handled by icon press)
        if (!isAuthenticated) {
            handleSignIn();
        }
    };

    // Handle sign out icon press specifically
    const handleSignOutPress = () => {
        if (loadingState !== "idle") return;
        handleSignOut();
    };

    const renderContent = () => {
        switch (loadingState) {
            case "signing-in":
                return (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator
                            size="small"
                            color="white"
                            style={styles.loader}
                        />
                        <Text style={styles.loadingText}>Signing in</Text>
                    </View>
                );

            case "syncing":
                return (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator
                            size="small"
                            color="white"
                            style={styles.loader}
                        />
                        <Text style={styles.loadingText}>Syncing</Text>
                    </View>
                );

            case "signing-out":
                return (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator
                            size="small"
                            color="white"
                            style={styles.loader}
                        />
                        <Text style={styles.loadingText}>Signing out</Text>
                    </View>
                );

            default:
                if (isAuthenticated && userProfile) {
                    return (
                        <View style={styles.signedInContainer}>
                            <Image
                                style={styles.userAvatar}
                                source={{ uri: userProfile.photo }}
                            />
                            <Text style={styles.userName} numberOfLines={1}>
                                {userProfile.name}
                            </Text>
                            <Pressable
                                style={styles.logoutIconContainer}
                                onPress={handleSignOutPress}
                                hitSlop={8} // Increase touch area
                            >
                                <Ionicons
                                    name="log-out-outline"
                                    size={SIZE(14)}
                                    color="white"
                                />
                            </Pressable>
                        </View>
                    );
                } else {
                    return (
                        <Text style={styles.buttonText}>Sign in to sync</Text>
                    );
                }
        }
    };

    // Get button background color based on state
    const getButtonStyle = () => {
        if (loadingState === "syncing") {
            return styles.syncingButton; // Green background
        } else if (isAuthenticated) {
            return styles.signedInButton; // Light blue background
        } else {
            return styles.signInButton; // Blue background
        }
    };

    return (
        <Animated.View style={[styles.buttonContainer, animatedButtonStyle]}>
            <TouchableOpacity
                style={[
                    styles.button,
                    getButtonStyle(),
                    loadingState !== "idle" &&
                        loadingState !== "syncing" &&
                        styles.loadingButton,
                ]}
                onPress={handlePress}
                disabled={loadingState !== "idle"}
                activeOpacity={0.8}
            >
                {renderContent()}
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    buttonContainer: {
        alignSelf: "flex-start",
        marginLeft: SIZE(16),
        marginVertical: SIZE(8),
    },
    button: {
        paddingHorizontal: SIZE(8),
        paddingVertical: SIZE(8),
        borderRadius: SIZE(25),
        alignItems: "center",
        justifyContent: "center",
        height: SIZE(40),
        flexDirection: "row",
    },
    signInButton: {
        backgroundColor: Colors.dark.tabIconSelected, // Blue for sign in
    },
    signedInButton: {
        backgroundColor: Colors.dark.tabIconSelected, // Light blue for signed in state
    },
    syncingButton: {
        backgroundColor: "#4CAF50", // Green for syncing
    },
    loadingButton: {
        opacity: 0.8,
    },
    loadingContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    loader: {
        marginRight: SIZE(6),
    },
    loadingText: {
        color: "white",
        fontSize: SIZE(12),
        fontWeight: "500",
        fontFamily: "Exo2Bold",
    },
    signedInContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        flex: 1,
    },
    userAvatar: {
        width: SIZE(28),
        height: SIZE(28),
        borderRadius: SIZE(24),
        marginRight: SIZE(6),
        borderWidth: SIZE(1),
        borderColor: "white",
        alignItems: "center",
        justifyContent: "center",
    },
    userName: {
        color: "white",
        fontSize: SIZE(12),
        fontWeight: "600",
        fontFamily: "Exo2Bold",
        flex: 1,
        textAlign: "center",
    },
    logoutIconContainer: {
        backgroundColor: "#EA4335", // Red background for logout icon
        borderRadius: SIZE(14),
        // padding: SIZE(5),
        height: SIZE(28),
        width: SIZE(28),
        marginLeft: SIZE(4),
        alignItems: "center",
        justifyContent: "center",
    },
    buttonText: {
        fontSize: SIZE(12),
        fontWeight: "600",
        fontFamily: "Exo2Bold",
        textAlign: "center",
        color: "white",
    },
});

export default GoogleSignInButton;
