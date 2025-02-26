import React, { useState, useRef, useEffect, useCallback } from "react";
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Text,
    TouchableWithoutFeedback,
    ActivityIndicator,
    FlatList,
    SafeAreaView,
    BackHandler,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import Video from "react-native-video";
// import Slider from "@react-native-community/slider";
import { Slider } from "@miblanchard/react-native-slider";

import { MaterialIcons } from "@expo/vector-icons";
import * as ScreenOrientation from "expo-screen-orientation";
import { Colors } from "@/constants/Colors";
import * as NavigationBar from "expo-navigation-bar";
import Subtitles from "./Subtitles";
import { SIZE } from "../../../constants/Constants";
import { router } from "expo-router";
import { useFullscreen } from "../../../hooks/FullScreenContext";
import throttle from "lodash.throttle";
import useDeviceOrientation from "../../../hooks/useDeviceOrientation";
import { ThemedText } from "../../../components/ThemedText";

const VideoPlayer = ({
    videoUrl,
    subtitlesData,
    availableQualities,
    title,
    initialPlaybackTime = 0,
    onPlaybackTimeUpdate,
}) => {
    const videoRef = useRef(null);
    const { setIsFullscreenContext } = useFullscreen();
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [isPlaying, setIsPlaying] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [showSubtitleList, setShowSubtitleList] = useState(false);
    const [selectedSubtitle, setSelectedSubtitle] = useState(
        subtitlesData.find((sub) => sub?.label?.toLowerCase() === "english") ||
            subtitlesData[0] ||
            null
    );
    const [isSeeking, setIsSeeking] = useState(false);
    const [seekPosition, setSeekPosition] = useState(0);
    const [controlsVisible, setControlsVisible] = useState(true);
    const [selectedQuality, setSelectedQuality] = useState("auto");
    const [showQualityList, setShowQualityList] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    let touchStart = 0;

    useEffect(() => {
        return () => {
            ScreenOrientation.lockAsync(
                ScreenOrientation.OrientationLock.PORTRAIT
            );
        };
    }, []);

    useEffect(() => {
        const backAction = () => {
            if (isFullScreen) {
                toggleFullScreen();
            } else {
                router.back();
            }
            return true;
        };

        const backHandler = BackHandler.addEventListener(
            "hardwareBackPress",
            backAction
        );

        return () => {
            backHandler.remove();
        };
    }, [isFullScreen]);

    // useEffect(() => {
    //     if (showControls && !showQualityList && !showSubtitleList) {
    //         const timeout = setTimeout(() => {
    //             setShowControls(false);
    //         }, 2000);

    //         return () => clearTimeout(timeout);
    //     }
    // }, [showControls, showQualityList, showSubtitleList]);

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
        setIsFullscreenContext(!isFullScreen);
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
                NavigationBar.setBackgroundColorAsync("#000"),
            ]);
        }
    };

    // const toggleFullScreen2 = useCallback(
    //     async (forceFullScreen = null) => {
    //         const newFullScreenState = forceFullScreen ?? !isFullScreen;
    //         setIsFullScreen(newFullScreenState);
    //         setIsFullscreenContext(newFullScreenState);

    //         if (newFullScreenState) {
    //             await Promise.all([
    //                 ScreenOrientation.lockAsync(
    //                     ScreenOrientation.OrientationLock.LANDSCAPE
    //                 ),
    //                 NavigationBar.setVisibilityAsync("hidden"),
    //                 NavigationBar.setBehaviorAsync("overlay"),
    //                 NavigationBar.setBackgroundColorAsync("transparent"),
    //             ]);
    //         } else {
    //             await Promise.all([
    //                 ScreenOrientation.lockAsync(
    //                     ScreenOrientation.OrientationLock.PORTRAIT
    //                 ),
    //                 NavigationBar.setVisibilityAsync("visible"),
    //                 NavigationBar.setBehaviorAsync("default"),
    //                 NavigationBar.setBackgroundColorAsync("#000"),
    //             ]);
    //         }
    //     },
    //     [isFullScreen]
    // );
    // useDeviceOrientation(toggleFullScreen2);

    useEffect(() => {
        return () => {
            ScreenOrientation.lockAsync(
                ScreenOrientation.OrientationLock.PORTRAIT
            );
            NavigationBar.setVisibilityAsync("visible");
            NavigationBar.setBehaviorAsync("default");
            NavigationBar.setBackgroundColorAsync("#000");
        };
    }, []);

    const togglePlayPause = () => {
        setIsPlaying(!isPlaying);
    };

    const skip = (seconds) => {
        const newTime = currentTime + seconds;
        videoRef.current.seek(Math.max(0, Math.min(newTime, duration)));
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

    const onSlidingStart = (value) => {
        setIsSeeking(true);
        setSeekPosition(value);
    };

    const onSlidingComplete = (value) => {
        setCurrentTime(value);
        videoRef.current.seek(value);
        setIsSeeking(false);
    };

    const onProgress = useRef(
        throttle((data) => {
            if (!isSeeking) {
                setCurrentTime(data.currentTime);
                if (onPlaybackTimeUpdate) {
                    onPlaybackTimeUpdate(data.currentTime);
                }
            }
        }, 1000)
    ).current;

    const onLoad = (data) => {
        setDuration(data.duration);
        if (initialPlaybackTime > 0) {
            videoRef.current.seek(initialPlaybackTime);
        }
    };

    const changeQuality = (resolution) => {
        setSelectedQuality(resolution);
        setShowQualityList(false);
    };

    return (
        <>
            <StatusBar hidden={isFullScreen} style="auto" />
            <View style={[styles.container, isFullScreen && styles.fullScreen]}>
                <TouchableWithoutFeedback
                    onPress={() => {
                        setShowControls(!showControls);
                    }}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >
                    <View style={styles.videoContainer}>
                        {isLoading && (
                            <ActivityIndicator
                                size={"large"}
                                color={Colors.light.tabIconSelected}
                                style={styles.loader}
                            />
                        )}
                        <Video
                            onBuffer={(data) => {
                                if (data.isBuffering) {
                                    setIsLoading(true);
                                } else {
                                    setIsLoading(false);
                                }
                            }}
                            ref={videoRef}
                            source={{ uri: videoUrl, type: "m3u8" }}
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
                            selectedVideoTrack={{
                                type:
                                    selectedQuality === "auto"
                                        ? "auto"
                                        : "resolution",
                                value:
                                    selectedQuality === "auto"
                                        ? undefined
                                        : selectedQuality,
                            }}
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

                        <View
                            style={[
                                styles.controlsOverlay,
                                {
                                    top: showControls ? 0 : 1000,
                                },
                            ]}
                        >
                            <View
                                style={{
                                    padding: SIZE(10),
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                }}
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
                                            size={24}
                                            color={Colors.light.tabIconSelected}
                                        />
                                    </TouchableOpacity>
                                    <ThemedText
                                        type="title"
                                        style={{
                                            color: Colors.light.tabIconSelected,
                                            fontSize: SIZE(15),
                                        }}
                                    >
                                        {title}
                                    </ThemedText>
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
                                        size={24}
                                        color={Colors.light.tabIconSelected}
                                    />
                                </TouchableOpacity>
                            </View>
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
                                            isPlaying ? "pause" : "play-arrow"
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
                                <ThemedText
                                    type="subtitle"
                                    style={styles.timeText}
                                >
                                    {formatTime(
                                        isSeeking ? seekPosition : currentTime
                                    )}
                                </ThemedText>
                                <Slider
                                    containerStyle={styles.progressBar}
                                    hitSlop={20}
                                    value={
                                        isSeeking ? seekPosition : currentTime
                                    }
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
                                    minimumTrackTintColor={
                                        Colors.light.tabIconSelected
                                    }
                                    maximumTrackTintColor="#4A4A4A"
                                    thumbTintColor={
                                        Colors.light.tabIconSelected
                                    }
                                />
                                <ThemedText
                                    type="subtitle"
                                    style={styles.timeText}
                                >
                                    {formatTime(duration)}
                                </ThemedText>
                            </View>

                            {/* Bottom Controls */}
                            <View style={styles.bottomControls}>
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
                            {showQualityList && (
                                <View style={[styles.modalContainer]}>
                                    <FlatList
                                        data={availableQualities}
                                        keyExtractor={(item, index) =>
                                            index.toString()
                                        }
                                        renderItem={({ item }) => (
                                            <TouchableOpacity
                                                style={[
                                                    styles.subtitleItem,
                                                    {
                                                        backgroundColor:
                                                            selectedQuality ==
                                                            item
                                                                ? Colors.light
                                                                      .tabIconSelected
                                                                : "transparent",
                                                    },
                                                ]}
                                                onPress={() =>
                                                    changeQuality(item)
                                                }
                                            >
                                                <ThemedText
                                                    type="default"
                                                    style={[
                                                        styles.subtitleText,
                                                        {
                                                            color:
                                                                selectedQuality ==
                                                                item
                                                                    ? "#fff"
                                                                    : Colors
                                                                          .light
                                                                          .tabIconSelected,
                                                        },
                                                    ]}
                                                >
                                                    {item}
                                                </ThemedText>
                                            </TouchableOpacity>
                                        )}
                                    />
                                    <TouchableOpacity
                                        style={styles.closeButton}
                                        onPress={() =>
                                            setShowQualityList(false)
                                        }
                                    >
                                        <ThemedText
                                            type="default"
                                            style={styles.closeButtonText}
                                        >
                                            Close
                                        </ThemedText>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {showSubtitleList && (
                                <View style={styles.modalContainer}>
                                    <FlatList
                                        data={subtitlesData}
                                        keyExtractor={(item, index) =>
                                            index.toString()
                                        }
                                        renderItem={({ item }) => (
                                            <TouchableOpacity
                                                style={[
                                                    styles.subtitleItem,
                                                    {
                                                        backgroundColor:
                                                            selectedSubtitle?.label ==
                                                            item.label
                                                                ? Colors.light
                                                                      .tabIconSelected
                                                                : "transparent",
                                                    },
                                                ]}
                                                onPress={() =>
                                                    selectSubtitle(item)
                                                }
                                            >
                                                <ThemedText
                                                    type="default"
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
                                                </ThemedText>
                                            </TouchableOpacity>
                                        )}
                                    />
                                    <TouchableOpacity
                                        style={styles.closeButton}
                                        onPress={() =>
                                            setShowSubtitleList(false)
                                        }
                                    >
                                        <ThemedText type="default" style={styles.closeButtonText}>
                                            Close
                                        </ThemedText>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </View>
        </>
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
        zIndex: 10000000,
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
        padding: SIZE(10),
    },
    modalContainer: {
        width: SIZE(150),
        maxHeight: SIZE(200),
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

// export default VideoPlayer;
export default React.memo(VideoPlayer);
