import { SkeletonLoader } from "@/components/SkeletonLoader";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { SIZE } from "@/constants/Constants";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRoute } from "@react-navigation/native";
import { FlashList } from "@shopify/flash-list";
import Constants from "expo-constants";
import LottieView from "lottie-react-native";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import { TextInput, TouchableRipple } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiConfig, streamApi } from "../../AxiosConfig";
import CustomSwitch from "../../components/CustomSwitch";
import { SIZES } from "../../constants/Constants";
import { useFullscreen } from "../../hooks/FullScreenContext";
import CastPlayer from "./_components/CastPlayer";
import DropDownTab from "./_components/DropDownTab";
import ServerTab from "./_components/ServerTab";
import VideoPlayer from "./_components/VideoPlayer";
import WebViewPlayer from "./_components/WebViewPlayer";

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
    const [selectedEpisodeName, setSelectedEpisodeName] = useState();
    const [activeTab, setActiveTab] = useState("");
    const [activeSubTab, setActiveSubTab] = useState("hd-1");
    const [servers, setServers] = useState();
    const [animeInfo, setAnimeInfo] = useState();
    const [availableQualities, setAvailableQualities] = useState(["auto"]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [error, setError] = useState(false);
    const [idForWebview, setIdForWebview] = useState(null);
    const [webviewOn, setWebviewOn] = useState(false);
    const [castOn, setCastOn] = useState(false);

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
                setError(false);
                const serverResponse = await apiConfig.get(
                    `/api/v2/hianime/episode/servers?animeEpisodeId=${id}`
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

                // const streamResponse = await apiConfig
                //     .get(
                //         `/api/v2/hianime/episode/sources?animeEpisodeId=${id}&server=${activeSubTab}&category=${activeTab}`
                //     )
                //     .catch((error) => {
                //         setTimeout(() => {
                //             setError(true);
                //         }, 1000)
                //     });

                const streamResponseTwo = await streamApi
                    .get(
                        `/api/stream?id=${id}&server=${activeSubTab}&type=${activeTab}`
                    )
                    .catch((error) => {
                        setTimeout(() => {
                            setError(true);
                        }, 1000);
                    });

                const streamingData =
                    streamResponseTwo.data.results.streamingLink;

                const originalUrl = streamingData.link.file;
                const proxyUrl = `https://m3u8-woad.vercel.app/m3u8-proxy?url=${encodeURIComponent(
                    originalUrl
                )}`;

                const validSubtitleTracks = (streamingData.tracks || []).filter(
                    (track) => {
                        return (
                            track?.kind === "captions" &&
                            track?.file &&
                            !track?.file.includes("thumbnails") &&
                            track?.file.endsWith(".vtt")
                        );
                    }
                );

                const videoData = {
                    sources: [
                        {
                            url: proxyUrl,
                            quality: "auto",
                        },
                    ],
                    tracks: validSubtitleTracks,
                    intro: streamingData.intro,
                    outro: streamingData.outro,
                };

                const episodeId = id.split("?ep=")[1];
                setIdForWebview(episodeId);

                // setVideoData(streamResponse.data.data);
                setVideoData(videoData);

                setVideoLoading(false);
            } catch (error) {
                console.log(error, "axios error - stream");
                // setTimeout(() => {
                //     setError(true);
                // }, 1000);
            } finally {
                // setVideoLoading(false);
            }
        },
        [activeSubTab, activeTab]
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
                setSelectedEpisodeName(episodeToPlay.title);
                setSelectedEpisodeId(episodeToPlay.episodeId);
                startStream(episodeToPlay.episodeId, episodeToPlay.number);
                adjustRangeForSelectedEpisode(episodeToPlay.number);
            }
        } else {
            setSelectedEpisode(episodes[0]?.number);
            setSelectedEpisodeName(episodes[0]?.title);
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
        const numericOnly = query.replace(/[^0-9]/g, "");
        const maxEpisodeNumber =
            episodes.length > 0
                ? Math.max(...episodes.map((ep) => ep.number))
                : 0;
        const episodeNumber = parseInt(numericOnly);
        if (episodeNumber > maxEpisodeNumber) {
            setSearchQuery(maxEpisodeNumber.toString());

            const filteredEpisodes = episodes.filter((episode) =>
                episode.number.toString().includes(maxEpisodeNumber.toString())
            );
            setSearchResults(filteredEpisodes);
            return;
        }
        setSearchQuery(numericOnly);
        if (numericOnly) {
            const filteredEpisodes = episodes.filter((episode) =>
                episode.number.toString().includes(numericOnly)
            );
            setSearchResults(filteredEpisodes);
        } else {
            setSearchResults([]);
        }
    };

    const toggleSwitch = () => {
        setWebviewOn(!webviewOn);
        setCastOn(false);
    };

    const toggleCast = () => {
        setCastOn(!castOn);
        setWebviewOn(false);
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
                    source={require("../../assets/lottie/loader2.json")}
                    autoPlay
                    loop
                    style={{
                        width: SIZE(100),
                        height: SIZE(100),
                    }}
                />
            </SafeAreaView>
        );
    }

    return (
        <View
            style={{
                backgroundColor: Colors.dark.background,
                flex: 1,
                paddingTop: isFullscreenContext
                    ? SIZE(0)
                    : Constants.statusBarHeight,
            }}
        >
            {!webviewOn && !castOn ? (
                <VideoPlayer
                    videoUrl={videoData?.sources[0]?.url}
                    subtitlesData={videoData?.tracks}
                    intro={videoData?.intro}
                    outro={videoData?.outro}
                    onLoadStart={() => setVideoLoading(true)}
                    onReadyForDisplay={() => setVideoLoading(false)}
                    availableQualities={availableQualities}
                    title={animeInfo?.anime?.info?.name}
                    selectedEpisode={selectedEpisode}
                    episodes={episodes}
                    setSelectedEpisode={setSelectedEpisode}
                    selectedEpisodeId={selectedEpisodeId}
                    startStream={startStream}
                    animeId={route?.params?.id}
                    uri={animeInfo?.anime?.info?.poster}
                    videoLoading={videoLoading}
                    error={error}
                    episodeLoading={episodeLoading}
                    setSelectedEpisodeName={setSelectedEpisodeName}
                    selectedEpisodeName={selectedEpisodeName}
                />
            ) : !castOn ? (
                <View
                    style={{
                        height: SIZE(250),
                        width: "100%",
                        backgroundColor: "#000",
                    }}
                >
                    <WebViewPlayer
                        idForWebview={idForWebview}
                        activeTab={activeTab}
                        route={route}
                        episodes={episodes}
                        selectedEpisode={selectedEpisode}
                        setSelectedEpisode={setSelectedEpisode}
                        startStream={startStream}
                        uri={animeInfo?.anime?.info?.poster}
                        videoLoading={videoLoading}
                        error={error}
                        episodeLoading={episodeLoading}
                        selectedEpisodeId={selectedEpisodeId}
                        setSelectedEpisodeName={setSelectedEpisodeName}
                        selectedEpisodeName={selectedEpisodeName}
                    />
                </View>
            ) : (
                <CastPlayer
                    videoUrl={videoData?.sources[0]?.url}
                    subtitlesData={videoData?.tracks}
                    intro={videoData?.intro}
                    outro={videoData?.outro}
                    onLoadStart={() => setVideoLoading(true)}
                    onReadyForDisplay={() => setVideoLoading(false)}
                    availableQualities={availableQualities}
                    title={animeInfo?.anime?.info?.name}
                    selectedEpisode={selectedEpisode}
                    episodes={episodes}
                    setSelectedEpisode={setSelectedEpisode}
                    selectedEpisodeId={selectedEpisodeId}
                    startStream={startStream}
                    animeId={route?.params?.id}
                    uri={animeInfo?.anime?.info?.poster}
                    videoLoading={videoLoading}
                    error={error}
                    episodeLoading={episodeLoading}
                    setSelectedEpisodeName={setSelectedEpisodeName}
                    selectedEpisodeName={selectedEpisodeName}
                />
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
                {!activeSubTab || !servers ? (
                    <SkeletonLoader
                        height={SIZE(110)}
                        width={SIZE(100)}
                        style={{
                            width: "100%",
                            marginBottom: SIZE(10),
                            borderRadius: SIZE(8),
                        }}
                        backgroundColor={Colors.dark.background}
                    />
                ) : (
                    <View
                        style={{
                            borderWidth: SIZE(1),
                            borderColor: Colors.light.tabIconSelected,
                            borderRadius: SIZE(8),
                            marginBottom: SIZE(10),
                            padding: SIZE(10),
                            height: SIZE(110),
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
                )}

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
                {getEpisodesForCurrentRange().length === 0 ? (
                    <>
                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: SIZE(20),
                            }}
                        >
                            <SkeletonLoader
                                height={SIZE(40)}
                                width={SIZE(50)}
                                style={{
                                    width: "35%",
                                    marginTop: SIZE(5),
                                    borderRadius: SIZE(8),
                                }}
                                backgroundColor={Colors.dark.background}
                            />
                            <SkeletonLoader
                                height={SIZE(40)}
                                width={SIZE(50)}
                                style={{
                                    width: "35%",
                                    marginTop: SIZE(5),
                                    borderRadius: SIZE(8),
                                }}
                                backgroundColor={Colors.dark.background}
                            />
                        </View>
                        <SkeletonLoader
                            height={SIZE(300)}
                            style={{
                                width: "100%",
                                marginTop: SIZE(5),
                                borderRadius: SIZE(8),
                            }}
                            backgroundColor={Colors.dark.background}
                        />
                    </>
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
                                <MaterialCommunityIcons
                                    name={
                                        webviewOn ? "web-check" : "web-remove"
                                    }
                                    size={SIZE(20)}
                                    color={webviewOn ? "#3AFF6F" : "#3e3e3e"}
                                    style={{ alignSelf: "center" }}
                                />
                                <CustomSwitch
                                    onValueChange={toggleSwitch}
                                    value={webviewOn}
                                />
                            </View>
                            <View>
                                <MaterialCommunityIcons
                                    name={castOn ? "cast-connected" : "cast"}
                                    size={SIZE(20)}
                                    color={castOn ? "#3AFF6F" : "#3e3e3e"}
                                    style={{ alignSelf: "center" }}
                                />
                                <CustomSwitch
                                    onValueChange={toggleCast}
                                    value={castOn}
                                />
                            </View>

                            <View style={{ width: "35%" }}>
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
                                    keyboardType="numeric"
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
                                                    : item?.isFiller
                                                    ? "#005580"
                                                    : "transparent",
                                            borderColor:
                                                Colors.light.tabIconSelected,
                                        },
                                    ]}
                                    onPress={() => {
                                        setSelectedEpisode(item?.number);
                                        setSelectedEpisodeId(item?.episodeId);
                                        setSelectedEpisodeName(item?.title);
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
        textShadowColor: Colors.dark.black,
        textShadowOffset: {
            width: 1,
            height: 1,
        },
        textShadowRadius: 2,
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
        lineHeight: SIZE(18),
    },
    selectedTextStyle: {
        color: Colors.light.tabIconSelected,
        fontFamily: "Exo2Regular",
        lineHeight: SIZE(18),
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
        lineHeight: SIZE(18),
    },
    selectedItemText: {
        color: Colors.light.white,
        textShadowColor: Colors.dark.black,
        textShadowOffset: {
            width: 1,
            height: 1,
        },
        textShadowRadius: 2,
        fontFamily: "Exo2Regular",
    },
    errorText: {
        color: Colors.light.error,
        fontSize: SIZE(20),
        marginBottom: SIZE(10),
        position: "absolute",
        top: SIZES.wp,
        left: SIZES.wp,
        alignSelf: "center",
        textAlign: "center",
        zIndex: 100,
        boxShadow: "rgba(0, 0, 0, 0.5) 0px 5px 15px",
        backgroundColor: "rgba(0, 187, 255, 0.8)",
        borderRadius: SIZE(6),
        padding: SIZE(5),
        lineHeight: SIZE(18),
    },
});
