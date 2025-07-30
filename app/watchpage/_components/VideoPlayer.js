import { Colors } from "@/constants/Colors";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { router, useNavigation } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import { StatusBar } from "expo-status-bar";
import React, {
    useCallback,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    BackHandler,
    Platform,
    StyleSheet,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import { TouchableRipple } from "react-native-paper";
import Video from "react-native-video";
import { ThemedText } from "../../../components/ThemedText";
import { SIZE } from "../../../constants/Constants";
import { useFullscreen } from "../../../hooks/FullScreenContext";
import { useAnimeHistory } from "../../../store/AnimeHistoryContext";
import { useThrottledPlayback } from "../../../store/useThrottledPlayback";
import Controls from "./Controls";
import PlayerLoader from "./PlayerLoader";
import SubModal from "./SubModal";
import Subtitles from "./Subtitles";
import { useManualPlaybackSave } from "../../../lib/playBackUtils";
import debounce from "lodash.debounce";
const VideoPlayer = ({
    videoUrl,
    subtitlesData,
    availableQualities,
    title,
    selectedEpisode,
    episodes,
    setSelectedEpisode,
    selectedEpisodeId,
    startStream,
    animeId,
    intro,
    outro,
    uri,
    videoLoading,
    error,
    episodeLoading,
    setSelectedEpisodeName,
    selectedEpisodeName,
    ref,
}) => {
    const navigation = useNavigation();
    const videoRef = useRef(null);
    const { setIsFullscreenContext } = useFullscreen();
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [isPlaying, setIsPlaying] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [showSubtitleList, setShowSubtitleList] = useState(false);
    const [selectedSubtitle, setSelectedSubtitle] = useState(null);
    const [isSeeking, setIsSeeking] = useState(false);
    const [seekPosition, setSeekPosition] = useState(0);
    const [selectedQuality, setSelectedQuality] = useState("auto");
    const [showQualityList, setShowQualityList] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showForwardIndicator, setShowForwardIndicator] = useState(false);
    const [showBackwardIndicator, setShowBackwardIndicator] = useState(false);
    const [lastTap, setLastTap] = useState(0);
    const [doubleTapTimeoutId, setDoubleTapTimeoutId] = useState(null);
    const DOUBLE_TAP_DELAY = 300;
    const SEEK_AMOUNT = 10;
    const throttledUpdate = useThrottledPlayback();
    const history = useAnimeHistory();
    const saveToDatabase = useManualPlaybackSave();
    const [subSyncValue, setSubSyncValue] = useState(0.2);
    const [showSkipIntro, setShowSkipIntro] = useState(false);
    const [showSkipOutro, setShowSkipOutro] = useState(false);
    const controlsTimeoutRef = useRef(null);
    const [screenMode, setScreenMode] = useState("contain");
    const [showSpeedIndicator, setShowSpeedIndicator] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [initialSeekTime, setInitialSeekTime] = useState(0);
    const [isInitialSeekDone, setIsInitialSeekDone] = useState(false);

    const latestValuesRef = useRef({
        animeId: null,
        selectedEpisode: null,
        currentTime: null,
        selectedEpisodeId: null,
        selectedEpisodeName: null,
    });

    useImperativeHandle(ref, () => ({
        resetTime: () => {
            setCurrentTime(0);
        },
        getCurrentTime: () => currentTime,
    }));

    const debouncedHideControls = useMemo(
        () => debounce(() => setShowControls(false), 5000),
        []
    );

    const toggleControls = () => {
        if (showControls) {
            setShowControls(false);
        } else {
            resetControlsTimeout();
        }
    };

    const resetControlsTimeout = () => {
        setShowControls(true);
        if (isPlaying && !isLoading) {
            debouncedHideControls();
        }
    };

    const checkForIntroOutro = useCallback(
        (currentTime) => {
            if (!intro && !outro) return;
            const shouldShowIntro =
                intro && currentTime >= intro.start && currentTime <= intro.end;
            const shouldShowOutro =
                outro && currentTime >= outro.start && currentTime <= outro.end;
            setShowSkipIntro(shouldShowIntro);
            setShowSkipOutro(shouldShowOutro);
        },
        [intro, outro]
    );

    const skipSegment = useCallback(
        (segment) => {
            if (segment === "intro" && intro) {
                setSeekPosition(intro.end);
                setIsSeeking(false);
                videoRef.current.seek(intro.end);
            } else if (segment === "outro" && outro) {
                setSeekPosition(outro.end);
                setIsSeeking(false);
                videoRef.current.seek(outro.end);
            }
            resetControlsTimeout();
        },
        [intro, outro]
    );

    const handleSubtitleSync = (data) => {
        setSubSyncValue((prev) => {
            const newValue = data === "+" ? prev + 0.1 : prev - 0.1;
            return parseFloat(newValue.toFixed(1));
        });
        resetControlsTimeout();
    };

    const handleTouchStart = () => {
        resetControlsTimeout();
    };

    const handleTouchEnd = () => {
        resetControlsTimeout();
    };

    const toggleFullScreen = useCallback(async () => {
        setIsFullScreen(!isFullScreen);
        setIsFullscreenContext(!isFullScreen);
        if (!isFullScreen) {
            await Promise.all([
                ScreenOrientation.lockAsync(
                    ScreenOrientation.OrientationLock.LANDSCAPE
                ),
            ]);
            if (Platform.OS == "ios") {
                navigation.setOptions({
                    autoHideHomeIndicator: true,
                    gestureEnabled: false,
                });
            }
        } else {
            await Promise.all([
                ScreenOrientation.lockAsync(
                    ScreenOrientation.OrientationLock.PORTRAIT_UP
                ),
            ]);
            if (Platform.OS == "ios") {
                navigation.setOptions({
                    autoHideHomeIndicator: false,
                    gestureEnabled: true,
                });
            }
        }
        resetControlsTimeout();
    }, [isFullScreen]);

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
            setSelectedEpisodeName(nextEpisode.title);
            startStream(nextEpisode.episodeId, nextEpisode.number);
            setCurrentTime(0);
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
            setSelectedEpisodeName(prevEpisode.title);
            startStream(prevEpisode.episodeId, prevEpisode.number);
            setCurrentTime(0);
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
                setIsSeeking(true);
                setSeekPosition(currentTime + SEEK_AMOUNT);
                setTimeout(() => setShowForwardIndicator(false), 500);
            } else {
                skip(-SEEK_AMOUNT);
                setShowBackwardIndicator(true);
                setIsSeeking(true);
                setSeekPosition(currentTime - SEEK_AMOUNT);
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

    useEffect(() => {
        if (subtitlesData && subtitlesData.length > 0) {
            setSelectedSubtitle(
                subtitlesData.find(
                    (sub) => sub?.label?.toLowerCase() === "english"
                ) ||
                    subtitlesData[0] ||
                    null
            );
        }
    }, [subtitlesData]);

    useEffect(() => {
        return () => {
            ScreenOrientation.lockAsync(
                ScreenOrientation.OrientationLock.PORTRAIT_UP
            );
            if (controlsTimeoutRef.current) {
                clearTimeout(controlsTimeoutRef.current);
            }
            if (doubleTapTimeoutId) {
                clearTimeout(doubleTapTimeoutId);
            }
            debouncedHideControls.cancel();
            if (Platform.OS == "ios") {
                navigation.setOptions({
                    autoHideHomeIndicator: false,
                    gestureEnabled: true,
                });
            }
            const {
                animeId,
                selectedEpisode,
                currentTime,
                selectedEpisodeId,
                selectedEpisodeName,
            } = latestValuesRef.current;

            if (
                animeId &&
                selectedEpisode &&
                currentTime &&
                selectedEpisodeId &&
                selectedEpisodeName
            ) {
                saveToDatabase(
                    animeId,
                    selectedEpisode,
                    currentTime,
                    selectedEpisodeId,
                    selectedEpisodeName
                );
            }
        };
    }, []);

    useEffect(() => {
        const animeData = history.find((item) => item.animeId === animeId);
        setInitialSeekTime(animeData?.currentTime || 0);
    }, [animeId, selectedEpisode, selectedEpisodeId, history]);

    const onLoad = (data) => {
        setDuration(data.duration);
        if (initialSeekTime > 0 && !isInitialSeekDone) {
            videoRef.current.seek(initialSeekTime);
            setIsInitialSeekDone(true);
        } else {
            videoRef.current.seek(0);
            setIsInitialSeekDone(true);
        }
    };
    const lastProgressUpdateRef = useRef(0);

    const onProgress = useCallback(
        (data) => {
            const now = Date.now();
            if (now - lastProgressUpdateRef.current < 500) return;

            lastProgressUpdateRef.current = now;

            if (selectedEpisode) {
                checkForIntroOutro(data.currentTime);
                const currentTime = data.currentTime;
                setCurrentTime(currentTime);
                throttledUpdate(
                    animeId,
                    selectedEpisode,
                    currentTime,
                    selectedEpisodeId,
                    selectedEpisodeName
                );
                if (isLoading) {
                    setIsLoading(false);
                    setIsSeeking(false);
                    setShowControls(false);
                }
                latestValuesRef.current = {
                    animeId,
                    selectedEpisode,
                    currentTime,
                    selectedEpisodeId,
                    selectedEpisodeName,
                };
            }
        },
        [selectedEpisode, animeId, throttledUpdate, intro, outro, isLoading]
    );

    const handleLongPress = () => {
        setPlaybackRate(2);
        setShowSpeedIndicator(true);
    };

    const handleLongPressEnd = () => {
        setPlaybackRate(1);
        setShowSpeedIndicator(false);
    };

    return (
        <View style={[styles.container, isFullScreen && styles.fullScreen]}>
            <StatusBar hidden={isFullScreen} style="auto" />
            <TouchableWithoutFeedback
                onPress={(event) => handleDoubleTap(event)}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onLongPress={handleLongPress}
                onPressOut={handleLongPressEnd}
                delayLongPress={500}
            >
                <View style={styles.videoContainer}>
                    {showBackwardIndicator && (
                        <View
                            style={[styles.skipIndicator, { left: SIZE(50) }]}
                        >
                            <MaterialIcons
                                name="replay-10"
                                size={SIZE(30)}
                                color={Colors.dark.tabIconSelected}
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
                                color={Colors.dark.tabIconSelected}
                            />
                        </View>
                    )}
                    {videoLoading ? (
                        <PlayerLoader
                            uri={uri}
                            videoLoading={videoLoading}
                            selectedEpisode={selectedEpisode}
                            error={error}
                            episodeLoading={episodeLoading}
                            selectedEpisodeName={selectedEpisodeName}
                        />
                    ) : (
                        <Video
                            onBuffer={(data) => {
                                setIsLoading(true);
                            }}
                            ref={videoRef}
                            source={{
                                uri: videoUrl,
                                type: "m3u8",
                                bufferConfig: {
                                    minBufferMs: 2500,
                                    maxBufferMs: 8000,
                                    bufferForPlaybackMs: 750,
                                    bufferForPlaybackAfterRebufferMs: 1500,
                                },
                            }}
                            preferredForwardBufferDuration={2}
                            style={styles.video}
                            paused={
                                !isPlaying ||
                                (initialSeekTime > 0 && !isInitialSeekDone)
                            }
                            onLoad={onLoad}
                            onProgress={onProgress}
                            resizeMode={screenMode}
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
                            controls={false}
                            rate={playbackRate}
                        />
                    )}
                    {!videoLoading ? (
                        <>
                            <Subtitles
                                textStyle={{
                                    fontSize: SIZE(18),
                                    backgroundColor: "transparent",
                                    color: Colors.light.white,
                                    fontFamily: "Exo2Regular",
                                    marginBottom: SIZE(3),
                                    textShadowColor: Colors.dark.black,
                                    textShadowOffset: {
                                        width: 1,
                                        height: 1,
                                    },
                                    textShadowRadius: 10,
                                }}
                                containerStyle={{
                                    position: "absolute",
                                    bottom:
                                        !isFullScreen && showControls
                                            ? SIZE(70)
                                            : isFullScreen && showControls
                                            ? SIZE(110)
                                            : SIZE(20),
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
                                            ? "rgba(0, 0, 0, 0.2)"
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
                                    setScreenMode={setScreenMode}
                                    screenMode={screenMode}
                                    isLoading={isLoading}
                                    showSpeedIndicator={showSpeedIndicator}
                                    selectedEpisodeName={selectedEpisodeName}
                                />
                                {showQualityList && (
                                    <SubModal
                                        data={availableQualities}
                                        handleChange={(item) =>
                                            changeQuality(item)
                                        }
                                        handleSet={() =>
                                            setShowQualityList(false)
                                        }
                                        selectedItem={selectedQuality}
                                        quality={true}
                                    />
                                )}
                                {showSubtitleList && subtitlesData && (
                                    <SubModal
                                        data={subtitlesData}
                                        handleChange={(item) =>
                                            selectSubtitle(item)
                                        }
                                        handleSet={() =>
                                            setShowSubtitleList(false)
                                        }
                                        selectedItem={selectedSubtitle}
                                    />
                                )}
                                {!isLoading &&
                                    (showSkipIntro || showSkipOutro) && (
                                        <TouchableRipple
                                            rippleColor={
                                                Colors.dark.backgroundPress
                                            }
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
                                                setIsSeeking(true);
                                            }}
                                        >
                                            <View>
                                                <MaterialCommunityIcons
                                                    name="skip-forward"
                                                    size={SIZE(40)}
                                                    color={
                                                        Colors.light
                                                            .tabIconSelected
                                                    }
                                                />
                                                <ThemedText
                                                    style={{
                                                        fontSize: SIZE(12),
                                                        color: Colors.light
                                                            .tabIconSelected,
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
                        </>
                    ) : null}
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
        zIndex: 2000,
    },
    skipIndicatorText: {
        color: Colors.light.tabIconSelected,
        fontSize: SIZE(16),
    },
});

export default React.memo(VideoPlayer, (prevProps, nextProps) => {
    return (
        prevProps.videoUrl === nextProps.videoUrl &&
        prevProps.isPlaying === nextProps.isPlaying
    );
});
