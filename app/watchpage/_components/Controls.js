import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import { ThemedText } from "../../../components/ThemedText";
import { Colors } from "../../../constants/Colors";
import { SIZE } from "../../../constants/Constants";
import { Slider } from "@react-native-assets/slider";

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
}) => {
    const controlsOpacity = useSharedValue(1);
    const controlsTop = useSharedValue(0);
    const controlsBottom = useSharedValue(0);

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

    const animateControls = (visible) => {
        controlsOpacity.value = withTiming(visible ? 1 : 0, {
            duration: 300,
            easing: Easing.inOut(Easing.ease),
        });
        controlsTop.value = withTiming(visible ? 0 : -100, {
            duration: 300,
            easing: Easing.inOut(Easing.ease),
        });
        controlsBottom.value = withTiming(visible ? 0 : 100, {
            duration: 300,
            easing: Easing.inOut(Easing.ease),
        });
    };

    useEffect(() => {
        animateControls(showControls);
    }, [showControls]);

    // Animated styles
    const topControlsStyle = useAnimatedStyle(() => ({
        opacity: controlsOpacity.value,
        transform: [{ translateY: controlsTop.value }],
    }));

    const bottomControlsStyle = useAnimatedStyle(() => ({
        opacity: controlsOpacity.value,
        transform: [{ translateY: controlsBottom.value }],
    }));

    const centerControlsStyle = useAnimatedStyle(() => ({
        opacity: controlsOpacity.value,
    }));

    return (
        <>
            <Animated.View
                style={[
                    {
                        padding: SIZE(10),
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                    },
                    topControlsStyle,
                ]}
            >
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: SIZE(10),
                    }}
                >
                    <TouchableRipple
                        rippleColor={Colors.dark.backgroundPress}
                        borderless={true}
                        style={{ borderRadius: SIZE(24) }}
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
                    <View style={{ width: "72%" }}>
                        <ThemedText
                            numberOfLines={1}
                            type="title"
                            style={{
                                color: Colors.light.tabIconSelected,
                                fontSize: SIZE(15),
                                textShadowColor: Colors.dark.black,
                                textShadowOffset: { width: 1, height: 1 },
                                textShadowRadius: 2,
                            }}
                        >
                            {title}
                        </ThemedText>
                        <ThemedText
                            style={{
                                color: Colors.light.tabIconSelected,
                                textShadowColor: Colors.dark.black,
                                textShadowOffset: { width: 1, height: 1 },
                                textShadowRadius: 2,
                            }}
                        >
                            Episode - {selectedEpisode}
                        </ThemedText>
                    </View>
                </View>
                <View>
                    <TouchableRipple
                        rippleColor={Colors.dark.backgroundPress}
                        borderless={true}
                        style={{ borderRadius: SIZE(24) }}
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
                    <View
                        style={{
                            position: "absolute",
                            right: SIZE(50),
                            gap: SIZE(10),
                            bottom: SIZE(-10),
                            flexDirection: "row",
                            alignItems: "center",
                        }}
                    >
                        <TouchableRipple
                            rippleColor={Colors.dark.backgroundPress}
                            borderless={true}
                            style={{ borderRadius: SIZE(24) }}
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
                                style={{
                                    color: Colors.light.tabIconSelected,
                                    fontSize: SIZE(15),
                                    textAlign: "center",
                                    marginBottom: SIZE(-5),
                                }}
                            >
                                {subSyncValue}
                            </ThemedText>
                            <ThemedText
                                type="subtitle"
                                style={{
                                    color: Colors.light.tabIconSelected,
                                    fontSize: SIZE(8),
                                }}
                            >
                                Sub Sync
                            </ThemedText>
                        </View>
                        <TouchableRipple
                            rippleColor={Colors.dark.backgroundPress}
                            borderless={true}
                            style={{ borderRadius: SIZE(24) }}
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
                </View>
            </Animated.View>
            {/* Play/Pause and Skip Buttons */}
            <Animated.View
                style={[styles.centerControls, centerControlsStyle]}
            ></Animated.View>

            {/* Progress Bar and Time */}
            <Animated.View
                style={[styles.progressContainer, bottomControlsStyle]}
            >
                <ThemedText type="subtitle" style={styles.timeText}>
                    {formatTime(isSeeking ? seekPosition : currentTime)}
                </ThemedText>
                <Slider
                    style={styles.progressBar}
                    trackStyle={{
                        height: SIZE(5),
                        borderRadius: SIZE(5),
                    }}
                    value={currentTime}
                    minimumValue={0}
                    maximumValue={duration}
                    step={1}
                    thumbStyle={{
                        width: SIZE(15),
                        height: SIZE(15),
                    }}
                    enabled={true}
                    slideOnTap={true}
                    thumbTintColor={Colors.light.tabIconSelected}
                    onValueChange={(value) => {
                        setCurrentTime(value);
                        setSeekPosition(value);
                        videoRef.current.seek(value);
                        resetControlsTimeout();
                    }}
                    minimumTrackTintColor={Colors.light.tabIconSelected}
                    maximumTrackTintColor={"#4A4A4A"}
                />
                <ThemedText type="subtitle" style={styles.timeText}>
                    {formatTime(duration)}
                </ThemedText>
            </Animated.View>

            {/* Bottom Controls */}
            <Animated.View
                style={[
                    styles.bottomControls,
                    bottomControlsStyle,
                    {
                        paddingBottom: isFullScreen ? SIZE(20) : 0,
                    },
                ]}
            >
                <TouchableRipple
                    rippleColor={Colors.dark.backgroundPress}
                    borderless={true}
                    style={{ borderRadius: SIZE(24) }}
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
                    style={{
                        width: isFullScreen ? "50%" : "70%",
                        alignItems: "center",
                        flexDirection: "row",
                        justifyContent: "space-between",
                    }}
                >
                    <TouchableRipple
                        rippleColor={Colors.dark.backgroundPress}
                        borderless={true}
                        style={{ borderRadius: SIZE(30) }}
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
                        style={{ borderRadius: SIZE(30) }}
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
                        style={{ borderRadius: SIZE(36) }}
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
                        style={{ borderRadius: SIZE(30) }}
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
                        style={{ borderRadius: SIZE(30) }}
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
                <View
                    style={{
                        flexDirection: "row",
                        gap: SIZE(20),
                        // alignItems: "center",
                    }}
                >
                    {isFullScreen && (
                        <TouchableRipple
                            rippleColor={Colors.dark.backgroundPress}
                            borderless={true}
                            style={{
                                borderRadius: SIZE(5),
                                width: SIZE(40),
                                marginLeft: SIZE(-60),
                            }}
                            hitSlop={10}
                            onPress={() => {
                                toggleScreenMode();
                            }}
                        >
                            <View style={{ alignItems: "center" }}>
                                <MaterialIcons
                                    name={"fit-screen"}
                                    size={SIZE(24)}
                                    color={Colors.light.tabIconSelected}
                                />
                                <ThemedText
                                    style={{
                                        fontSize: SIZE(12),
                                        color: Colors.light.tabIconSelected,
                                        marginTop: SIZE(-5),
                                    }}
                                >
                                    {screenMode === "stretch"
                                        ? "Stretch"
                                        : screenMode === "contain"
                                        ? "Original"
                                        : "Zoom Fit"}
                                </ThemedText>
                            </View>
                        </TouchableRipple>
                    )}
                    <TouchableRipple
                        rippleColor={Colors.dark.backgroundPress}
                        borderless={true}
                        style={{ borderRadius: SIZE(24) }}
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

const styles = StyleSheet.create({
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
});
