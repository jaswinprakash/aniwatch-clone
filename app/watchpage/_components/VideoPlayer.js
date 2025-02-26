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

const VideoPlayer = ({
    videoUrl,
    subtitlesData,
    availableQualities,
    title,
    initialPlaybackTime = 0,
    onPlaybackTimeUpdate,
    selectedEpisode,
    episodes,
    setSelectedEpisode,
    startStream,
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

    // useEffect(() => {
    //     if (showControls && !showQualityList && !showSubtitleList) {
    //         const timeout = setTimeout(() => {
    //             setShowControls(false);
    //         }, 3000);

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

    const nextEpisode = () => {
        const nextEpisode = episodes.find(
            (episode) => episode.number === selectedEpisode + 1
        );

        if (nextEpisode) {
            setSelectedEpisode(nextEpisode.number);
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
            startStream(prevEpisode.episodeId, prevEpisode.number);
        } else {
            console.log("No previous episode available.");
        }
    };

    return (
        <>
            <StatusBar hidden={isFullScreen} style="auto" />
            <View style={[styles.container, isFullScreen && styles.fullScreen]}>
                <TouchableWithoutFeedback
                    onPress={() => {
                        toggleControls();
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
        zIndex: 10000000,
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
});

export default React.memo(VideoPlayer);
