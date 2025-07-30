import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { Slider } from "@react-native-assets/slider";
import React, { useEffect, useCallback } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import { runOnUI } from "react-native-worklets"; // Corrected import
import { ThemedText } from "../../../components/ThemedText";
import { Colors } from "../../../constants/Colors";
import { SIZE } from "../../../constants/Constants";
import LottieView from "lottie-react-native";
import { TouchableRipple } from "react-native-paper";

const Controls = ({
    showControls,
    toggleFullScreen,
    isFullScreen,
    router,
    showQualityList,
    setShowQualityList,
    setShowSubtitleList,
    skip,
    togglePlayPause,
    formatTime,
    isSeeking,
    seekPosition,
    currentTime,
    setIsSeeking,
    setSeekPosition,
    setCurrentTime,
    videoRef,
    duration,
    showSubtitleList,
    selectedSubtitle,
    title,
    selectedEpisode,
    isPlaying,
    nextEpisode,
    prevEpisode,
    onProgress,
    handleSubtitleSync,
    subSyncValue,
    resetControlsTimeout,
    setScreenMode,
    screenMode,
    isLoading,
    showSpeedIndicator,
    selectedEpisodeName,
}) => {
    // Single shared value for all controls opacity
    const controlsOpacity = useSharedValue(1);

    // Optimized animation function with worklet
    const animateControls = (visible) => {
        "worklet";
        const duration = 250; // Faster animation in landscape
        const easing = Easing.out(Easing.ease); // Simpler easing for better performance

        controlsOpacity.value = withTiming(visible ? 1 : 0, {
            duration,
            easing,
        });
    };

    // Custom debounce implementation to avoid external dependency
    const useDebounce = (callback, delay) => {
        const timeoutRef = React.useRef(null);

        return useCallback(
            (...args) => {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = setTimeout(() => {
                    callback(...args);
                }, delay);
            },
            [callback, delay]
        );
    };

    // Debounced animation to prevent excessive calls
    const debouncedAnimateControls = useDebounce(
        (visible) => {
            runOnUI(animateControls)(visible);
        },
        16 // ~60fps throttling
    );

    const toggleScreenMode = () => {
        resetControlsTimeout();
        setScreenMode((prevMode) => {
            switch (prevMode) {
                case "contain":
                    return "cover";
                case "cover":
                    return "stretch";
                case "stretch":
                    return "contain";
                default:
                    return "contain";
            }
        });
    };

    useEffect(() => {
        debouncedAnimateControls(showControls);
    }, [showControls, debouncedAnimateControls]);

    // Single animated style for all controls using fade animation
    const controlsStyle = useAnimatedStyle(() => ({
        opacity: controlsOpacity.value,
        // Use conditional rendering instead of transform for better performance
        pointerEvents: controlsOpacity.value > 0.5 ? "auto" : "none",
    }));

    return (
        <>
            {/* Top Controls */}
            <Animated.View style={[styles.topControls, controlsStyle]}>
                <View style={styles.topLeftSection}>
                    <TouchableRipple
                        rippleColor={Colors.dark.backgroundPress}
                        borderless={true}
                        style={styles.iconButton}
                        hitSlop={10}
                        onPress={() => {
                            if (isFullScreen) {
                                toggleFullScreen();
                            } else {
                                router.back();
                            }
                        }}
                    >
                        <MaterialIcons
                            name="arrow-back"
                            size={SIZE(24)}
                            color={Colors.light.tabIconSelected}
                        />
                    </TouchableRipple>
                    <View style={styles.titleContainer}>
                        <ThemedText
                            numberOfLines={1}
                            type="title"
                            style={[
                                styles.titleText,
                                {
                                    fontSize: isFullScreen
                                        ? SIZE(20)
                                        : SIZE(15),
                                },
                            ]}
                        >
                            {title}
                        </ThemedText>
                        <View>
                            <ThemedText
                                style={[
                                    styles.episodeText,
                                    {
                                        fontSize: isFullScreen
                                            ? SIZE(12)
                                            : SIZE(10),
                                    },
                                ]}
                            >
                                Episode - {selectedEpisode}
                            </ThemedText>
                            <ThemedText
                                type="title"
                                numberOfLines={1}
                                style={[
                                    styles.episodeNameText,
                                    {
                                        fontSize: isFullScreen
                                            ? SIZE(15)
                                            : SIZE(10),
                                    },
                                ]}
                            >
                                {selectedEpisodeName && selectedEpisodeName}
                            </ThemedText>
                        </View>
                    </View>
                </View>
                <View>
                    <TouchableRipple
                        rippleColor={Colors.dark.backgroundPress}
                        borderless={true}
                        style={styles.iconButton}
                        hitSlop={10}
                        onPress={() => {
                            if (showQualityList) {
                                setShowQualityList(false);
                            } else {
                                setShowQualityList(true);
                            }
                            setShowSubtitleList(false);
                        }}
                    >
                        <MaterialIcons
                            name="high-quality"
                            size={SIZE(24)}
                            color={Colors.light.tabIconSelected}
                        />
                    </TouchableRipple>

                    {selectedSubtitle && (
                        <View style={styles.subtitleSyncContainer}>
                            <TouchableRipple
                                rippleColor={Colors.dark.backgroundPress}
                                borderless={true}
                                style={styles.iconButton}
                                hitSlop={20}
                                onPress={() => {
                                    handleSubtitleSync("+");
                                }}
                            >
                                <FontAwesome
                                    name="plus-circle"
                                    size={SIZE(24)}
                                    color={Colors.light.tabIconSelected}
                                />
                            </TouchableRipple>
                            <View>
                                <ThemedText
                                    type="subtitle"
                                    style={styles.syncValueText}
                                >
                                    {subSyncValue}
                                </ThemedText>
                                <ThemedText
                                    type="subtitle"
                                    style={styles.syncLabelText}
                                >
                                    Sub Sync
                                </ThemedText>
                            </View>
                            <TouchableRipple
                                rippleColor={Colors.dark.backgroundPress}
                                borderless={true}
                                style={styles.iconButton}
                                hitSlop={20}
                                onPress={() => {
                                    handleSubtitleSync("-");
                                }}
                            >
                                <FontAwesome
                                    name="minus-circle"
                                    size={SIZE(24)}
                                    color={Colors.light.tabIconSelected}
                                />
                            </TouchableRipple>
                        </View>
                    )}
                </View>
            </Animated.View>

            {/* Loading Indicator - Outside animation scope for better performance */}
            {isLoading && (
                <LottieView
                    source={require("../../../assets/lottie/loader.json")}
                    autoPlay
                    loop
                    style={styles.loadingIndicator}
                />
            )}

            {/* Speed Indicator - Outside animation scope */}
            {showSpeedIndicator && (
                <View style={styles.speedIndicator}>
                    <ThemedText type="subtitle" style={styles.speedText}>
                        2x
                    </ThemedText>
                    <MaterialIcons
                        name="fast-forward"
                        size={SIZE(30)}
                        color={Colors.light.tabIconSelected}
                    />
                </View>
            )}

            {/* Center Controls - Empty but keeping structure */}
            <Animated.View style={[styles.centerControls, controlsStyle]} />

            {/* Progress Bar and Time */}
            <Animated.View
                style={[
                    styles.progressContainer,
                    controlsStyle,
                    {
                        marginBottom: isFullScreen ? SIZE(10) : 0,
                    },
                ]}
            >
                <ThemedText type="subtitle" style={styles.timeText}>
                    {formatTime(isSeeking ? seekPosition : currentTime)}
                </ThemedText>
                <Slider
                    style={styles.progressBar}
                    trackStyle={styles.sliderTrack}
                    value={isSeeking ? seekPosition : currentTime}
                    minimumValue={0}
                    maximumValue={duration}
                    step={1}
                    thumbStyle={styles.sliderThumb}
                    enabled={true}
                    slideOnTap={true}
                    thumbTintColor={Colors.light.tabIconSelected}
                    onValueChange={(value) => {
                        setIsSeeking(true);
                        setCurrentTime(value);
                        setSeekPosition(value);
                        videoRef.current.seek(value);
                        resetControlsTimeout();
                    }}
                    minimumTrackTintColor={Colors.light.tabIconSelected}
                    maximumTrackTintColor={Colors.dark.backgroundPress}
                />
                <ThemedText type="subtitle" style={styles.timeText}>
                    {formatTime(duration)}
                </ThemedText>
            </Animated.View>

            {/* Bottom Controls */}
            <Animated.View
                style={[
                    styles.bottomControls,
                    controlsStyle,
                    {
                        paddingBottom: isFullScreen ? SIZE(20) : 0,
                    },
                ]}
            >
                <TouchableRipple
                    rippleColor={Colors.dark.backgroundPress}
                    borderless={true}
                    style={styles.iconButton}
                    onPress={() => {
                        if (showSubtitleList) {
                            setShowSubtitleList(false);
                        } else {
                            setShowSubtitleList(true);
                        }
                        setShowQualityList(false);
                    }}
                >
                    <MaterialIcons
                        name={
                            selectedSubtitle
                                ? "closed-caption"
                                : "closed-caption-off"
                        }
                        size={24}
                        color={Colors.light.tabIconSelected}
                    />
                </TouchableRipple>

                <View
                    style={[
                        styles.centerPlaybackControls,
                        { width: isFullScreen ? "50%" : "70%" },
                    ]}
                >
                    <TouchableRipple
                        rippleColor={Colors.dark.backgroundPress}
                        borderless={true}
                        style={styles.playbackButton}
                        hitSlop={10}
                        onPress={() => prevEpisode()}
                    >
                        <MaterialIcons
                            name="skip-previous"
                            size={SIZE(30)}
                            color={Colors.light.tabIconSelected}
                        />
                    </TouchableRipple>
                    <TouchableRipple
                        rippleColor={Colors.dark.backgroundPress}
                        borderless={true}
                        style={styles.playbackButton}
                        hitSlop={10}
                        onPress={() => skip(-10)}
                    >
                        <MaterialIcons
                            name="replay-10"
                            size={SIZE(30)}
                            color={Colors.light.tabIconSelected}
                        />
                    </TouchableRipple>
                    <TouchableRipple
                        rippleColor={Colors.dark.backgroundPress}
                        borderless={true}
                        style={styles.playButton}
                        hitSlop={10}
                        onPress={togglePlayPause}
                    >
                        <MaterialIcons
                            name={isPlaying ? "pause" : "play-arrow"}
                            size={SIZE(36)}
                            color={Colors.light.tabIconSelected}
                        />
                    </TouchableRipple>
                    <TouchableRipple
                        rippleColor={Colors.dark.backgroundPress}
                        borderless={true}
                        style={styles.playbackButton}
                        hitSlop={10}
                        onPress={() => skip(10)}
                    >
                        <MaterialIcons
                            name="forward-10"
                            size={SIZE(30)}
                            color={Colors.light.tabIconSelected}
                        />
                    </TouchableRipple>
                    <TouchableRipple
                        rippleColor={Colors.dark.backgroundPress}
                        borderless={true}
                        style={styles.playbackButton}
                        hitSlop={10}
                        onPress={() => nextEpisode()}
                    >
                        <MaterialIcons
                            name="skip-next"
                            size={SIZE(30)}
                            color={Colors.light.tabIconSelected}
                        />
                    </TouchableRipple>
                </View>

                <View style={styles.rightControls}>
                    {isFullScreen && (
                        <TouchableRipple
                            rippleColor={Colors.dark.backgroundPress}
                            borderless={true}
                            style={styles.screenModeButton}
                            hitSlop={10}
                            onPress={() => {
                                toggleScreenMode();
                            }}
                        >
                            <View style={styles.screenModeContainer}>
                                <MaterialIcons
                                    name={"fit-screen"}
                                    size={SIZE(24)}
                                    color={Colors.light.tabIconSelected}
                                />
                                <ThemedText style={styles.screenModeText}>
                                    {screenMode === "stretch"
                                        ? "Stretch"
                                        : screenMode === "contain"
                                        ? "Original"
                                        : "Zoom"}
                                </ThemedText>
                            </View>
                        </TouchableRipple>
                    )}
                    <TouchableRipple
                        rippleColor={Colors.dark.backgroundPress}
                        borderless={true}
                        style={styles.iconButton}
                        hitSlop={10}
                        onPress={toggleFullScreen}
                    >
                        <MaterialIcons
                            name={
                                isFullScreen ? "fullscreen-exit" : "fullscreen"
                            }
                            size={SIZE(24)}
                            color={Colors.light.tabIconSelected}
                        />
                    </TouchableRipple>
                </View>
            </Animated.View>
        </>
    );
};

