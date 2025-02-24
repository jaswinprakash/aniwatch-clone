import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Image,
    ImageBackground,
    ScrollView,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useRoute } from "@react-navigation/native";
import { apiConfig } from "../../../AxiosConfig";
import { FlashList } from "@shopify/flash-list";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import VideoPlayer from "./VideoPlayer";
import { Picker } from "@react-native-picker/picker";
import { Colors } from "@/constants/Colors";
import { SIZE } from "@/constants/Constants";

const SinglePage = () => {
    const route = useRoute();
    const [episodes, setEpisodes] = useState([]);
    const [videoData, setVideoData] = useState(null);
    const [currentRange, setCurrentRange] = useState({ start: 0, end: 50 });
    const [selectedRange, setSelectedRange] = useState("1-50");
    const [pageLoading, setPageLoading] = useState(true);
    const [videoLoading, setVideoLoading] = useState(false);
    const [selectedEpisode, setSelectedEpisode] = useState();
    const [activeTab, setActiveTab] = useState("sub");
    const [activeSubTab, setActiveSubTab] = useState();
    const [servers, setServers] = useState();
    const [animeInfo, setAnimeInfo] = useState();
    const [availableQualities, setAvailableQualities] = useState(["auto"]);

    const getEpisodes = async () => {
        try {
            const response = await apiConfig.get(
                `/api/v2/hianime/anime/${route?.params?.id}/episodes`
            );
            setEpisodes(response.data.data.episodes);
            // setPageLoading(false);
        } catch (error) {
            console.log(error, "axios error");
            // setPageLoading(false);
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
            const quality = response.data.data.anime.quality; // API response

            let qualityOptions = ["auto"]; // Always include Auto

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

    const startStream = async (id, number) => {
        setVideoLoading(true);
        try {
            const serverResponse = await apiConfig.get(
                `/api/v2/hianime/episode/servers?animeEpisodeId=${id}?ep=${number}`
            );
            const servers = serverResponse.data.data;
            setServers(servers);

            // Use the currently selected server (activeSubTab) or default to the first server in the active tab
            const selectedServer =
                activeSubTab || servers[activeTab]?.[0]?.serverName;
            setActiveSubTab(selectedServer);

            const streamResponse = await apiConfig.get(
                `/api/v2/hianime/episode/sources?animeEpisodeId=${id}?server=${selectedServer}&category=${activeTab}`
            );
            setVideoData(streamResponse.data.data);
        } catch (error) {
            console.log(error, "axios error");
        } finally {
            setVideoLoading(false);
        }
    };

    // Handle server switch
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

    // Function to handle range selection from the picker
    const handleRangeChange = (range) => {
        const [start, end] = range.split("-").map(Number);
        setCurrentRange({ start: start - 1, end }); // Adjust for zero-based index
        setSelectedRange(range);
    };

    // Generate range options for the picker
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

    // Get the episodes for the current range
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
        <>
            {!videoLoading && videoData ? (
                <VideoPlayer
                    videoUrl={videoData.sources[0].url}
                    subtitlesData={videoData.tracks}
                    onLoadStart={() => setVideoLoading(true)}
                    onReadyForDisplay={() => setVideoLoading(false)}
                    availableQualities={availableQualities}
                    title={animeInfo?.anime?.info?.name}
                />
            ) : (
                <ThemedView
                    style={{
                        height: SIZE(250),
                        backgroundColor: "#000",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <ImageBackground
                        style={{
                            height: "100%",
                            width: "100%",
                            position: videoLoading ? "absolute" : "relative",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                        source={{ uri: animeInfo?.anime?.info?.poster }}
                        resizeMode="contain"
                    >
                        {videoLoading && (
                            <ThemedView
                                style={{
                                    position: "absolute",
                                    height: "100%",
                                    width: "100%",
                                    backgroundColor: "rgba(0, 0, 0, 0.4)", // Semi-transparent background for contrast
                                    justifyContent: "center",
                                    alignItems: "center",
                                }}
                            >
                                <ActivityIndicator
                                    size="large"
                                    color={Colors.light.tabIconSelected}
                                />
                                <ThemedText
                                    style={{
                                        color: Colors.light.tabIconSelected,
                                        fontWeight: "bold",
                                    }}
                                >
                                    Loading Episode {selectedEpisode}
                                </ThemedText>
                            </ThemedView>
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
                <View style={styles.tabContainer}>
                    {servers?.sub?.length > 0 && (
                        <TouchableOpacity
                            style={[
                                styles.tabButton,
                                activeTab === "sub" && styles.activeTab,
                            ]}
                            onPress={() => setActiveTab("sub")}
                        >
                            <Text
                                style={[
                                    styles.tabText,
                                    activeTab === "sub" && styles.activeText,
                                ]}
                            >
                                Sub
                            </Text>
                        </TouchableOpacity>
                    )}
                    {servers?.dub?.length > 0 && (
                        <TouchableOpacity
                            style={[
                                styles.tabButton,
                                activeTab === "dub" && styles.activeTab,
                            ]}
                            onPress={() => setActiveTab("dub")}
                        >
                            <Text
                                style={[
                                    styles.tabText,
                                    activeTab === "dub" && styles.activeText,
                                ]}
                            >
                                Dub
                            </Text>
                        </TouchableOpacity>
                    )}
                    {servers?.raw?.length > 0 && (
                        <TouchableOpacity
                            style={[
                                styles.tabButton,
                                activeTab === "raw" && styles.activeTab,
                            ]}
                            onPress={() => setActiveTab("raw")}
                        >
                            <Text
                                style={[
                                    styles.tabText,
                                    activeTab === "raw" && styles.activeText,
                                ]}
                            >
                                Raw
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                {activeTab === "sub" && (
                    <View style={styles.subTabContainer}>
                        {servers?.sub?.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.subTabButton,
                                    activeSubTab === item?.serverName &&
                                        styles.activeSubTab,
                                ]}
                                onPress={() =>
                                    setActiveSubTab(item?.serverName)
                                }
                            >
                                <Text
                                    style={[
                                        styles.subTabText,
                                        activeSubTab === item?.serverName &&
                                            styles.activeSubText,
                                    ]}
                                >
                                    {item?.serverName}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {activeTab === "dub" && (
                    <View style={styles.subTabContainer}>
                        {servers?.dub?.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.subTabButton,
                                    activeSubTab === item?.serverName &&
                                        styles.activeSubTab,
                                ]}
                                onPress={() =>
                                    setActiveSubTab(item?.serverName)
                                }
                            >
                                <Text
                                    style={[
                                        styles.subTabText,
                                        activeSubTab === item?.serverName &&
                                            styles.activeSubText,
                                    ]}
                                >
                                    {item?.serverName}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {activeTab === "raw" && (
                    <View style={styles.subTabContainer}>
                        {servers?.raw?.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.subTabButton,
                                    activeSubTab === item?.serverName &&
                                        styles.activeSubTab,
                                ]}
                                onPress={() =>
                                    setActiveSubTab(item?.serverName)
                                }
                            >
                                <Text
                                    style={[
                                        styles.subTabText,
                                        activeSubTab === item?.serverName &&
                                            styles.activeSubText,
                                    ]}
                                >
                                    {item?.serverName}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

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
                        style={[
                            styles.picker,
                            {
                                color: Colors.light.tabIconSelected,
                            },
                        ]}
                        mode="dropdown"
                    >
                        {generateRangeOptions().map((range, index) => (
                            <Picker.Item
                                key={index}
                                label={range}
                                value={range}
                                style={{ color: Colors.light.tabIconSelected }}
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
                        <TouchableOpacity
                            disabled={selectedEpisode == item?.number}
                            style={[
                                styles.episodeButton,
                                {
                                    backgroundColor:
                                        selectedEpisode == item?.number
                                            ? Colors.light.tabIconSelected
                                            : null,
                                    borderColor: Colors.light.tabIconSelected,
                                },
                            ]}
                            onPress={() => {
                                setSelectedEpisode(item?.number);
                                startStream(item?.episodeId, item?.number);
                            }}
                        >
                            <ThemedText
                                type="subtitle"
                                style={[styles.episodeText, {}]}
                            >
                                {item?.number}
                            </ThemedText>
                        </TouchableOpacity>
                    )}
                    contentContainerStyle={styles.episodeList}
                />
            </ThemedView>
        </>
    );
};

export default SinglePage;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: SIZE(16),
    },
    title: {
        fontSize: SIZE(24),
        fontWeight: "bold",
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
        width: "90%", // Adjust based on the number of columns
        aspectRatio: 1, // Make the buttons square
        justifyContent: "center",
        alignItems: "center",
        borderWidth: SIZE(1),
        borderColor: "#333",
        borderRadius: SIZE(8),
        margin: SIZE(4),
    },
    episodeText: {
        fontSize: SIZE(16),
        fontWeight: "bold",
    },

    tabContainer: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginBottom: SIZE(10),
    },
    tabButton: {
        padding: SIZE(10),
        flex: 1,
        alignItems: "center",
        borderBottomWidth: SIZE(2),
        borderColor: "transparent",
    },
    activeTab: { borderColor: Colors.light.tabIconSelected },
    tabText: { fontSize: SIZE(18), color: "#333" },
    activeText: { color: Colors.light.tabIconSelected, fontWeight: "bold" },

    subTabContainer: {
        flexDirection: "row",
        justifyContent: "space-evenly",
        marginBottom: SIZE(10),
    },
    subTabButton: {
        padding: SIZE(8),
        borderWidth: SIZE(1),
        borderRadius: SIZE(6),
        borderColor: Colors.light.tabIconSelected,
    },
    activeSubTab: { backgroundColor: Colors.light.tabIconSelected },
    subTabText: { fontSize: SIZE(16), color: Colors.light.tabIconSelected },
    activeSubText: { color: "#fff", fontWeight: "bold" },

    contentContainer: { marginTop: SIZE(20), alignItems: "center" },
    contentText: { fontSize: SIZE(18), fontWeight: "bold", color: "#333" },
});
