import React, { useState, useRef, useEffect } from "react";
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Text,
    TouchableWithoutFeedback,
    ActivityIndicator,
    FlatList,
    SafeAreaView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import Video from "react-native-video";
import Slider from "@react-native-community/slider";
import { MaterialIcons } from "@expo/vector-icons";
import * as ScreenOrientation from "expo-screen-orientation";
import { Colors } from "@/constants/Colors";
import * as NavigationBar from "expo-navigation-bar";
import Subtitles from "./Subtitles";
import { SIZE } from "../../../constants/Constants";

const VideoPlayer = ({ videoUrl, subtitlesData }) => {
    const videoRef = useRef(null);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [isPlaying, setIsPlaying] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [showSubtitleList, setShowSubtitleList] = useState(false);
    const [selectedSubtitle, setSelectedSubtitle] = useState(
        subtitlesData.find((sub) => sub.label.toLowerCase() === "english") ||
            subtitlesData[0] ||
            null
    );

    const [controlsVisible, setControlsVisible] = useState(true);
    let touchStart = 0;

    useEffect(() => {
        return () => {
            ScreenOrientation.lockAsync(
                ScreenOrientation.OrientationLock.PORTRAIT
            );
        };
    }, []);

    const handleTouchStart = (event) => {
        touchStart = event.nativeEvent.pageY;
    };

    const handleTouchEnd = (event) => {
        const touchEnd = event.nativeEvent.pageY;
        const diff = touchEnd - touchStart;

        if (Math.abs(diff) > 20 && isFullScreen) {
            setControlsVisible(!controlsVisible);
        }
    };

    const toggleFullScreen = async () => {
        setIsFullScreen(!isFullScreen);
        if (!isFullScreen) {
            await Promise.all([
                ScreenOrientation.lockAsync(
                    ScreenOrientation.OrientationLock.LANDSCAPE
                ),
                NavigationBar.setVisibilityAsync("hidden"),
                NavigationBar.setBehaviorAsync("overlay"),
                NavigationBar.setBackgroundColorAsync("transparent"),
            ]);
        } else {
            await Promise.all([
                ScreenOrientation.lockAsync(
                    ScreenOrientation.OrientationLock.PORTRAIT
                ),
                NavigationBar.setVisibilityAsync("visible"),
                NavigationBar.setBehaviorAsync("default"),
            ]);
        }
    };
    useEffect(() => {
        return () => {
            ScreenOrientation.lockAsync(
                ScreenOrientation.OrientationLock.PORTRAIT
            );
            NavigationBar.setVisibilityAsync("visible");
            NavigationBar.setBehaviorAsync("default");
        };
    }, []);

    const togglePlayPause = () => {
        setIsPlaying(!isPlaying);
    };

    const skip = (seconds) => {
        const newTime = currentTime + seconds;
        videoRef.current.seek(Math.max(0, Math.min(newTime, duration)));
    };

    const onProgress = (data) => {
        setCurrentTime(data.currentTime);
    };

    const onLoad = (data) => {
        setDuration(data.duration);
    };

    const selectSubtitle = (subtitle) => {
        setSelectedSubtitle(subtitle);
        setShowSubtitleList(false);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
    };

    return (
        <SafeAreaView
            style={[styles.safeArea, isFullScreen && styles.fullScreenSafeArea]}
        >
            <StatusBar hidden={isFullScreen} style="auto" />
            <View style={[styles.container, isFullScreen && styles.fullScreen]}>
                <TouchableWithoutFeedback
                    onPress={() => setShowControls(!showControls)}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >
                    <View style={styles.videoContainer}>
                        <Video
                            ref={videoRef}
                            source={{ uri: videoUrl }}
                            style={styles.video}
                            paused={!isPlaying}
                            onLoad={onLoad}
                            onProgress={onProgress}
                            resizeMode="contain"
                            renderLoader={() => (
                                <ActivityIndicator
                                    size={"large"}
                                    color={Colors.light.tabIconSelected}
                                    style={styles.loader}
                                />
                            )}
                        />
                        <Subtitles
                            textStyle={{
                                fontSize: SIZE(16),
                                backgroundColor: "transparent",
                                color: "#fff",
                            }}
                            containerStyle={{
                                position: "absolute",
                                bottom: SIZE(10),
                                zIndex: 1000,
                                alignSelf: "center",
                                justifyContent: "center",
                            }}
                            currentTime={currentTime}
                            selectedsubtitle={{
                                file: selectedSubtitle?.file,
                            }}
                        />
                        {showControls && (
                            <View style={styles.controlsOverlay}>
                                {/* Play/Pause and Skip Buttons */}
                                <View style={styles.centerControls}>
                                    <TouchableOpacity
                                        hitSlop={10}
                                        onPress={() => skip(-10)}
                                    >
                                        <MaterialIcons
                                            name="replay-10"
                                            size={SIZE(30)}
                                            color={Colors.light.tabIconSelected}
                                        />
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        hitSlop={10}
                                        onPress={togglePlayPause}
                                    >
                                        <MaterialIcons
                                            name={
                                                isPlaying
                                                    ? "pause"
                                                    : "play-arrow"
                                            }
                                            size={SIZE(36)}
                                            color={Colors.light.tabIconSelected}
                                        />
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        hitSlop={10}
                                        onPress={() => skip(10)}
                                    >
                                        <MaterialIcons
                                            name="forward-10"
                                            size={SIZE(30)}
                                            color={Colors.light.tabIconSelected}
                                        />
                                    </TouchableOpacity>
                                </View>

                                {/* Progress Bar and Time */}
                                <View style={styles.progressContainer}>
                                    <Text style={styles.timeText}>
                                        {formatTime(currentTime)}
                                    </Text>
                                    <Slider
                                        hitSlop={20}
                                        style={styles.progressBar}
                                        value={currentTime}
                                        minimumValue={0}
                                        maximumValue={duration}
                                        onSlidingComplete={(value) =>
                                            videoRef.current.seek(value)
                                        }
                                        minimumTrackTintColor={
                                            Colors.light.tabIconSelected
                                        }
                                        maximumTrackTintColor="#4A4A4A"
                                        thumbTintColor={
                                            Colors.light.tabIconSelected
                                        }
                                    />
                                    <Text style={styles.timeText}>
                                        {formatTime(duration)}
                                    </Text>
                                </View>

                                {/* Bottom Controls */}
                                <View style={styles.bottomControls}>
                                    <TouchableOpacity
                                        hitSlop={10}
                                        onPress={() =>
                                            setShowSubtitleList(true)
                                        }
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

                                    <TouchableOpacity
                                        hitSlop={10}
                                        onPress={toggleFullScreen}
                                    >
                                        <MaterialIcons
                                            name={
                                                isFullScreen
                                                    ? "fullscreen-exit"
                                                    : "fullscreen"
                                            }
                                            size={SIZE(24)}
                                            color={Colors.light.tabIconSelected}
                                        />
                                    </TouchableOpacity>
                                </View>

                                {showSubtitleList && (
                                    <View style={styles.modalContainer}>
                                        <FlatList
                                            data={subtitlesData}
                                            keyExtractor={(item) => item.label}
                                            renderItem={({ item }) => (
                                                <TouchableOpacity
                                                    style={[
                                                        styles.subtitleItem,
                                                        {
                                                            backgroundColor:
                                                                selectedSubtitle?.label ==
                                                                item.label
                                                                    ? Colors
                                                                          .light
                                                                          .tabIconSelected
                                                                    : "transparent",
                                                        },
                                                    ]}
                                                    onPress={() =>
                                                        selectSubtitle(item)
                                                    }
                                                >
                                                    <Text
                                                        style={[
                                                            styles.subtitleText,
                                                            {
                                                                color:
                                                                    selectedSubtitle?.label ==
                                                                    item.label
                                                                        ? "#fff"
                                                                        : Colors
                                                                              .light
                                                                              .tabIconSelected,
                                                            },
                                                        ]}
                                                    >
                                                        {item.label}
                                                    </Text>
                                                </TouchableOpacity>
                                            )}
                                        />
                                        <TouchableOpacity
                                            style={styles.closeButton}
                                            onPress={() =>
                                                setShowSubtitleList(false)
                                            }
                                        >
                                            <Text
                                                style={styles.closeButtonText}
                                            >
                                                Close
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>
                </TouchableWithoutFeedback>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    videoContainer: {
        flex: 1,
        position: "relative",
    },
    safeArea: {
        backgroundColor: "#000",
    },
    fullScreenSafeArea: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "#000",
        width: "100%",
        height: "100%",
    },
    container: {
        backgroundColor: "#000",
        height: SIZE(250),
        width: "100%",
    },
    fullScreen: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        height: "100%",
        zIndex: 999999,
        elevation: 999999,
    },
    video: {
        position: "absolute",
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        width: "100%",
        height: "100%",
    },
    loader: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    controlsOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "space-between",
        padding: SIZE(10),
        zIndex: 1000,
    },
    centerControls: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: SIZE(40),
        flex: 1,
        marginTop: SIZE(60),
    },
    progressContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: SIZE(10),
    },
    progressBar: {
        flex: 1,
        marginHorizontal: SIZE(10),
    },
    timeText: {
        color: Colors.light.tabIconSelected,
        fontSize: SIZE(12),
    },
    bottomControls: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: SIZE(10),
    },
    modalContainer: {
        width: SIZE(150),
        height: SIZE(200),
        backgroundColor: "rgba(0, 0, 0, 0.2)",
        position: "absolute",
        top: SIZE(15),
        bottom: 0,
        left: SIZE(10),
        right: 0,
        zIndex: 2000,
        borderRadius: SIZE(10),
    },
    subtitleItem: {
        padding: SIZE(10),
        borderBottomWidth: SIZE(1),
        borderBottomColor: "#444",
        borderRadius: SIZE(8),
    },
    subtitleText: {
        fontSize: SIZE(16),
        backgroundColor: "transparent",
        color: Colors.light.tabIconSelected,
    },
    subtitleContainer: {
        position: "absolute",
        bottom: 0,
        zIndex: 1000,
        alignSelf: "center",
        justifyContent: "center",
    },
    closeButton: {
        marginVertical: SIZE(10),
        padding: SIZE(5),
        backgroundColor: Colors.light.tabIconSelected,
        borderRadius: SIZE(8),
        alignItems: "center",
        marginHorizontal: SIZE(10),
    },
    closeButtonText: {
        color: "#FFFFFF",
        fontSize: SIZE(16),
    },
});

export default VideoPlayer;
