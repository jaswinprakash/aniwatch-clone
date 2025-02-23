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

    const startStream = async (id) => {
        setVideoLoading(true);
        try {
            const response = await apiConfig.get(
                `/api/v2/hianime/episode/sources?animeEpisodeId=${id}?server=hd-1&category=sub`
            );
            setVideoData(response.data.data);
            setVideoLoading(false);
        } catch (error) {
            console.log(error, "axios error");
            setVideoLoading(false);
        }
    };

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
                                startStream(item?.episodeId);
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
});
