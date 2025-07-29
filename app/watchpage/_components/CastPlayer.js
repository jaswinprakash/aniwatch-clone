import { Colors } from "@/constants/Colors";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { Slider } from "@react-native-assets/slider";
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    Alert,
    Platform,
    StyleSheet,
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
    setSelectedEpisodeName,
    selectedEpisodeName,
}) => {
    // Cast hooks and refs
    const client = useRemoteMediaClient();
    const sessionManager = GoogleCast.getSessionManager();
    const castState = useCastState();
    const castProgressIntervalRef = useRef(null);

    // Player states
    const [castCurrentTime, setCastCurrentTime] = useState(0);
    const [castDuration, setCastDuration] = useState(0);
    const [castIsPlaying, setCastIsPlaying] = useState(false);
    const [isSeeking, setIsSeeking] = useState(false);
    const [seekPosition, setSeekPosition] = useState(0);
    const [selectedSubtitle, setSelectedSubtitle] = useState(null);
    const [activeTrackIds, setActiveTrackIds] = useState([]);

    // Control flags
    const [isCastingInProgress, setIsCastingInProgress] = useState(false);
    const [hasLoadedMedia, setHasLoadedMedia] = useState(false);
    const [showSkipIntro, setShowSkipIntro] = useState(false);
    const [showSkipOutro, setShowSkipOutro] = useState(false);
    const [subSyncValue, setSubSyncValue] = useState(0.2);

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

    // Memoized values
    const sliderValue = useMemo(
        () => (castDuration > 0 ? (castCurrentTime / castDuration) * 100 : 0),
        [castCurrentTime, castDuration]
    );

    const formattedCurrentTime = useMemo(
        () => formatTime(isSeeking ? seekPosition : castCurrentTime),
        [isSeeking, seekPosition, castCurrentTime]
    );

    const formattedDuration = useMemo(
        () => formatTime(castDuration),
        [castDuration]
    );

    // Check Google Play Services on Android
    useEffect(() => {
        if (Platform.OS === "android") {
            CastContext.getPlayServicesState()
                .then((state) => {
                    if (state && state !== PlayServicesState.SUCCESS) {
                        CastContext.showPlayServicesErrorDialog(state);
                    }
                })
                .catch(console.warn);
        }
    }, []);

    // Initialize from history
    useEffect(() => {
        const animeData = history.find(
            (item) =>
                item.animeId === animeId &&
                item.episodeNumber === selectedEpisode &&
                item.selectedEpisodeId === selectedEpisodeId
        );
        setCastCurrentTime(animeData?.currentTime || 0);
    }, [animeId, selectedEpisode, selectedEpisodeId, history]);

    // Auto-select English subtitle
    useEffect(() => {
        if (subtitlesData?.length) {
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
    const checkForIntroOutro = useCallback(
        (currentTime) => {
            setShowSkipIntro(
                intro
                    ? currentTime >= intro.start && currentTime <= intro.end
                    : false
            );
            setShowSkipOutro(
                outro
                    ? currentTime >= outro.start && currentTime <= outro.end
                    : false
            );
        },
        [intro, outro]
    );

    // Skip segments
    const skipSegment = useCallback(
        (segment) => {
            if (!client) return;

            const position = segment === "intro" ? intro?.end : outro?.end;
            if (position) {
                client.seek({ position }).catch(console.error);
            }
        },
        [client, intro, outro]
    );

    // Toggle play/pause
    const togglePlayPause = useCallback(() => {
        if (!client) return;

        const action = castIsPlaying ? client.pause() : client.play();
        action
            .then(() => setCastIsPlaying(!castIsPlaying))
            .catch(console.error);
    }, [client, castIsPlaying]);

    // Skip forward/backward
    const skip = useCallback(
        (seconds) => {
            if (!client) return;

            const newTime = Math.max(
                0,
                Math.min(castCurrentTime + seconds, castDuration)
            );
            client.seek({ position: newTime }).catch(console.error);
        },
        [client, castCurrentTime, castDuration]
    );

    // Subtitle selection
    const selectSubtitle = useCallback(
        async (subtitle) => {
            setSelectedSubtitle(subtitle);

            if (client && hasLoadedMedia) {
                try {
                    const textTrackStyle = {
                        backgroundColor: "#00000000",
                        foregroundColor: "#FFFFFF",
                        edgeColor: "#000000",
                        edgeType: "outline",
                        fontFamily: "sans-serif",
                        fontScale: 1.0,
                    };

                    const trackIds = subtitle?.id ? [subtitle.id] : [];
                    await Promise.all([
                        client.setActiveTrackIds(trackIds),
                        client.setTextTrackStyle(textTrackStyle),
                    ]);
                    setActiveTrackIds(trackIds);
                } catch (error) {
                    console.error("Subtitle change failed:", error);
                }
            }
        },
        [client, hasLoadedMedia]
    );

    // Episode navigation
    const navigateEpisode = useCallback(
        (direction) => {
            const episode = episodes.find(
                (ep) => ep.number === selectedEpisode + direction
            );
            if (episode) {
                setSelectedEpisode(episode.number);
                setSelectedEpisodeName(episode.title);
                startStream(episode.episodeId, episode.number);
            }
        },
        [
            episodes,
            selectedEpisode,
            setSelectedEpisode,
            setSelectedEpisodeName,
            startStream,
        ]
    );

    const nextEpisode = useCallback(
        () => navigateEpisode(1),
        [navigateEpisode]
    );
    const prevEpisode = useCallback(
        () => navigateEpisode(-1),
        [navigateEpisode]
    );

    // Format time display
    const formatTime = useCallback((seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
    }, []);

    // Handle slider seek
    const handleSeek = useCallback(
        (value) => {
            if (!client) return;

            const seekTime = (value / 100) * castDuration;
            setIsSeeking(true);
            setSeekPosition(seekTime);

            client
                .seek({ position: seekTime })
                .then(() => setIsSeeking(false))
                .catch(() => setIsSeeking(false));
        },
        [client, castDuration]
    );

    // Start casting
    const startCasting = useCallback(async () => {
        if (
            !client ||
            !videoUrl ||
            isCastingInProgress ||
            hasLoadedMedia ||
            videoLoading
        )
            return;

        setIsCastingInProgress(true);

        try {
            const mediaTracks =
                subtitlesData?.map((sub, index) => ({
                    id: index + 1,
                    type: "text",
                    subtype: "subtitles",
                    name: sub.label || `Subtitle ${index + 1}`,
                    contentId: sub.file,
                    language: sub.language || "en-US",
                })) || [];

            const defaultTrackId =
                mediaTracks.find((sub) =>
                    sub.name.toLowerCase().includes("english")
                )?.id || mediaTracks[0]?.id;

            const mediaLoadRequest = {
                mediaInfo: {
                    contentUrl: videoUrl,
                    contentType: "application/x-mpegURL",
                    metadata: {
                        images: [{ url: uri }],
                        title: selectedEpisodeName,
                        seriesTitle: title,
                        type: "tvShow",
                        episodeNumber: selectedEpisode,
                    },
                    mediaTracks,
                },
                startTime: castCurrentTime || 0,
                autoplay: true,
            };

            await client.loadMedia(mediaLoadRequest);
            setHasLoadedMedia(true);
            setCastIsPlaying(true);

            if (defaultTrackId) {
                setTimeout(() => {
                    client
                        .setActiveTrackIds([defaultTrackId])
                        .then(() => setActiveTrackIds([defaultTrackId]))
                        .catch(console.error);
                }, 2000);
            }
        } catch (error) {
            console.error("Cast error:", error);
            Alert.alert(
                error.message.includes("2103")
                    ? "Stream Not Supported"
                    : "Casting Error",
                error.message.includes("2103")
                    ? "This video format cannot be played on your Chromecast device. Try a different quality."
                    : `Unable to cast: ${error.message}`
            );
            setHasLoadedMedia(false);
        } finally {
            setIsCastingInProgress(false);
        }
    }, [
        client,
        videoUrl,
        subtitlesData,
        isCastingInProgress,
        hasLoadedMedia,
        videoLoading,
        castCurrentTime,
        selectedEpisodeName,
        title,
        selectedEpisode,
        uri,
    ]);

    // Stop casting
    const stopCasting = useCallback(() => {
        if (!client) return;

        client
            .stop()
            .then(() => {
                setCastIsPlaying(false);
                setCastCurrentTime(0);
                setCastDuration(0);
                setHasLoadedMedia(false);
                setIsCastingInProgress(false);
                setActiveTrackIds([]);
            })
            .catch(console.error);
    }, [client]);

    // Monitor cast progress
    useEffect(() => {
        if (!isCasting || !client || !hasLoadedMedia) {
            if (castProgressIntervalRef.current) {
                clearInterval(castProgressIntervalRef.current);
            }
            return;
        }

        const updateProgress = async () => {
            try {
                const [streamPosition, mediaStatus] = await Promise.all([
                    client.getStreamPosition(),
                    client.getMediaStatus(),
                ]);

                if (!mediaStatus) return;

                const currentTime = streamPosition || 0;
                const duration = mediaStatus.mediaInfo?.streamDuration || 0;
                const isPlaying = mediaStatus.playerState === "playing";

                checkForIntroOutro(currentTime);
                setCastCurrentTime(currentTime);
                setCastDuration(duration);
                setCastIsPlaying(isPlaying);

                if (mediaStatus.activeTrackIds) {
                    setActiveTrackIds(mediaStatus.activeTrackIds);
                }

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

                if (mediaStatus.playerState === "idle") {
                    if (mediaStatus.idleReason === "finished") {
                        nextEpisode();
                    } else if (mediaStatus.idleReason === "error") {
                        Alert.alert(
                            "Playback Error",
                            "Error playing on cast device"
                        );
                    }
                }
            } catch (error) {
                console.error("Progress update error:", error);
            }
        };

        castProgressIntervalRef.current = setInterval(updateProgress, 1000);
        return () => clearInterval(castProgressIntervalRef.current);
    }, [
        isCasting,
        client,
        hasLoadedMedia,
        selectedEpisode,
        animeId,
        selectedEpisodeId,
        selectedEpisodeName,
        throttledUpdate,
        checkForIntroOutro,
        nextEpisode,
    ]);

    // Auto-start casting when conditions are met
    useEffect(() => {
        if (
            client &&
            videoUrl &&
            !videoLoading &&
            !isCastingInProgress &&
            !hasLoadedMedia
        ) {
            const timer = setTimeout(startCasting, 1000);
            return () => clearTimeout(timer);
        }
    }, [
        client,
        videoUrl,
        videoLoading,
        isCastingInProgress,
        hasLoadedMedia,
        startCasting,
    ]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (castProgressIntervalRef.current) {
                clearInterval(castProgressIntervalRef.current);
            }
            stopCasting();
        };
    }, [stopCasting]);

    // Render controls
    const renderControls = useMemo(
        () => (
            <View style={styles.castControlsContainer}>
                <View style={styles.sliderContainer}>
                    <ThemedText style={styles.timeText}>
                        {formattedCurrentTime}
                    </ThemedText>
                    <Slider
                        style={styles.slider}
                        minimumValue={0}
                        maximumValue={100}
                        value={sliderValue}
                        onValueChange={(value) => {
                            setSeekPosition((value / 100) * castDuration);
                            setIsSeeking(true);
                        }}
                        onSlidingComplete={handleSeek}
                        minimumTrackTintColor={Colors.light.tabIconSelected}
                        maximumTrackTintColor={Colors.dark.backgroundPress}
                        thumbStyle={styles.sliderThumb}
                    />
                    <ThemedText style={styles.timeText}>
                        {formattedDuration}
                    </ThemedText>
                </View>

                <View style={styles.mainControlsRow}>
                    <ControlButton onPress={prevEpisode} icon="skip-previous" />
                    <ControlButton onPress={() => skip(-10)} icon="replay-10" />
                    <ControlButton
                        onPress={togglePlayPause}
                        icon={castIsPlaying ? "pause" : "play-arrow"}
                        isPlayButton
                    />
                    <ControlButton onPress={() => skip(10)} icon="forward-10" />
                    <ControlButton onPress={nextEpisode} icon="skip-next" />
                </View>
            </View>
        ),
        [
            formattedCurrentTime,
            formattedDuration,
            sliderValue,
            castDuration,
            handleSeek,
            prevEpisode,
            nextEpisode,
            skip,
            togglePlayPause,
            castIsPlaying,
        ]
    );

    const renderSkipButton = useMemo(
        () =>
            (showSkipIntro || showSkipOutro) && (
                <TouchableRipple
                    style={styles.castSkipButton}
                    onPress={() =>
                        skipSegment(showSkipIntro ? "intro" : "outro")
                    }
                >
                    <View style={styles.skipButtonContent}>
                        <MaterialCommunityIcons
                            name="skip-forward"
                            size={SIZE(30)}
                            color={Colors.light.tabIconSelected}
                        />
                        <ThemedText style={styles.skipButtonText}>
                            {showSkipIntro ? "Skip Intro" : "Skip Outro"}
                        </ThemedText>
                    </View>
                </TouchableRipple>
            ),
        [showSkipIntro, showSkipOutro, skipSegment]
    );

    return (
        <View style={styles.container}>
            <View style={styles.castButtonContainer}>
                <CastButton style={styles.castButton} />
                {isCastingInProgress && (
                    <ThemedText style={styles.loadingText}>
                        Loading...
                    </ThemedText>
                )}
            </View>

            {isCasting ? (
                <TouchableWithoutFeedback>
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
                            <ThemedText style={styles.castingSubtitle}>
                                {title}
                            </ThemedText>
                            <ThemedText style={styles.castingEpisode}>
                                Episode {selectedEpisode}
                            </ThemedText>

                            {isCastingInProgress && (
                                <ThemedText style={styles.loadingText}>
                                    Loading media...
                                </ThemedText>
                            )}

                            {hasLoadedMedia &&
                                !isCastingInProgress &&
                                renderControls}
                        </View>

                        {renderSkipButton}

                        {showSubtitleList && subtitlesData && (
                            <SubModal
                                data={[
                                    { label: "Off", file: null },
                                    ...subtitlesData,
                                ]}
                                handleChange={selectSubtitle}
                                handleSet={() => setShowSubtitleList(false)}
                                selectedItem={selectedSubtitle}
                            />
                        )}
                    </View>
                </TouchableWithoutFeedback>
            ) : (
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
                            Loading video...
                        </ThemedText>
                    )}
                </View>
            )}
        </View>
    );
};

const ControlButton = ({ onPress, icon, isPlayButton = false }) => (
    <TouchableRipple
        onPress={onPress}
        style={[styles.castControlButton, isPlayButton && styles.playButton]}
    >
        <MaterialIcons
            name={icon}
            size={isPlayButton ? SIZE(25) : SIZE(20)}
            color={Colors.light.white}
        />
    </TouchableRipple>
);

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
        fontSize: SIZE(18),
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
