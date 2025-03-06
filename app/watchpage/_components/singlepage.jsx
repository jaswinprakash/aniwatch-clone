import {
    ActivityIndicator,
    StyleSheet,
    View,
    ImageBackground,
    Text,
} from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { useRoute } from "@react-navigation/native";
import { apiConfig } from "../../../AxiosConfig";
import { FlashList } from "@shopify/flash-list";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import VideoPlayer from "./VideoPlayer";
import { Colors } from "@/constants/Colors";
import { SIZE } from "@/constants/Constants";
import { TextInput, TouchableRipple } from "react-native-paper";
import { useFullscreen } from "../../../hooks/FullScreenContext";
import Constants from "expo-constants";
import FastImage from "@d11/react-native-fast-image";
import VideoLoader from "./VideoLoader";
import ServerTab from "./ServerTab";
import DropDownTab from "./DropDownTab";
import { Dropdown } from "react-native-element-dropdown";
import LottieView from "lottie-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
    const [selectedEpisodeId, setSelectedEpisodeId] = useState();
    const [activeTab, setActiveTab] = useState("");
    const [activeSubTab, setActiveSubTab] = useState("hd-1");
    const [servers, setServers] = useState();
    const [animeInfo, setAnimeInfo] = useState();
    const [availableQualities, setAvailableQualities] = useState(["auto"]);
    const [currentPlayingEpisodeId, setCurrentPlayingEpisodeId] =
        useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);

    const getEpisodes = async () => {
        try {
            const response = await apiConfig.get(
                `/api/v2/hianime/anime/${route?.params?.id}/episodes`
            );
            setEpisodes(response.data.data.episodes);
            setEpisodeLoading(false);
        } catch (error) {
            console.log(error, "axios error - episodes");
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
            console.log(error, "axios error - info play page");
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
            console.log(error, "axios error - quality play page");
        }
    };

    const startStream = useCallback(
        async (id, number) => {
            setVideoLoading(true);
            setVideoData(null);
            try {
                const serverResponse = await apiConfig.get(
                    `/api/v2/hianime/episode/servers?animeEpisodeId=${id}?ep=${number}`
                );
                const servers = serverResponse.data.data;
                setServers(servers);

                const parentKey = Object.keys(servers).find(
                    (key) => servers[key]?.length > 0
                );

                if (!activeTab) {
                    if (parentKey) {
                        setActiveTab(parentKey);
                    } else {
                        console.log("No servers available in any parent key.");
                    }
                } else if (!servers[activeTab]?.length) {
                    if (parentKey) {
                        setActiveTab(parentKey);
                    } else {
                        console.log("No servers available in any parent key.");
                    }
                }

                const streamResponse = await apiConfig.get(
                    `/api/v2/hianime/episode/sources?animeEpisodeId=${id}?server=${activeSubTab}&category=${activeTab}`
                );
                setVideoData(streamResponse.data.data);

                if (currentPlayingEpisodeId !== id) {
                    setCurrentPlayingEpisodeId(id);
                }
            } catch (error) {
                console.log(error, "axios error - stream");
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
                setSelectedEpisodeId(episodeToPlay.episodeId);
                startStream(episodeToPlay.episodeId, episodeToPlay.number);
                adjustRangeForSelectedEpisode(episodeToPlay.number);
            }
        } else {
            setSelectedEpisode(episodes[0]?.number);
            setSelectedEpisodeId(episodes[0]?.episodeId);
            startStream(episodes[0]?.episodeId, episodes[0]?.number);
        }
    }, [episodes, route.params?.history, route.params?.episode]);

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

    useEffect(() => {
        if (
            episodes.length > 0 &&
            (!route.params?.history === "true" ||
                !route.params?.history === true)
        ) {
            const totalEpisodes = episodes.length;
            const defaultRange = `1-${Math.min(50, totalEpisodes)}`;
            setSelectedRange(defaultRange);
            setCurrentRange({ start: 0, end: Math.min(50, totalEpisodes) });
        }
    }, [episodes]);

    const getEpisodesForCurrentRange = () => {
        if (searchQuery) {
            return searchResults;
        }
        return episodes.slice(currentRange.start, currentRange.end);
    };
    const handleRangeChange = (range) => {
        const [start, end] = range.split("-").map(Number);
        setCurrentRange({ start: start - 1, end });
        setSelectedRange(range);
    };

    const adjustRangeForSelectedEpisode = (episodeNumber) => {
        const episodeIndex = episodes.findIndex(
            (ep) => ep.number === episodeNumber
        );
        if (episodeIndex === -1) return;

        const rangeSize = 50;
        const start = Math.floor(episodeIndex / rangeSize) * rangeSize;
        const end = Math.min(start + rangeSize, episodes.length);

        setCurrentRange({ start, end });
        setSelectedRange(`${start + 1}-${end}`);
    };

    const handleSearch = (query) => {
        setSearchQuery(query);
        if (query) {
            const filteredEpisodes = episodes.filter((episode) =>
                episode.number.toString().includes(query)
            );
            setSearchResults(filteredEpisodes);
        } else {
            setSearchResults([]);
        }
    };
    if (pageLoading) {
        return (
            <SafeAreaView
                style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: Colors.dark.background,
                }}
            >
                <LottieView
                    source={require("../../../assets/lottie/loader-3.json")}
                    autoPlay
                    loop
                    style={{
                        width: SIZE(200),
                        height: SIZE(200),
                    }}
                />
            </SafeAreaView>
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
                    selectedEpisode={selectedEpisode}
                    episodes={episodes}
                    setSelectedEpisode={setSelectedEpisode}
                    selectedEpisodeId={selectedEpisodeId}
                    currentPlayingEpisodeId={currentPlayingEpisodeId}
                    startStream={startStream}
                    setCurrentPlayingEpisodeId={setCurrentPlayingEpisodeId}
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
                    {animeInfo?.anime?.info?.name}
                </ThemedText>
                <View
                    style={{
                        borderWidth: SIZE(1),
                        borderColor: Colors.light.tabIconSelected,
                        borderRadius: SIZE(8),
                        marginBottom: SIZE(10),
                        padding: SIZE(10),
                    }}
                >
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
                </View>
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <ThemedText
                        type="subtitle"
                        style={{
                            color: Colors.light.tabIconSelected,
                            marginBottom: SIZE(10),
                            fontSize: SIZE(16),
                        }}
                    >
                        List of episodes
                    </ThemedText>
                    <ThemedText
                        type="subtitle"
                        style={{
                            color: Colors.light.tabIconSelected,
                            marginBottom: SIZE(10),
                            fontSize: SIZE(16),
                        }}
                    >
                        Search episodes
                    </ThemedText>
                </View>
                {episodeLoading ? (
                    <ActivityIndicator
                        size={"large"}
                        color={Colors.light.tabIconSelected}
                        style={{ flex: 1 }}
                    />
                ) : (
                    <>
                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "space-between",
                            }}
                        >
                            <View
                                style={[
                                    styles.pickerContainer,
                                    {
                                        borderColor:
                                            Colors.light.tabIconSelected,
                                    },
                                ]}
                            >
                                <Dropdown
                                    data={generateRangeOptions().map(
                                        (range) => ({
                                            label: range,
                                            value: range,
                                        })
                                    )}
                                    labelField="label"
                                    valueField="value"
                                    placeholder={selectedRange}
                                    value={selectedRange}
                                    onChange={(item) =>
                                        handleRangeChange(item.value)
                                    }
                                    style={styles.dropdown}
                                    placeholderStyle={styles.placeholderStyle}
                                    selectedTextStyle={styles.selectedTextStyle}
                                    containerStyle={styles.dropdownContainer}
                                    renderItem={(item) => {
                                        const isSelected =
                                            item.value === selectedRange;
                                        return (
                                            <View
                                                style={[
                                                    styles.itemContainer,
                                                    isSelected &&
                                                        styles.selectedItemContainer,
                                                ]}
                                            >
                                                <Text
                                                    style={[
                                                        styles.itemText,
                                                        isSelected &&
                                                            styles.selectedItemText,
                                                    ]}
                                                >
                                                    {item.label}
                                                </Text>
                                            </View>
                                        );
                                    }}
                                    dropdownPosition="auto"
                                    iconColor={Colors.light.tabIconSelected}
                                />
                            </View>
                            <View>
                                <TextInput
                                    contentStyle={{
                                        fontFamily: "Exo2Medium",
                                        fontSize: SIZE(14),
                                    }}
                                    placeholderTextColor={
                                        Colors.light.tabIconSelected
                                    }
                                    outlineStyle={{
                                        borderColor:
                                            Colors.light.tabIconSelected,
                                        borderRadius: SIZE(10),
                                        fontSize: SIZE(10),
                                    }}
                                    outlineColor={Colors.light.tabIconSelected}
                                    textColor={Colors.light.tabIconSelected}
                                    theme={{
                                        colors: {
                                            primary:
                                                Colors.light.tabIconSelected,
                                            onSurfaceVariant:
                                                Colors.light.tabIconSelected,
                                        },
                                        fonts: {
                                            bodyLarge: {
                                                fontFamily: "Exo2Medium",
                                                fontSize: SIZE(10),
                                            },
                                        },
                                    }}
                                    left={
                                        <TextInput.Icon
                                            icon="magnify"
                                            color={Colors.light.tabIconSelected}
                                            size={SIZE(24)}
                                        />
                                    }
                                    style={{
                                        height: SIZE(40),
                                        backgroundColor: "transparent",
                                    }}
                                    mode="outlined"
                                    label="Search "
                                    value={searchQuery}
                                    onChangeText={handleSearch}
                                />
                            </View>
                        </View>
                        <FlashList
                            data={getEpisodesForCurrentRange()}
                            keyExtractor={(item, index) => index.toString()}
                            numColumns={8}
                            estimatedItemSize={50}
                            renderItem={({ item }) => (
                                <TouchableRipple
                                    rippleColor={Colors.dark.backgroundPress}
                                    borderless={true}
                                    disabled={selectedEpisode === item?.number}
                                    style={[
                                        styles.episodeButton,
                                        {
                                            backgroundColor:
                                                selectedEpisode === item?.number
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
                                        setSelectedEpisodeId(item?.episodeId);
                                        startStream(
                                            item?.episodeId,
                                            item?.number
                                        );
                                        adjustRangeForSelectedEpisode(
                                            item?.number
                                        );
                                        setSearchQuery("");
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
        backgroundColor: Colors.dark.black,
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
        borderColor: "#333",
        borderRadius: SIZE(8),
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
    dropdown: {
        width: "100%",
        height: SIZE(40),
        borderColor: Colors.light.tabIconSelected,
        borderWidth: SIZE(1),
        borderRadius: SIZE(8),
        paddingHorizontal: SIZE(10),
    },
    placeholderStyle: {
        color: Colors.light.tabIconSelected,
        fontFamily: "Exo2Regular",
    },
    selectedTextStyle: {
        color: Colors.light.tabIconSelected,
        fontFamily: "Exo2Regular",
    },
    dropdownContainer: {
        borderColor: Colors.light.tabIconSelected,
        borderRadius: SIZE(8),
        overflow: "hidden",
    },
    itemContainer: {
        padding: SIZE(10),
        backgroundColor: Colors.dark.background,
        overflow: "hidden",
    },
    selectedItemContainer: {
        backgroundColor: Colors.light.tabIconSelected,
        overflow: "hidden",
    },
    itemText: {
        color: Colors.light.tabIconSelected,
        fontFamily: "Exo2Regular",
    },
    selectedItemText: {
        color: Colors.light.white,
    },
});
