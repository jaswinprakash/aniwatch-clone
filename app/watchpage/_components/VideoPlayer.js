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
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { TouchableRipple } from "react-native-paper";
import { ThemedText } from "../../../components/ThemedText";

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
    intro,
    outro,
}) => {
    const videoRef = useRef(null);
    const { setIsFullscreenContext } = useFullscreen();
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [controlsTimeout, setControlsTimeout] = useState(null);
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
    const DOUBLE_TAP_DELAY = 300;
    const SEEK_AMOUNT = 10;
    let touchStart = 0;
    const throttledUpdate = useThrottledPlayback();
    const history = useAnimeHistory();
    const [initialLoad, setInitialLoad] = useState(true);
    const [subSyncValue, setSubSyncValue] = useState(0.2);
    const [showSkipIntro, setShowSkipIntro] = useState(false);
    const [showSkipOutro, setShowSkipOutro] = useState(false);
    const controlsTimeoutRef = useRef(null);

    const toggleControls = () => {
        setShowControls(!showControls);
        resetControlsTimeout();
    };

    const resetControlsTimeout = () => {
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
        if (isPlaying && !isLoading) {
            controlsTimeoutRef.current = setTimeout(() => {
                setShowControls(false);
            }, 3000);
        }
    };

    const checkForIntroOutro = (currentTime) => {
        if (intro && currentTime >= intro.start && currentTime <= intro.end) {
            setShowSkipIntro(true);
        } else {
            setShowSkipIntro(false);
        }

        if (outro && currentTime >= outro.start && currentTime <= outro.end) {
            setShowSkipOutro(true);
        } else {
            setShowSkipOutro(false);
        }
    };

    const skipSegment = (segment) => {
        if (segment === "intro" && intro) {
            videoRef.current.seek(intro.end);
        } else if (segment === "outro" && outro) {
            videoRef.current.seek(outro.end);
        }
        resetControlsTimeout();
    };

    useEffect(() => {
        return () => {
            ScreenOrientation.lockAsync(
                ScreenOrientation.OrientationLock.PORTRAIT
            );
            if (controlsTimeoutRef.current) {
                clearTimeout(controlsTimeoutRef.current);
            }
        };
    }, []);

    const handleSubtitleSync = (data) => {
        setSubSyncValue((prev) => {
            const newValue = data === "+" ? prev + 0.1 : prev - 0.1;
            return parseFloat(newValue.toFixed(1));
        });
        resetControlsTimeout();
    };

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
                NavigationBar.setBackgroundColorAsync(Colors.dark.background),
            ]);
        }
        resetControlsTimeout();
    };

    useEffect(() => {
        return () => {
            ScreenOrientation.lockAsync(
                ScreenOrientation.OrientationLock.PORTRAIT
            );
            NavigationBar.setVisibilityAsync("visible");
            NavigationBar.setBehaviorAsync("default");
            NavigationBar.setBackgroundColorAsync(Colors.dark.background);
        };
    }, []);

    const togglePlayPause = () => {
        setIsPlaying(!isPlaying);
        resetControlsTimeout();
    };

    const skip = (seconds) => {
        const newTime = currentTime + seconds;
        videoRef.current.seek(Math.max(0, Math.min(newTime, duration)));
        resetControlsTimeout();
    };

    const selectSubtitle = (subtitle) => {
        setSelectedSubtitle(subtitle);
        setShowSubtitleList(false);
        resetControlsTimeout();
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
                checkForIntroOutro(data.currentTime);
                const currentTime = data.currentTime;
                setCurrentTime(currentTime);
                throttledUpdate(animeId, selectedEpisode, currentTime);
            }
        }, 1000)
    ).current;

    const changeQuality = (resolution) => {
        setSelectedQuality(resolution);
        setShowQualityList(false);
        resetControlsTimeout();
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
        resetControlsTimeout();
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
        resetControlsTimeout();
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
        <View style={[styles.container, isFullScreen && styles.fullScreen]}>
            <StatusBar
                hidden={isFullScreen}
                style="auto"
                backgroundColor={Colors.dark.background}
            />
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
                            style={[styles.skipIndicator, { left: SIZE(50) }]}
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
                            style={[styles.skipIndicator, { right: SIZE(50) }]}
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
                                setTimeout(() => {
                                    setShowControls(false);
                                }, 2000);
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
                            // headers: {
                            //     Referer: "https://megaplay.buzz/",
                            //     "User-Agent":
                            //         "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
                            // },
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
                    />
                    <Subtitles
                        textStyle={{
                            fontSize: SIZE(18),
                            backgroundColor: "transparent",
                            color: Colors.light.white,
                            fontFamily: "Exo2Regular",
                            marginBottom: SIZE(3),
                            textShadowColor: Colors.dark.black,
                            textShadowOffset: {
                                width: 2,
                                height: 2,
                            },
                            textShadowRadius: 3,
                        }}
                        containerStyle={{
                            position: "absolute",
                            bottom: SIZE(20),
                            zIndex: 1000,
                            alignSelf: "center",
                            justifyContent: "center",
                            paddingHorizontal: SIZE(5),
                            borderRadius: SIZE(5),
                            backgroundColor: "transparent",
                        }}
                        currentTime={currentTime + subSyncValue}
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
                            onProgress={onProgress}
                            handleSubtitleSync={handleSubtitleSync}
                            subSyncValue={subSyncValue}
                            resetControlsTimeout={resetControlsTimeout}
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
                        {showSubtitleList && subtitlesData && (
                            <SubModal
                                data={subtitlesData}
                                handleChange={(item) => selectSubtitle(item)}
                                handleSet={() => setShowSubtitleList(false)}
                                selectedItem={selectedSubtitle}
                            />
                        )}
                        {(showSkipIntro || showSkipOutro) && (
                            <TouchableRipple
                                rippleColor={Colors.dark.backgroundPress}
                                borderless={true}
                                style={{
                                    position: "absolute",
                                    bottom: SIZE(100),
                                    right: SIZE(20),
                                }}
                                hitSlop={20}
                                onPress={() => {
                                    showSkipIntro
                                        ? skipSegment("intro")
                                        : skipSegment("outro");
                                }}
                            >
                                <View>
                                    <MaterialCommunityIcons
                                        name="skip-forward"
                                        size={SIZE(40)}
                                        color={Colors.light.tabIconSelected}
                                    />
                                    <ThemedText
                                        style={{
                                            fontSize: SIZE(12),
                                            color: Colors.light.tabIconSelected,
                                        }}
                                    >
                                        {showSkipIntro
                                            ? "Skip Intro"
                                            : "Skip Outro"}
                                    </ThemedText>
                                </View>
                            </TouchableRipple>
                        )}
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </View>
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
