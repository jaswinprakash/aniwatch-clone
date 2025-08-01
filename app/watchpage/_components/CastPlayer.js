import { Colors } from "@/constants/Colors";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { Slider } from "@react-native-assets/slider";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    Platform,
    StyleSheet,
    ToastAndroid,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import GoogleCast, {
    CastButton,
    CastContext,
    PlayServicesState,
    useCastState,
    useRemoteMediaClient,
} from "react-native-google-cast";
import { TouchableRipple } from "react-native-paper";
import { ThemedText } from "../../../components/ThemedText";
import { SIZE } from "../../../constants/Constants";
import { useAnimeHistory } from "../../../store/AnimeHistoryContext";
import { useThrottledPlayback } from "../../../store/useThrottledPlayback";
import SubModal from "./SubModal";
import { useManualPlaybackSave } from "../../../lib/playBackUtils";

const CastPlayer = ({
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
    uri,
    intro,
    outro,
    videoLoading,
    error,
    episodeLoading,
    setSelectedEpisodeName,
    selectedEpisodeName,
}) => {
    // CAST STATE using hooks
    const client = useRemoteMediaClient();
    const sessionManager = GoogleCast.getSessionManager();
    const castState = useCastState();
    const [showCastControls, setShowCastControls] = useState(true);
    const [castCurrentTime, setCastCurrentTime] = useState(0);
    const [castDuration, setCastDuration] = useState(0);
    const [castIsPlaying, setCastIsPlaying] = useState(false);
    const castProgressIntervalRef = useRef(null);

    // Video player equivalent states
    const [showSubtitleList, setShowSubtitleList] = useState(false);
    const [selectedSubtitle, setSelectedSubtitle] = useState(null);
    const [showSkipIntro, setShowSkipIntro] = useState(false);
    const [showSkipOutro, setShowSkipOutro] = useState(false);
    const [subSyncValue, setSubSyncValue] = useState(0.2);
    const [isSeeking, setIsSeeking] = useState(false);
    const [seekPosition, setSeekPosition] = useState(0);

    // CRITICAL: Prevent multiple cast calls
    const [isCastingInProgress, setIsCastingInProgress] = useState(false);
    const [hasLoadedMedia, setHasLoadedMedia] = useState(false);
    const [currentVideoUrl, setCurrentVideoUrl] = useState(null);
    const [activeTrackIds, setActiveTrackIds] = useState([]);

    const throttledUpdate = useThrottledPlayback();
    const history = useAnimeHistory();
    const saveToDatabase = useManualPlaybackSave();
    const latestValuesRef = useRef({
        animeId: null,
        selectedEpisode: null,
        currentTime: null,
        selectedEpisodeId: null,
        selectedEpisodeName: null,
    });

    const isCasting = client !== null;

    // Check Google Play Services on Android
    useEffect(() => {
        if (Platform.OS === "android") {
            CastContext.getPlayServicesState()
                .then((state) => {
                    console.log("📱 Cast Play Services State:", state);
                    if (state && state !== PlayServicesState.SUCCESS) {
                        CastContext.showPlayServicesErrorDialog(state);
                    }
                })
                .catch((error) => {
                    console.warn(
                        "❌ Error checking Cast Play Services:",
                        error
                    );
                });
        }
    }, []);

    // Reset cast flags when video changes
    useEffect(() => {
        if (videoUrl !== currentVideoUrl) {
            console.log("🔄 Video URL changed, resetting cast flags");
            setHasLoadedMedia(false);
            setIsCastingInProgress(false);
            setCurrentVideoUrl(videoUrl);
            setActiveTrackIds([]);
        }
    }, [videoUrl, currentVideoUrl]);

    // Reset cast flags when client changes
    useEffect(() => {
        if (!client) {
            setHasLoadedMedia(false);
            setIsCastingInProgress(false);
            setCastCurrentTime(0);
            setCastDuration(0);
            setCastIsPlaying(false);
            setActiveTrackIds([]);
        }
    }, [client]);

    // Initialize from history (same as video player)
    useEffect(() => {
        setCastCurrentTime(0);

        const animeData = history.find(
            (item) =>
                item.animeId === animeId &&
                item.episodeNumber === selectedEpisode
        );

        if (animeData && animeData?.selectedEpisodeId === selectedEpisodeId) {
            setCastCurrentTime(animeData.currentTime);
        } else {
            setCastCurrentTime(0);
        }
    }, [animeId, selectedEpisode, history, selectedEpisodeId]);

    // Auto-select English subtitle (same as video player)
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

    // Check for intro/outro segments
    const checkForIntroOutro = (currentTime) => {
        if (intro && currentTime >= intro?.start && currentTime <= intro?.end) {
            setShowSkipIntro(true);
        } else {
            setShowSkipIntro(false);
        }

        if (outro && currentTime >= outro?.start && currentTime <= outro?.end) {
            setShowSkipOutro(true);
        } else {
            setShowSkipOutro(false);
        }
    };

    // Skip intro/outro segments
    const skipSegment = (segment) => {
        if (!client) return;

        if (segment === "intro" && intro) {
            client
                .seek({ position: intro.end })
                .then(() => {
                    console.log("⏭️ Skipped intro");
                })
                .catch((error) => {
                    console.log("❌ Skip intro failed:", error);
                });
        } else if (segment === "outro" && outro) {
            client
                .seek({ position: outro.end })
                .then(() => {
                    console.log("⏭️ Skipped outro");
                })
                .catch((error) => {
                    console.log("❌ Skip outro failed:", error);
                });
        }
    };

    // Toggle play/pause
    const togglePlayPause = () => {
        if (!client) return;

        if (castIsPlaying) {
            client
                .pause()
                .then(() => {
                    console.log("⏸️ Cast paused");
                    setCastIsPlaying(false);
                })
                .catch((error) => {
                    console.log("❌ Cast pause failed:", error);
                });
        } else {
            client
                .play()
                .then(() => {
                    console.log("▶️ Cast resumed");
                    setCastIsPlaying(true);
                })
                .catch((error) => {
                    console.log("❌ Cast play failed:", error);
                });
        }
    };

    // Skip forward/backward
    const skip = (seconds) => {
        if (!client) return;

        const newTime = castCurrentTime + seconds;
        const seekTime = Math.max(0, Math.min(newTime, castDuration));

        client
            .seek({ position: seekTime })
            .then(() => {
                console.log(`⏭️ Cast seeked to: ${seekTime}`);
            })
            .catch((error) => {
                console.log("❌ Cast seek failed:", error);
            });
    };

    // FIXED: Subtitle selection with proper track activation
    const selectSubtitle = (subtitle) => {
        setSelectedSubtitle(subtitle);
        setShowSubtitleList(false);

        if (client && hasLoadedMedia) {
            if (subtitle && subtitle.id) {
                // Activate the selected subtitle track
                client
                    .setActiveTrackIds([subtitle.id])
                    .then(() => {
                        console.log(
                            "📝 Activated subtitle track:",
                            subtitle.label
                        );
                        setActiveTrackIds([subtitle.id]);
                    })
                    .catch((error) => {
                        console.log(
                            "❌ Failed to activate subtitle track:",
                            error
                        );
                    });

                // Apply text track styling
                const textTrackStyle = {
                    backgroundColor: "#00000000", // Transparent background
                    foregroundColor: "#FFFFFF", // White text
                    edgeColor: "#000000", // Black outline
                    edgeType: "outline",
                    fontFamily: "sans-serif",
                    fontScale: 1.0,
                };

                client
                    .setTextTrackStyle(textTrackStyle)
                    .then(() => {
                        console.log("🎨 Applied text track style");
                    })
                    .catch((error) => {
                        console.log(
                            "❌ Failed to apply text track style:",
                            error
                        );
                    });
            } else {
                // Deactivate all subtitle tracks
                client
                    .setActiveTrackIds([])
                    .then(() => {
                        console.log("📝 Deactivated all subtitle tracks");
                        setActiveTrackIds([]);
                    })
                    .catch((error) => {
                        console.log(
                            "❌ Failed to deactivate subtitle tracks:",
                            error
                        );
                    });
            }
        }
    };

    // Next episode
    const nextEpisode = () => {
        const nextEp = episodes.find(
            (episode) => episode.number === selectedEpisode + 1
        );

        if (nextEp) {
            setSelectedEpisode(nextEp.number);
            setSelectedEpisodeName(nextEp.title);
            startStream(nextEp.episodeId, nextEp.number);
        } else {
            console.log("No next episode available.");
        }
    };

    // Previous episode
    const prevEpisode = () => {
        const prevEp = episodes.find(
            (episode) => episode.number === selectedEpisode - 1
        );

        if (prevEp) {
            setSelectedEpisode(prevEp.number);
            setSelectedEpisodeName(prevEp.title);
            startStream(prevEp.episodeId, prevEp.number);
        } else {
            console.log("No previous episode available.");
        }
    };

    // Format time display
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
    };

    // Handle slider seek
    const handleSeek = (value) => {
        if (!client) return;

        const seekTime = (value / 100) * castDuration;
        setIsSeeking(true);
        setSeekPosition(seekTime);

        client
            .seek({ position: seekTime })
            .then(() => {
                console.log(`🎯 Slider seek to: ${seekTime}`);
                setIsSeeking(false);
            })
            .catch((error) => {
                console.log("❌ Slider seek failed:", error);
                setIsSeeking(false);
            });
    };

    // FIXED: Start casting with proper subtitle track format
    const startCasting = useCallback(async () => {
        // Prevent multiple calls
        if (
            !client ||
            !videoUrl ||
            isCastingInProgress ||
            hasLoadedMedia ||
            videoLoading
        ) {
            console.log("❌ Cannot start casting:", {
                client: !!client,
                videoUrl: !!videoUrl,
                isCastingInProgress,
                hasLoadedMedia,
                videoLoading,
            });
            return;
        }

        console.log("🎯 Starting cast process...");
        setIsCastingInProgress(true);

        try {
            let castUrl = videoUrl;

            // FIXED: Create subtitle tracks in correct format
            const mediaTracks = [];
            let defaultTrackId = null;

            if (subtitlesData && subtitlesData.length > 0) {
                subtitlesData.forEach((subtitle, index) => {
                    const trackId = index + 1; // Start from 1, not 0

                    const mediaTrack = {
                        id: trackId,
                        type: "text",
                        subtype: "subtitles",
                        name: subtitle.label || `Subtitle ${index + 1}`,
                        contentId: subtitle.file, // Use contentId instead of src
                        language: subtitle.language || "en-US",
                    };

                    mediaTracks.push(mediaTrack);

                    // Set default track (English or first one)
                    if (
                        subtitle.label?.toLowerCase().includes("english") ||
                        index === 0
                    ) {
                        defaultTrackId = trackId;
                    }

                    // Update selectedSubtitle with ID
                    if (
                        selectedSubtitle &&
                        selectedSubtitle.label === subtitle.label
                    ) {
                        setSelectedSubtitle({
                            ...subtitle,
                            id: trackId,
                        });
                    }
                });
            }

            const mediaLoadRequest = {
                mediaInfo: {
                    contentUrl: castUrl,
                    contentType: "application/x-mpegURL",
                    metadata: {
                        images: [
                            {
                                url: uri,
                            },
                        ],
                        title: selectedEpisodeName,
                        seriesTitle: title,
                        type: "tvShow",
                        episodeNumber: selectedEpisode,
                    },
                    mediaTracks: mediaTracks, // Use mediaTracks instead of tracks
                },
                startTime: castCurrentTime || 0,
                autoplay: true,
            };

            console.log(
                "📱 Loading media with tracks:",
                JSON.stringify(mediaLoadRequest, null, 2)
            );

            const result = await client.loadMedia(mediaLoadRequest);
            console.log("✅ Cast load successful:", result);

            setHasLoadedMedia(true);
            setCastIsPlaying(true);

            // Auto-activate default subtitle track after loading
            if (defaultTrackId && mediaTracks.length > 0) {
                setTimeout(() => {
                    client
                        .setActiveTrackIds([defaultTrackId])
                        .then(() => {
                            console.log(
                                "📝 Auto-activated default subtitle track:",
                                defaultTrackId
                            );
                            setActiveTrackIds([defaultTrackId]);

                            // Apply default text styling
                            const textTrackStyle = {
                                backgroundColor: "#00000000",
                                foregroundColor: "#FFFFFF",
                                edgeColor: "#000000",
                                edgeType: "outline",
                                fontFamily: "sans-serif",
                                fontScale: 1.0,
                            };

                            client
                                .setTextTrackStyle(textTrackStyle)
                                .catch((error) => {
                                    console.log(
                                        "❌ Failed to apply default text style:",
                                        error
                                    );
                                });
                        })
                        .catch((error) => {
                            console.log(
                                "❌ Failed to auto-activate subtitle track:",
                                error
                            );
                        });
                }, 2000); // Wait for media to fully load
            }
        } catch (error) {
            console.log("❌ Error starting cast:", error);

            if (error.message.includes("2103")) {
                if (Platform.OS === "android") {
                    ToastAndroid.show(
                        "Stream Not Supported",
                        "This video format cannot be played on your Chromecast device. Try a different quality.",
                        ToastAndroid.LONG
                    );
                }
            } else {
                if (Platform.OS === "android") {
                    ToastAndroid.show(
                        `Unable to cast: ${error.message}`,
                        ToastAndroid.LONG
                    );
                }
            }

            setHasLoadedMedia(false);
        } finally {
            setIsCastingInProgress(false);
        }
    }, [
        client,
        videoUrl,
        availableQualities,
        title,
        selectedEpisode,
        castCurrentTime,
        selectedSubtitle,
        subtitlesData,
        isCastingInProgress,
        hasLoadedMedia,
        videoLoading,
    ]);

    // Monitor cast progress (same as video player onProgress)

    useEffect(() => {
        if (isCasting && client && hasLoadedMedia) {
            console.log("📺 Starting cast progress monitoring");

            castProgressIntervalRef.current = setInterval(async () => {
                try {
                    // Use getStreamPosition() for more accurate real-time position
                    const streamPosition = await client.getStreamPosition();
                    const mediaStatus = await client.getMediaStatus();

                    if (!mediaStatus) {
                        return;
                    }

                    // Use the real-time stream position instead of mediaStatus.streamPosition
                    const currentTime = streamPosition || 0;
                    const duration = mediaStatus.mediaInfo?.streamDuration || 0;
                    const isPlaying = mediaStatus.playerState === "playing";

                    console.log(
                        `📊 Stream Position: ${currentTime}, Player State: ${mediaStatus.playerState}`
                    );

                    // Check for intro/outro (same as video player)
                    checkForIntroOutro(currentTime);

                    setCastCurrentTime(currentTime);
                    setCastDuration(duration);
                    setCastIsPlaying(isPlaying);

                    // Update active tracks if they've changed
                    if (
                        mediaStatus.activeTrackIds &&
                        JSON.stringify(mediaStatus.activeTrackIds) !==
                            JSON.stringify(activeTrackIds)
                    ) {
                        setActiveTrackIds(mediaStatus.activeTrackIds);
                        console.log(
                            "📝 Active tracks updated:",
                            mediaStatus.activeTrackIds
                        );
                    }

                    // Update history (same as video player)
                    if (selectedEpisode && currentTime > 0) {
                        throttledUpdate(
                            animeId,
                            selectedEpisode,
                            currentTime,
                            selectedEpisodeId,
                            selectedEpisodeName
                        );
                        latestValuesRef.current = {
                            animeId,
                            selectedEpisode,
                            currentTime,
                            selectedEpisodeId,
                            selectedEpisodeName,
                        };
                    }

                    // Handle playback end
                    if (
                        mediaStatus.playerState === "idle" &&
                        mediaStatus.idleReason === "finished"
                    ) {
                        console.log("🎬 Episode finished, playing next");
                        nextEpisode();
                    }

                    // Check for errors
                    if (
                        mediaStatus.playerState === "idle" &&
                        mediaStatus.idleReason === "error"
                    ) {
                        console.log("❌ Cast playback error detected");
                        if (Platform.OS === "android") {
                            ToastAndroid.show(
                                "Playback Error",
                                ToastAndroid.SHORT
                            );
                        }
                    }
                } catch (error) {
                    console.log("❌ Error getting cast progress:", error);

                    // Fallback: try to get position from mediaStatus if getStreamPosition fails
                    try {
                        const mediaStatus = await client.getMediaStatus();
                        if (
                            mediaStatus &&
                            mediaStatus.streamPosition !== undefined
                        ) {
                            const currentTime = mediaStatus.streamPosition || 0;
                            setCastCurrentTime(currentTime);
                            console.log(`📊 Fallback Position: ${currentTime}`);
                        }
                    } catch (fallbackError) {
                        console.log(
                            "❌ Fallback position retrieval failed:",
                            fallbackError
                        );
                    }
                }
            }, 1000);
        } else {
            if (castProgressIntervalRef.current) {
                clearInterval(castProgressIntervalRef.current);
            }
        }

        return () => {
            if (castProgressIntervalRef.current) {
                clearInterval(castProgressIntervalRef.current);
            }
        };
    }, [
        isCasting,
        client,
        hasLoadedMedia,
        selectedEpisode,
        animeId,
        throttledUpdate,
        selectedEpisodeId,
        intro,
        outro,
        activeTrackIds,
        selectedEpisodeName,
    ]);

    const forceDisconnectCast = useCallback(async () => {
        try {
            await sessionManager.endCurrentSession(true);
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

            setCastIsPlaying(false);
            setCastCurrentTime(0);
            setCastDuration(0);
            setHasLoadedMedia(false);
            setIsCastingInProgress(false);
            setActiveTrackIds([]);
        } catch (error) {
            console.log("❌ All disconnect methods failed:", error);
        }
    }, [sessionManager]);

    // FIXED: Auto-start casting only when needed
    useEffect(() => {
        if (
            client &&
            videoUrl &&
            !videoLoading &&
            !isCastingInProgress &&
            !hasLoadedMedia
        ) {
            console.log("🎬 Client ready, will start casting in 1 second...");
            const timer = setTimeout(() => {
                startCasting();
            }, 1000);

            return () => clearTimeout(timer);
        }
    }, [client, videoUrl, videoLoading, isCastingInProgress, hasLoadedMedia]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (castProgressIntervalRef.current) {
                clearInterval(castProgressIntervalRef.current);
            }
            forceDisconnectCast();
        };
    }, []);

    const toggleCastControls = () => {
        // setShowCastControls(!showCastControls);
    };

    const handleSubtitleSyncWithReload = async (direction) => {
        const newSyncValue =
            direction === "+" ? subSyncValue + 0.1 : subSyncValue - 0.1;
        setSubSyncValue(parseFloat(newSyncValue.toFixed(1)));

        if (client && hasLoadedMedia) {
            try {
                // Stop current media
                await client.stop();

                // Reset flags
                setHasLoadedMedia(false);
                setIsCastingInProgress(false);

                // Restart casting with new sync value
                setTimeout(() => {
                    startCasting();
                }, 1000);
            } catch (error) {
                console.log("❌ Error reloading with new sync:", error);
            }
        }
    };

    // Calculate slider value
    const sliderValue =
        castDuration > 0 ? (castCurrentTime / castDuration) * 100 : 0;

    return (
        <View style={styles.container}>
            {/* CAST BUTTON */}
            <View style={styles.castButtonContainer}>
                <CastButton style={styles.castButton} />
                <ThemedText style={styles.castStateText}>
                    {castState}
                </ThemedText>
                {isCastingInProgress && (
                    <ThemedText style={styles.loadingText}>
                        Loading...
                    </ThemedText>
                )}
            </View>

            {/* MAIN CAST INTERFACE */}
            {isCasting ? (
                <TouchableWithoutFeedback onPress={toggleCastControls}>
                    <View style={styles.castingOverlay}>
                        <View style={styles.castingContent}>
                            <MaterialIcons
                                name="cast-connected"
                                size={SIZE(40)}
                                color={Colors.light.tabIconSelected}
                            />
                            <ThemedText style={styles.castingTitle}>
                                Casting to TV
                            </ThemedText>
                            <ThemedText
                                numberOfLines={1}
                                style={styles.castingSubtitle}
                            >
                                {title}
                            </ThemedText>
                            <ThemedText style={styles.castingEpisode}>
                                Episode {selectedEpisode}
                            </ThemedText>

                            {/* Show subtitle track status */}
                            {/* {activeTrackIds.length > 0 && (
                                <ThemedText style={styles.subtitleStatus}>
                                    📝 Subtitles:{" "}
                                    {selectedSubtitle?.label || "Active"}
                                </ThemedText>
                            )} */}

                            {/* Show loading state */}
                            {isCastingInProgress && (
                                <ThemedText style={styles.loadingText}>
                                    🔄 Loading media...
                                </ThemedText>
                            )}

                            {/* CAST CONTROLS */}
                            {hasLoadedMedia && !isCastingInProgress && (
                                <View style={styles.castControlsContainer}>
                                    {/* SEEK SLIDER */}
                                    {/* <View style={styles.syncContainer}>
                                            <ThemedText
                                                style={styles.syncLabel}
                                            >
                                                Sub Sync:{" "}
                                                {subSyncValue.toFixed(1)}s
                                            </ThemedText>
                                        </View>
                                        <View style={styles.syncButtons}>
                                            <TouchableRipple
                                                onPress={() =>
                                                    handleSubtitleSyncWithReload(
                                                        "-"
                                                    )
                                                }
                                                style={styles.syncButton}
                                            >
                                                <MaterialIcons
                                                    name="remove"
                                                    size={SIZE(16)}
                                                    color={Colors.light.white}
                                                />
                                            </TouchableRipple>
                                            <TouchableRipple
                                                onPress={() =>
                                                    handleSubtitleSyncWithReload(
                                                        "+"
                                                    )
                                                }
                                                style={styles.syncButton}
                                            >
                                                <MaterialIcons
                                                    name="add"
                                                    size={SIZE(16)}
                                                    color={Colors.light.white}
                                                />
                                            </TouchableRipple>
                                        </View> */}
                                    <View style={styles.sliderContainer}>
                                        <ThemedText style={styles.timeText}>
                                            {formatTime(
                                                isSeeking
                                                    ? seekPosition
                                                    : castCurrentTime
                                            )}
                                        </ThemedText>

                                        <Slider
                                            style={styles.slider}
                                            minimumValue={0}
                                            maximumValue={100}
                                            value={sliderValue}
                                            onValueChange={(value) => {
                                                const newTime =
                                                    (value / 100) *
                                                    castDuration;
                                                setSeekPosition(newTime);
                                                setIsSeeking(true);
                                            }}
                                            onSlidingComplete={handleSeek}
                                            minimumTrackTintColor={
                                                Colors.light.tabIconSelected
                                            }
                                            maximumTrackTintColor={
                                                Colors.dark.backgroundPress
                                            }
                                            thumbStyle={styles.sliderThumb}
                                        />
                                        <ThemedText style={styles.timeText}>
                                            {formatTime(castDuration)}
                                        </ThemedText>
                                    </View>

                                    {/* MAIN CONTROLS */}
                                    <View style={styles.mainControlsRow}>
                                        <TouchableRipple
                                            onPress={prevEpisode}
                                            style={styles.episodeButton}
                                        >
                                            <MaterialIcons
                                                name="skip-previous"
                                                size={SIZE(20)}
                                                color={Colors.light.white}
                                            />
                                        </TouchableRipple>

                                        <TouchableRipple
                                            onPress={() => skip(-10)}
                                            style={styles.castControlButton}
                                        >
                                            <MaterialIcons
                                                name="replay-10"
                                                size={SIZE(20)}
                                                color={Colors.light.white}
                                            />
                                        </TouchableRipple>

                                        <TouchableRipple
                                            onPress={togglePlayPause}
                                            style={[
                                                styles.castControlButton,
                                                styles.playButton,
                                            ]}
                                        >
                                            <MaterialIcons
                                                name={
                                                    castIsPlaying
                                                        ? "pause"
                                                        : "play-arrow"
                                                }
                                                size={SIZE(25)}
                                                color={Colors.light.white}
                                            />
                                        </TouchableRipple>

                                        <TouchableRipple
                                            onPress={() => skip(10)}
                                            style={styles.castControlButton}
                                        >
                                            <MaterialIcons
                                                name="forward-10"
                                                size={SIZE(20)}
                                                color={Colors.light.white}
                                            />
                                        </TouchableRipple>

                                        <TouchableRipple
                                            onPress={nextEpisode}
                                            style={styles.episodeButton}
                                        >
                                            <MaterialIcons
                                                name="skip-next"
                                                size={SIZE(20)}
                                                color={Colors.light.white}
                                            />
                                        </TouchableRipple>
                                    </View>

                                    {/* SETTINGS ROW */}
                                </View>
                            )}

                            {!showCastControls && (
                                <ThemedText style={styles.tapToControlText}>
                                    Tap to show controls
                                </ThemedText>
                            )}
                        </View>

                        {/* SKIP BUTTONS */}
                        {hasLoadedMedia && (showSkipIntro || showSkipOutro) && (
                            <TouchableRipple
                                rippleColor={Colors.dark.backgroundPress}
                                borderless={true}
                                style={styles.castSkipButton}
                                hitSlop={20}
                                onPress={() => {
                                    showSkipIntro
                                        ? skipSegment("intro")
                                        : skipSegment("outro");
                                }}
                            >
                                <View style={styles.skipButtonContent}>
                                    <MaterialCommunityIcons
                                        name="skip-forward"
                                        size={SIZE(30)}
                                        color={Colors.light.tabIconSelected}
                                    />
                                    <ThemedText style={styles.skipButtonText}>
                                        {showSkipIntro
                                            ? "Skip Intro"
                                            : "Skip Outro"}
                                    </ThemedText>
                                </View>
                            </TouchableRipple>
                        )}

                        {/* MODALS */}
                        {showSubtitleList && subtitlesData && (
                            <SubModal
                                data={[
                                    { label: "Off", file: null }, // Add "Off" option
                                    ...subtitlesData.map((sub, index) => ({
                                        ...sub,
                                        id: index + 1, // Add ID for track activation
                                    })),
                                ]}
                                handleChange={(item) => selectSubtitle(item)}
                                handleSet={() => setShowSubtitleList(false)}
                                selectedItem={selectedSubtitle}
                            />
                        )}
                    </View>
                </TouchableWithoutFeedback>
            ) : (
                /* NOT CASTING STATE */
                <View style={styles.noCastContainer}>
                    <MaterialIcons
                        name="cast"
                        size={SIZE(60)}
                        color={Colors.light.textSecondary}
                    />
                    <ThemedText style={styles.noCastTitle}>
                        Ready to Cast
                    </ThemedText>
                    <ThemedText style={styles.noCastSubtitle}>
                        {title} - Episode {selectedEpisode}
                    </ThemedText>
                    <ThemedText style={styles.noCastText}>
                        Press the cast button to connect to a device
                    </ThemedText>
                    {videoLoading && (
                        <ThemedText style={styles.loadingText}>
                            🔄 Loading video...
                        </ThemedText>
                    )}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.dark.black,
        height: SIZE(250),
    },
    castButtonContainer: {
        position: "absolute",
        top: SIZE(20),
        right: SIZE(20),
        zIndex: 1001,
        alignItems: "center",
    },
    castButton: {
        width: SIZE(30),
        height: SIZE(30),
        tintColor: Colors.light.tabIconSelected,
    },
    castStateText: {
        color: Colors.light.tabIconSelected,
        fontSize: SIZE(10),
        marginTop: SIZE(5),
    },
    loadingText: {
        color: Colors.light.tabIconSelected,
        fontSize: SIZE(14),
        marginTop: SIZE(10),
    },
    subtitleStatus: {
        color: Colors.light.tabIconSelected,
        fontSize: SIZE(12),
        marginTop: SIZE(5),
    },
    castingOverlay: {
        flex: 1,
        backgroundColor: Colors.dark.black,
        justifyContent: "center",
        alignItems: "center",
    },
    castingContent: {
        alignItems: "center",
        flex: 1,
        paddingHorizontal: SIZE(20),
        marginTop: SIZE(20),
    },
    castingTitle: {
        fontSize: SIZE(16),
        color: Colors.light.tabIconSelected,
        marginTop: SIZE(10),
        fontWeight: "bold",
    },
    castingSubtitle: {
        fontSize: SIZE(18),
        color: Colors.light.tabIconSelected,
        marginTop: SIZE(10),
        textAlign: "center",
        width: SIZE(150),
    },
    castingEpisode: {
        fontSize: SIZE(16),
        color: Colors.light.tabIconSelected,
        marginTop: SIZE(5),
    },
    castControlsContainer: {
        marginTop: SIZE(10),
        width: "100%",
    },
    sliderContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: SIZE(10),
        paddingHorizontal: SIZE(20),
    },
    slider: {
        flex: 1,
        marginHorizontal: SIZE(10),
    },
    sliderThumb: {
        backgroundColor: Colors.light.tabIconSelected,
        width: SIZE(20),
        height: SIZE(20),
    },
    timeText: {
        color: Colors.light.tabIconSelected,
        fontSize: SIZE(14),
        width: SIZE(60),
        textAlign: "center",
    },
    mainControlsRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: SIZE(10),
    },
    castControlButton: {
        marginHorizontal: SIZE(15),
        padding: SIZE(12),
        borderRadius: SIZE(25),
        backgroundColor: "rgba(255, 255, 255, 0.1)",
    },
    playButton: {
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        padding: SIZE(15),
    },
    episodeButton: {
        marginHorizontal: SIZE(20),
        padding: SIZE(10),
        borderRadius: SIZE(20),
        backgroundColor: "rgba(255, 255, 255, 0.1)",
    },
    settingsRow: {
        justifyContent: "space-around",
        alignItems: "center",
        marginBottom: SIZE(30),
        paddingHorizontal: SIZE(20),
        position: "absolute",
        bottom: "80%",
    },
    syncContainer: {
        alignItems: "center",
        position: "absolute",
        left: "8%",
        bottom: "180%",
    },
    syncLabel: {
        color: Colors.light.tabIconSelected,
        fontSize: SIZE(12),
        marginBottom: SIZE(5),
    },
    syncNote: {
        color: Colors.light.tabIconSelected,
        fontSize: SIZE(10),
    },
    syncButtons: {
        flexDirection: "row",
        position: "absolute",
        left: "5%",
        bottom: "150%",
    },
    syncButton: {
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        paddingHorizontal: SIZE(12),
        paddingVertical: SIZE(6),
        marginHorizontal: SIZE(2),
        borderRadius: SIZE(4),
    },
    syncButtonText: {
        color: Colors.light.tabIconSelected,
        fontSize: SIZE(16),
        fontWeight: "bold",
    },
    settingButton: {
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        padding: SIZE(10),
        borderRadius: SIZE(6),
    },
    settingButtonContent: {
        alignItems: "center",
    },
    settingButtonText: {
        color: Colors.light.tabIconSelected,
        fontSize: SIZE(10),
        marginTop: SIZE(2),
        textAlign: "center",
    },
    stopCastButton: {
        paddingHorizontal: SIZE(10),
        paddingVertical: SIZE(10),
        backgroundColor: Colors.light.tabIconSelected,
        borderRadius: SIZE(6),
        position: "absolute",
        bottom: "55%",
        right: "5%",
    },
    stopCastText: {
        color: Colors.light.white,
        fontSize: SIZE(16),
        fontWeight: "bold",
    },
    tapToControlText: {
        color: Colors.light.tabIconSelected,
        fontSize: SIZE(14),
        marginTop: SIZE(30),
    },
    castSkipButton: {
        position: "absolute",
        bottom: "70%",
        left: "8%",
    },
    skipButtonContent: {
        alignItems: "center",
    },
    skipButtonText: {
        fontSize: SIZE(12),
        color: Colors.light.tabIconSelected,
        marginTop: SIZE(5),
    },
    noCastContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: SIZE(40),
    },
    noCastTitle: {
        fontSize: SIZE(18),
        color: Colors.light.tabIconSelected,
        marginTop: SIZE(20),
        fontWeight: "bold",
    },
    noCastSubtitle: {
        fontSize: SIZE(18),
        color: Colors.light.tabIconSelected,
        marginTop: SIZE(10),
        textAlign: "center",
    },
    noCastText: {
        fontSize: SIZE(14),
        color: Colors.light.tabIconSelected,
        marginTop: SIZE(20),
        textAlign: "center",
        lineHeight: SIZE(20),
    },
});

export default React.memo(CastPlayer);
