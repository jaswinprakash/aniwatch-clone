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
        subtitlesData.find((sub) => sub?.lang?.toLowerCase() === "English") ||
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
    const DOUBLE_TAP_DELAY = 300;
    const SEEK_AMOUNT = 10;
    let touchStart = 0;
    const throttledUpdate = useThrottledPlayback();
    const history = useAnimeHistory();
    const [initialLoad, setInitialLoad] = useState(true);

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
                NavigationBar.setBackgroundColorAsync(Colors.dark.black),
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
            NavigationBar.setBackgroundColorAsync(Colors.dark.black);
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
        const screenWidth = SIZE(400);
        const tapX = event.nativeEvent.locationX;
        const isRightSide = tapX > screenWidth / 2;

        if (now - lastTap < DOUBLE_TAP_DELAY) {
            if (isRightSide) {
                skip(SEEK_AMOUNT);
                setShowForwardIndicator(true);
                setTimeout(() => setShowForwardIndicator(false), 500);
            } else {
                skip(-SEEK_AMOUNT);
                setShowBackwardIndicator(true);
                setTimeout(() => setShowBackwardIndicator(false), 500);
            }
            if (doubleTapTimeoutId) {
                clearTimeout(doubleTapTimeoutId);
                setDoubleTapTimeoutId(null);
            }
        } else {
            if (doubleTapTimeoutId) {
                clearTimeout(doubleTapTimeoutId);
            }
            const timeoutId = setTimeout(() => {
                toggleControls();
                setDoubleTapTimeoutId(null);
            }, DOUBLE_TAP_DELAY);

            setDoubleTapTimeoutId(timeoutId);
        }
        setLastTap(now);
    };

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
                            <View
                                style={[
                                    styles.skipIndicator,
                                    { left: SIZE(50) },
                                ]}
                            >
                                <MaterialIcons
                                    name="replay-10"
                                    size={SIZE(30)}
                                    color={Colors.light.tabIconSelected}
                                />
                            </View>
                        )}
                        {showForwardIndicator && (
                            <View
                                style={[
                                    styles.skipIndicator,
                                    { right: SIZE(50) },
                                ]}
                            >
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
                            source={{
                                uri: videoUrl,
                                type: "m3u8",
                                bufferConfig: {
                                    minBufferMs: 15000,
                                    maxBufferMs: 30000,
                                    bufferForPlaybackMs: 2500,
                                    bufferForPlaybackAfterRebufferMs: 5000,
                                },
                                headers: {
                                    Referer: 'https://megacloud.club/',
                                    'User-Agent': 'AnimPlay/1.0',
                                },
                            }}
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
                        pic
                        />
                        <Subtitles
                            textStyle={{
                                fontSize: SIZE(16),
                                backgroundColor: "transparent",
                                color: Colors.light.white,
                                fontFamily: "Exo2Regular",
                                marginBottom: SIZE(3),
                            }}
                            containerStyle={{
                                position: "absolute",
                                bottom: SIZE(20),
                                zIndex: 1000,
                                alignSelf: "center",
                                justifyContent: "center",
                                paddingHorizontal: SIZE(5),
                                borderRadius: SIZE(5),
                            }}
                            currentTime={currentTime + 0.1}
                            selectedsubtitle={{
                                file: selectedSubtitle?.url,
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
                                onProgress={onProgress}
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
        backgroundColor: Colors.dark.black,
    },
    fullScreenSafeArea: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: Colors.dark.black,
        width: "100%",
        height: "100%",
    },
    container: {
        backgroundColor: Colors.dark.black,
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
        backgroundColor: Colors.dark.backgroundPress,
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
