import {
    ActivityIndicator,
    StyleSheet,
    View,
    ImageBackground,
    ScrollView,
} from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { useRoute } from "@react-navigation/native";
import { apiConfig } from "../../../AxiosConfig";
import { FlashList } from "@shopify/flash-list";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import VideoPlayer from "./VideoPlayer";
import { Picker } from "@react-native-picker/picker";
import { Colors } from "@/constants/Colors";
import { SIZE } from "@/constants/Constants";
import { TouchableRipple } from "react-native-paper";
import { useFullscreen } from "../../../hooks/FullScreenContext";
import Constants from "expo-constants";
import FastImage from "@d11/react-native-fast-image";
import VideoLoader from "./VideoLoader";
import ServerTab from "./ServerTab";
import DropDownTab from "./DropDownTab";

const SinglePage = () => {
    const { isFullscreenContext } = useFullscreen();
    const route = useRoute();
    const [episodes, setEpisodes] = useState([]);
    const [videoData, setVideoData] = useState(null);
    const [currentRange, setCurrentRange] = useState({ start: 0, end: 50 });
    const [selectedRange, setSelectedRange] = useState("1-50");
    const [pageLoading, setPageLoading] = useState(true);
    const [episodeLoading, setEpisodeLoading] = useState(true);
    const [videoLoading, setVideoLoading] = useState(false);
    const [selectedEpisode, setSelectedEpisode] = useState();
    const [activeTab, setActiveTab] = useState("sub");
    const [activeSubTab, setActiveSubTab] = useState();
    const [servers, setServers] = useState();
    const [animeInfo, setAnimeInfo] = useState();
    const [availableQualities, setAvailableQualities] = useState(["auto"]);
    const [currentPlayingEpisodeId, setCurrentPlayingEpisodeId] =
        useState(null);
    const [currentPlaybackTime, setCurrentPlaybackTime] = useState(0);

    const getEpisodes = async () => {
        try {
            const response = await apiConfig.get(
                `/api/v2/hianime/anime/${route?.params?.id}/episodes`
            );
            setEpisodes(response.data.data.episodes);
            setEpisodeLoading(false);
        } catch (error) {
            console.log(error, "axios error");
            setEpisodeLoading(false);
        }
    };
    const getAnimeInfo = async () => {
        try {
            const response = await apiConfig.get(
                `/api/v2/hianime/anime/${route?.params?.id}`
            );
            setAnimeInfo(response.data.data);
            setPageLoading(false);
        } catch (error) {
            console.log(error, "axios error");
        }
    };

    const getQtipInfo = async () => {
        try {
            const response = await apiConfig.get(
                `/api/v2/hianime/qtip/${route?.params?.id}`
            );
            const quality = response.data.data.anime.quality;

            let qualityOptions = ["auto"];

            if (quality === "SD") {
                qualityOptions.push(480, 360);
            } else if (quality === "HD") {
                qualityOptions.push(1080, 720, 480, 360);
            }

            setAvailableQualities(qualityOptions);
        } catch (error) {
            console.log(error, "axios error");
        }
    };

    const startStream = useCallback(
        async (id, number) => {
            setVideoLoading(true);
            try {
                const serverResponse = await apiConfig.get(
                    `/api/v2/hianime/episode/servers?animeEpisodeId=${id}?ep=${number}`
                );
                const servers = serverResponse.data.data;
                setServers(servers);

                const selectedServer =
                    activeSubTab || servers[activeTab]?.[0]?.serverName;
                setActiveSubTab(selectedServer);

                const streamResponse = await apiConfig.get(
                    `/api/v2/hianime/episode/sources?animeEpisodeId=${id}?server=${selectedServer}&category=${activeTab}`
                );
                setVideoData(streamResponse.data.data);
                if (currentPlayingEpisodeId !== id) {
                    setCurrentPlaybackTime(0);
                    setCurrentPlayingEpisodeId(id);
                }
            } catch (error) {
                console.log(error, "axios error");
            } finally {
                setVideoLoading(false);
            }
        },
        [activeSubTab, activeTab, currentPlayingEpisodeId]
    );

    useEffect(() => {
        if (selectedEpisode && activeSubTab) {
            const episode = episodes.find(
                (ep) => ep.number === selectedEpisode
            );
            if (episode) {
                startStream(episode.episodeId, episode.number);
            }
        }
    }, [activeSubTab, activeTab]);

    useEffect(() => {
        getEpisodes();
        getAnimeInfo();
        getQtipInfo();
    }, []);
    useEffect(() => {
        if (
            (route.params?.history === "true" ||
                route.params?.history === true) &&
            route.params?.episode &&
            episodes?.length > 0
        ) {
            const episodeToPlay = episodes.find(
                (ep) => ep.number === Number(route.params.episode)
            );

            if (episodeToPlay) {
                setSelectedEpisode(episodeToPlay.number);
                startStream(episodeToPlay.episodeId, episodeToPlay.number);
            }
        }
    }, [episodes, route.params?.history, route.params?.episode]);

    const handlePlaybackTimeUpdate = (time) => {
        setCurrentPlaybackTime(time);
    };

    const handleRangeChange = (range) => {
        const [start, end] = range.split("-").map(Number);
        setCurrentRange({ start: start - 1, end });
        setSelectedRange(range);
    };

    const generateRangeOptions = () => {
        const totalEpisodes = episodes.length;
        const rangeOptions = [];
        for (let i = 0; i < totalEpisodes; i += 50) {
            const start = i + 1;
            const end = Math.min(i + 50, totalEpisodes);
            rangeOptions.push(`${start}-${end}`);
        }
        return rangeOptions;
    };

    const getEpisodesForCurrentRange = () => {
        return episodes.slice(currentRange.start, currentRange.end);
    };

    if (pageLoading) {
        return (
            <ActivityIndicator
                size={"large"}
                color={Colors.light.tabIconSelected}
                style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                }}
            />
        );
    }

    return (
        <View
            style={{
                flex: 1,
                paddingTop: isFullscreenContext
                    ? SIZE(0)
                    : Constants.statusBarHeight,
            }}
        >
            {!videoLoading && videoData ? (
                <VideoPlayer
                    videoUrl={videoData.sources[0].url}
                    subtitlesData={videoData?.tracks?.filter(
                        (track) => track?.label
                    )}
                    onLoadStart={() => setVideoLoading(true)}
                    onReadyForDisplay={() => setVideoLoading(false)}
                    availableQualities={availableQualities}
                    title={animeInfo?.anime?.info?.name}
                    initialPlaybackTime={currentPlaybackTime}
                    onPlaybackTimeUpdate={handlePlaybackTimeUpdate}
                    selectedEpisode={selectedEpisode}
                    episodes={episodes}
                    setSelectedEpisode={setSelectedEpisode}
                    startStream={startStream}
                    animeId={route?.params?.id}
                />
            ) : (
                <ThemedView style={styles.imageContainer}>
                    <ImageBackground
                        style={[
                            styles.backgroundImage,
                            {
                                position: videoLoading
                                    ? "absolute"
                                    : "relative",
                            },
                        ]}
                        source={{ uri: animeInfo?.anime?.info?.poster }}
                        resizeMode="cover"
                        blurRadius={2}
                    >
                        <FastImage
                            style={[
                                styles.fastImage,
                                {
                                    position: videoLoading
                                        ? "absolute"
                                        : "relative",
                                },
                            ]}
                            source={{ uri: animeInfo?.anime?.info?.poster }}
                            resizeMode="contain"
                        />
                        {videoLoading && (
                            <VideoLoader selectedEpisode={selectedEpisode} />
                        )}
                    </ImageBackground>
                </ThemedView>
            )}
            <ThemedView style={styles.container}>
                <ThemedText
                    type="title"
                    style={{
                        color: Colors.light.tabIconSelected,
                        fontSize: SIZE(25),
                        marginBottom: SIZE(10),
                    }}
                >
                    {animeInfo?.anime?.info?.name} (
                    {animeInfo?.anime?.moreInfo?.japanese})
                </ThemedText>
                <ScrollView style={{ maxHeight: SIZE(55) }}>
                    <ThemedText
                        type="subtitle"
                        style={{
                            color: Colors.light.tabIconSelected,
                            fontSize: SIZE(12),
                        }}
                    >
                        {animeInfo?.anime?.info?.description}
                    </ThemedText>
                </ScrollView>
                <ThemedText
                    type="subtitle"
                    style={{
                        color: Colors.light.tabIconSelected,
                        fontSize: SIZE(12),
                        marginVertical: SIZE(10),
                    }}
                >
                    Aired : {animeInfo?.anime?.moreInfo?.aired}
                </ThemedText>
                <ServerTab
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    servers={servers}
                />
                {activeTab === "sub" && (
                    <View style={styles.subTabContainer}>
                        {servers?.sub?.map((item, index) => (
                            <DropDownTab
                                key={index}
                                item={item}
                                activeSubTab={activeSubTab}
                                setActiveSubTab={setActiveSubTab}
                            />
                        ))}
                    </View>
                )}

                {activeTab === "dub" && (
                    <View style={styles.subTabContainer}>
                        {servers?.dub?.map((item, index) => (
                            <DropDownTab
                                key={index}
                                item={item}
                                activeSubTab={activeSubTab}
                                setActiveSubTab={setActiveSubTab}
                            />
                        ))}
                    </View>
                )}

                {activeTab === "raw" && (
                    <View style={styles.subTabContainer}>
                        {servers?.raw?.map((item, index) => (
                            <DropDownTab
                                key={index}
                                item={item}
                                activeSubTab={activeSubTab}
                                setActiveSubTab={setActiveSubTab}
                            />
                        ))}
                    </View>
                )}
                {episodeLoading ? (
                    <ActivityIndicator
                        size={"large"}
                        color={Colors.light.tabIconSelected}
                        style={{ flex: 1 }}
                    />
                ) : (
                    <>
                        {/* Picker for episode range selection */}
                        <View
                            style={[
                                styles.pickerContainer,
                                {
                                    borderColor: Colors.light.tabIconSelected,
                                },
                            ]}
                        >
                            <Picker
                                dropdownIconColor={Colors.light.tabIconSelected}
                                selectedValue={selectedRange}
                                onValueChange={handleRangeChange}
                                itemStyle={{ fontFamily: "Exo2Regular" }}
                                style={[
                                    styles.picker,
                                    {
                                        color: Colors.light.tabIconSelected,
                                        fontFamily: "Exo2Regular",
                                    },
                                ]}
                                mode="dropdown"
                            >
                                {generateRangeOptions().map((range, index) => (
                                    <Picker.Item
                                        key={index}
                                        label={range}
                                        value={range}
                                        style={{
                                            color: Colors.light.tabIconSelected,
                                            fontFamily: "Exo2Regular",
                                        }}
                                    />
                                ))}
                            </Picker>
                        </View>
                        {/* FlashList for displaying episodes */}
                        <FlashList
                            data={getEpisodesForCurrentRange()}
                            keyExtractor={(item, index) => index.toString()}
                            numColumns={8} // Set the number of columns for the grid
                            estimatedItemSize={50}
                            renderItem={({ item }) => (
                                <TouchableRipple
                                    rippleColor="rgba(140, 82, 255, 0.5)"
                                    borderless={true}
                                    disabled={selectedEpisode == item?.number}
                                    style={[
                                        styles.episodeButton,
                                        {
                                            backgroundColor:
                                                selectedEpisode == item?.number
                                                    ? Colors.light
                                                          .tabIconSelected
                                                    : null,
                                            borderColor:
                                                Colors.light.tabIconSelected,
                                        },
                                    ]}
                                    onPress={() => {
                                        setCurrentPlayingEpisodeId(
                                            item.episodeId
                                        );
                                        setSelectedEpisode(item?.number);
                                        startStream(
                                            item?.episodeId,
                                            item?.number
                                        );
                                    }}
                                >
                                    <ThemedText
                                        type="subtitle"
                                        style={[styles.episodeText, {}]}
                                    >
                                        {item?.number}
                                    </ThemedText>
                                </TouchableRipple>
                            )}
                            contentContainerStyle={styles.episodeList}
                        />
                    </>
                )}
            </ThemedView>
        </View>
    );
};

export default SinglePage;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: SIZE(16),
    },
    imageContainer: {
        height: SIZE(250),
        backgroundColor: "#000",
        justifyContent: "center",
        alignItems: "center",
    },
    backgroundImage: {
        height: "100%",
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
    },
    fastImage: {
        height: "100%",
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    title: {
        fontSize: SIZE(24),
        marginBottom: SIZE(16),
    },
    pickerContainer: {
        borderWidth: SIZE(1),
        borderColor: "#333",
        borderRadius: SIZE(8),
        marginBottom: SIZE(16),
        width: "35%",
    },
    picker: {
        width: "100%",
    },
    episodeList: {
        paddingVertical: SIZE(16),
    },
    episodeButton: {
        width: "90%",
        aspectRatio: 1,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: SIZE(1),
        borderColor: "#333",
        borderRadius: SIZE(8),
        margin: SIZE(4),
    },
    episodeText: {
        fontSize: SIZE(16),
    },

    subTabContainer: {
        flexDirection: "row",
        justifyContent: "space-evenly",
        marginBottom: SIZE(10),
    },

    contentContainer: { marginTop: SIZE(20), alignItems: "center" },
    contentText: { fontSize: SIZE(18), color: "#333" },
});