export default React.memo(Controls);

// Styles remain the same as in the previous version
const styles = StyleSheet.create({
    topControls: {
        paddingHorizontal: SIZE(10),
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    topLeftSection: {
        flexDirection: "row",
        alignItems: "center",
        gap: SIZE(10),
    },
    iconButton: {
        borderRadius: SIZE(24),
    },
    titleContainer: {
        width: "72%",
    },
    titleText: {
        color: Colors.light.tabIconSelected,
        fontSize: SIZE(15),
        textShadowColor: Colors.dark.black,
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    episodeText: {
        color: Colors.light.tabIconSelected,
        textShadowColor: Colors.dark.black,
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
        fontSize: SIZE(10),
    },
    episodeNameText: {
        color: Colors.light.tabIconSelected,
        textShadowColor: Colors.dark.black,
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
        fontSize: SIZE(10),
    },
    subtitleSyncContainer: {
        position: "absolute",
        right: SIZE(50),
        gap: SIZE(10),
        flexDirection: "row",
        height: SIZE(26),
    },
    syncValueText: {
        color: Colors.light.tabIconSelected,
        fontSize: SIZE(13),
        textAlign: "center",
        marginBottom: SIZE(-7),
    },
    syncLabelText: {
        color: Colors.light.tabIconSelected,
        fontSize: SIZE(8),
    },
    loadingIndicator: {
        width: SIZE(40),
        height: SIZE(40),
        alignSelf: "center",
        position: "absolute",
        top: "45%",
        zIndex: 1000,
    },
    speedIndicator: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "center",
        position: "absolute",
        top: "20%",
        zIndex: 1000,
    },
    speedText: {
        color: Colors.light.tabIconSelected,
        textShadowColor: Colors.dark.black,
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    centerControls: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: SIZE(40),
        flex: 1,
        marginTop: SIZE(20),
    },
    progressContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    progressBar: {
        flex: 1,
    },
    sliderTrack: {
        height: SIZE(5),
        borderRadius: SIZE(5),
    },
    sliderThumb: {
        width: SIZE(15),
        height: SIZE(15),
    },
    timeText: {
        color: Colors.light.tabIconSelected,
        fontSize: SIZE(12),
        textAlign: "center",
        width: SIZE(50),
    },
    bottomControls: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: SIZE(10),
    },
    centerPlaybackControls: {
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between",
    },
    playbackButton: {
        borderRadius: SIZE(30),
    },
    playButton: {
        borderRadius: SIZE(36),
    },
    rightControls: {
        flexDirection: "row",
        gap: SIZE(20),
        alignItems: "center",
    },
    screenModeButton: {
        borderRadius: SIZE(5),
        width: SIZE(40),
        marginLeft: SIZE(-60),
    },
    screenModeContainer: {
        alignItems: "center",
    },
    screenModeText: {
        fontSize: SIZE(12),
        color: Colors.light.tabIconSelected,
        marginTop: SIZE(-5),
    },
});
