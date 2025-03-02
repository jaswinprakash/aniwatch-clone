import React, { useState, useRef, useEffect, useCallback } from "react";
import {
    View,
    StyleSheet,
    TouchableWithoutFeedback,
    ActivityIndicator,
    BackHandler,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import Video from "react-native-video";
import * as ScreenOrientation from "expo-screen-orientation";
import { Colors } from "@/constants/Colors";
import * as NavigationBar from "expo-navigation-bar";
import Subtitles from "./Subtitles";
import { SIZE } from "../../../constants/Constants";
import { router } from "expo-router";
import { useFullscreen } from "../../../hooks/FullScreenContext";
import throttle from "lodash.throttle";
import useDeviceOrientation from "../../../hooks/useDeviceOrientation";
import SubModal from "./SubModal";
import Controls from "./Controls";
import { useThrottledPlayback } from "../../../store/useThrottledPlayback";
import { useAnimeHistory } from "../../../store/AnimeHistoryContext";
import { MaterialIcons } from "@expo/vector-icons";

const VideoPlayer = ({
    videoUrl,
    subtitlesData,
    availableQualities,
    title,
    onPlaybackTimeUpdate,
    selectedEpisode,
    episodes,
    setSelectedEpisode,
    startStream,
    animeId,
    currentPlayingEpisodeId,
    setCurrentPlayingEpisodeId,
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
    const [epId, setEpId] = useState();
    const [showForwardIndicator, setShowForwardIndicator] = useState(false);
    const [showBackwardIndicator, setShowBackwardIndicator] = useState(false);
    const [lastTap, setLastTap] = useState(0);
    const [doubleTapTimeoutId, setDoubleTapTimeoutId] = useState(null);
    const DOUBLE_TAP_DELAY = 300; // milliseconds
    const SEEK_AMOUNT = 10; // seconds to seek on double tap
    let touchStart = 0;
    const throttledUpdate = useThrottledPlayback();
    const history = useAnimeHistory();

    const toggleControls = () => {
        setShowControls((prev) => !prev);
    };

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

    const [initialLoad, setInitialLoad] = useState(true);

    useEffect(() => {
        const animeData = history.find(
            (item) =>
                item.animeId === animeId &&
                item.episodeNumber === selectedEpisode
        );

        if (animeData) {
            setCurrentTime(animeData.currentTime);
        } else {
            setCurrentTime(0);
        }
    }, [animeId, selectedEpisode]);

    useEffect(() => {
        if (epId !== currentPlayingEpisodeId) {
            setCurrentPlayingEpisodeId(epId);
            setInitialLoad(true);
        }
    }, [epId]);

    const onLoad = (data) => {
        setDuration(data.duration);

        if (initialLoad) {
            if (currentTime > 0) {
                videoRef.current.seek(currentTime);
            } else {
                videoRef.current.seek(0);
            }
            setInitialLoad(false);
        }
    };

    const onProgress = useRef(
        throttle((data) => {
            if (!isSeeking) {
                const currentTime = data.currentTime;
                setCurrentTime(currentTime);
                if (onPlaybackTimeUpdate) {
                    onPlaybackTimeUpdate(currentTime);
                }
                throttledUpdate(animeId, selectedEpisode, currentTime);
            }
        }, 1000)
    ).current;

    const changeQuality = (resolution) => {
        setSelectedQuality(resolution);
        setShowQualityList(false);
    };

    const nextEpisode = () => {
        const nextEpisode = episodes.find(
            (episode) => episode.number === selectedEpisode + 1
        );

        if (nextEpisode) {
            setSelectedEpisode(nextEpisode.number);
            setEpId(nextEpisode.episodeId);
            startStream(nextEpisode.episodeId, nextEpisode.number);
        } else {
            console.log("No next episode available.");
        }
    };

    const prevEpisode = () => {
        const prevEpisode = episodes.find(
            (episode) => episode.number === selectedEpisode - 1
        );

        if (prevEpisode) {
            setSelectedEpisode(prevEpisode.number);
            setEpId(prevEpisode.episodeId);
            startStream(prevEpisode.episodeId, prevEpisode.number);
        } else {
            console.log("No previous episode available.");
        }
    };

    const handleDoubleTap = (event) => {
        const now = Date.now();
        const screenWidth = SIZE(400); // Approximate screen width, adjust if needed
        const tapX = event.nativeEvent.locationX;
        const isRightSide = tapX > screenWidth / 2;

        if (now - lastTap < DOUBLE_TAP_DELAY) {
            // Double tap detected
            if (isRightSide) {
                // Double tap on right side - seek forward
                skip(SEEK_AMOUNT);
                setShowForwardIndicator(true);
                setTimeout(() => setShowForwardIndicator(false), 500);
            } else {
                // Double tap on left side - seek backward
                skip(-SEEK_AMOUNT);
                setShowBackwardIndicator(true);
                setTimeout(() => setShowBackwardIndicator(false), 500);
            }

            // Clear any existing timeout
            if (doubleTapTimeoutId) {
                clearTimeout(doubleTapTimeoutId);
                setDoubleTapTimeoutId(null);
            }
        } else {
            // First tap - set up for potential double tap
            // Clear any existing timeout first
            if (doubleTapTimeoutId) {
                clearTimeout(doubleTapTimeoutId);
            }

            // Set a timeout to reset and handle this as a single tap if no second tap occurs
            const timeoutId = setTimeout(() => {
                toggleControls(); // Regular tap behavior
                setDoubleTapTimeoutId(null);
            }, DOUBLE_TAP_DELAY);

            setDoubleTapTimeoutId(timeoutId);
        }

        setLastTap(now);
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

    // useEffect(() => {
    //     if (showControls && !showQualityList && !showSubtitleList) {
    //         const timeout = setTimeout(() => {
    //             setShowControls(false);
    //         }, 3000);

    //         return () => clearTimeout(timeout);
    //     }
    // }, [showControls, showQualityList, showSubtitleList]);

    // Add these state variables at the top of your component

    // Add this function to handle the double tap

    return (
        <>
            <StatusBar hidden={isFullScreen} style="auto" />
            <View style={[styles.container, isFullScreen && styles.fullScreen]}>
                <TouchableWithoutFeedback
                    onPress={(event) => handleDoubleTap(event)}
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
                        {showBackwardIndicator && (
                            <View style={styles.skipIndicator}>
                                <MaterialIcons
                                    name="replay-10"
                                    size={SIZE(30)}
                                    color={Colors.light.tabIconSelected}
                                />
                            </View>
                        )}
                        {showForwardIndicator && (
                            <View style={styles.skipIndicator}>
                                <MaterialIcons
                                    name="forward-10"
                                    size={SIZE(30)}
                                    color={Colors.light.tabIconSelected}
                                />
                            </View>
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
                            onEnd={nextEpisode}
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
                                    backgroundColor: showControls
                                        ? "rgba(0, 0, 0, 0.5)"
                                        : null,
                                },
                            ]}
                        >
                            <Controls
                                showControls={showControls}
                                toggleFullScreen={toggleFullScreen}
                                isFullScreen={isFullScreen}
                                router={router}
                                showQualityList={showQualityList}
                                setShowQualityList={setShowQualityList}
                                setShowSubtitleList={setShowSubtitleList}
                                skip={skip}
                                togglePlayPause={togglePlayPause}
                                formatTime={formatTime}
                                isSeeking={isSeeking}
                                seekPosition={seekPosition}
                                currentTime={currentTime}
                                setIsSeeking={setIsSeeking}
                                setSeekPosition={setSeekPosition}
                                setCurrentTime={setCurrentTime}
                                videoRef={videoRef}
                                duration={duration}
                                showSubtitleList={showSubtitleList}
                                selectedSubtitle={selectedSubtitle}
                                title={title}
                                selectedEpisode={selectedEpisode}
                                isPlaying={isPlaying}
                                nextEpisode={nextEpisode}
                                prevEpisode={prevEpisode}
                            />
                            {showQualityList && (
                                <SubModal
                                    data={availableQualities}
                                    handleChange={(item) => changeQuality(item)}
                                    handleSet={() => setShowQualityList(false)}
                                    selectedItem={selectedQuality}
                                    quality={true}
                                />
                            )}
                            {showSubtitleList && (
                                <SubModal
                                    data={subtitlesData}
                                    handleChange={(item) =>
                                        selectSubtitle(item)
                                    }
                                    handleSet={() => setShowSubtitleList(false)}
                                    selectedItem={selectedSubtitle}
                                />
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
        zIndex: 999,
    },
    controlsOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: "space-between",
        padding: SIZE(10),
        zIndex: 1000,
    },
    skipIndicator: {
        position: "absolute",
        top: "50%",
        alignSelf: "center",
        backgroundColor: "rgba(140, 82, 255, 0.5)",
        borderRadius: SIZE(25),
        padding: SIZE(10),
        marginTop: -SIZE(27),
        zIndex: 1000,
    },
    skipIndicatorText: {
        color: Colors.light.tabIconSelected,
        fontSize: SIZE(16),
    },
});

export default React.memo(VideoPlayer);
