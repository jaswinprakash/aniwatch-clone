import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React, { useEffect } from "react";
import { SIZE } from "../../../constants/Constants";
import { Colors } from "../../../constants/Colors";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
} from "react-native-reanimated";
import { MaterialIcons } from "@expo/vector-icons";
import { ThemedText } from "../../../components/ThemedText";
import { Slider } from "@miblanchard/react-native-slider";

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
}) => {
    const controlsOpacity = useSharedValue(1);
    const controlsTop = useSharedValue(0);
    const controlsBottom = useSharedValue(0);

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
                    <TouchableOpacity
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
                    </TouchableOpacity>
                    <View style={{ width: "80%" }}>
                        <ThemedText
                            numberOfLines={1}
                            type="title"
                            style={{
                                color: Colors.light.tabIconSelected,
                                fontSize: SIZE(15),
                                textShadowColor: "#000",
                                textShadowOffset: { width: 1, height: 1 },
                                textShadowRadius: 2,
                            }}
                        >
                            {title}
                        </ThemedText>
                        <ThemedText
                            style={{
                                color: Colors.light.tabIconSelected,
                                textShadowColor: "#000",
                                textShadowOffset: { width: 1, height: 1 },
                                textShadowRadius: 2,
                            }}
                        >
                            Episode - {selectedEpisode}
                        </ThemedText>
                    </View>
                </View>
                <TouchableOpacity
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
                </TouchableOpacity>
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
                    containerStyle={styles.progressBar}
                    hitSlop={20}
                    value={isSeeking ? seekPosition : currentTime}
                    minimumValue={0}
                    maximumValue={duration}
                    onSlidingStart={(value) => {
                        setIsSeeking(true);
                        setSeekPosition(value[0]);
                    }}
                    onValueChange={(value) => {
                        setSeekPosition(value[0]);
                    }}
                    onSlidingComplete={(value) => {
                        setIsSeeking(false);
                        videoRef.current.seek(value[0]);
                        setCurrentTime(value[0]);
                    }}
                    minimumTrackTintColor={Colors.light.tabIconSelected}
                    maximumTrackTintColor="#4A4A4A"
                    thumbTintColor={Colors.light.tabIconSelected}
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
                <TouchableOpacity
                    hitSlop={10}
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
                </TouchableOpacity>
                <View
                    style={{
                        width: isFullScreen ? "50%" : "70%",
                        alignItems: "center",
                        flexDirection: "row",
                        justifyContent: "space-between",
                    }}
                >
                    <TouchableOpacity
                        hitSlop={10}
                        onPress={() => prevEpisode()}
                    >
                        <MaterialIcons
                            name="skip-previous"
                            size={SIZE(30)}
                            color={Colors.light.tabIconSelected}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity hitSlop={10} onPress={() => skip(-10)}>
                        <MaterialIcons
                            name="replay-10"
                            size={SIZE(30)}
                            color={Colors.light.tabIconSelected}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity hitSlop={10} onPress={togglePlayPause}>
                        <MaterialIcons
                            name={isPlaying ? "pause" : "play-arrow"}
                            size={SIZE(36)}
                            color={Colors.light.tabIconSelected}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity hitSlop={10} onPress={() => skip(10)}>
                        <MaterialIcons
                            name="forward-10"
                            size={SIZE(30)}
                            color={Colors.light.tabIconSelected}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        hitSlop={10}
                        onPress={() => nextEpisode()}
                    >
                        <MaterialIcons
                            name="skip-next"
                            size={SIZE(30)}
                            color={Colors.light.tabIconSelected}
                        />
                    </TouchableOpacity>
                </View>
                <TouchableOpacity hitSlop={10} onPress={toggleFullScreen}>
                    <MaterialIcons
                        name={isFullScreen ? "fullscreen-exit" : "fullscreen"}
                        size={SIZE(24)}
                        color={Colors.light.tabIconSelected}
                    />
                </TouchableOpacity>
            </Animated.View>
        </>
    );
};

export default Controls;

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
