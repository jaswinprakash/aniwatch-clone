import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Image,
    ImageBackground,
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

    const getEpisodes = async () => {
        try {
            const response = await apiConfig.get(
                `/api/v2/hianime/anime/${route?.params?.id}/episodes`
            );
            setEpisodes(response.data.data.episodes);
            setPageLoading(false);
        } catch (error) {
            console.log(error, "axios error");
            setPageLoading(false);
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
                />
            ) : (
                <ThemedView
                    style={{
                        height: 250,
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
                        source={{ uri: route?.params?.poster }}
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
                        fontSize: 25,
                    }}
                >
                    {route?.params?.title}
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
                    keyExtractor={(item) => item.episodeId}
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
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 16,
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: "#333",
        borderRadius: 8,
        marginBottom: 16,
        width: "35%",
    },
    picker: {
        width: "100%",
    },
    episodeList: {
        paddingVertical: 16,
    },
    episodeButton: {
        width: "90%", // Adjust based on the number of columns
        aspectRatio: 1, // Make the buttons square
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#333",
        borderRadius: 8,
        margin: 4,
    },
    episodeText: {
        fontSize: 16,
        fontWeight: "bold",
    },

    tabContainer: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginBottom: 10,
    },
    tabButton: {
        padding: 10,
        flex: 1,
        alignItems: "center",
        borderBottomWidth: 2,
        borderColor: "transparent",
    },
    activeTab: { borderColor: Colors.light.tabIconSelected },
    tabText: { fontSize: 18, color: "#333" },
    activeText: { color: Colors.light.tabIconSelected, fontWeight: "bold" },

    subTabContainer: {
        flexDirection: "row",
        justifyContent: "space-evenly",
        marginBottom: 10,
    },
    subTabButton: {
        padding: 8,
        borderWidth: 1,
        borderRadius: 6,
        borderColor: Colors.light.tabIconSelected,
    },
    activeSubTab: { backgroundColor: Colors.light.tabIconSelected },
    subTabText: { fontSize: 16, color: Colors.light.tabIconSelected },
    activeSubText: { color: "#fff", fontWeight: "bold" },

    contentContainer: { marginTop: 20, alignItems: "center" },
    contentText: { fontSize: 18, fontWeight: "bold", color: "#333" },
});
