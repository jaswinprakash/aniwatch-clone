import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    StyleSheet,
    TextInput,
    ActivityIndicator,
} from "react-native";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { FlashList } from "@shopify/flash-list";
import { apiConfig } from "../../AxiosConfig";
import { router } from "expo-router";
import { Colors } from "@/constants/Colors";
import { SIZE } from "@/constants/Constants";

export const HomeScreen = () => {
    const [animeHomeList, setAnimeHomeList] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [pageLoading, setPageLoading] = useState(true);

    const getHomeList = async () => {
        setPageLoading(true);
        try {
            const response = await apiConfig.get("/api/v2/hianime/home");
            setAnimeHomeList(response.data.data);
            setPageLoading(false);
        } catch (error) {
            console.log(error, "axios error");
            setPageLoading(false);
        }
    };

    const handleSearch = async (query) => {
        setSearchQuery(query);
        if (query.length > 2) {
            // Only search if the query has more than 2 characters
            try {
                const response = await apiConfig.get(
                    `/api/v2/hianime/search/suggestion?q=${query}`
                );
                setSearchResults(response.data.data.suggestions);
            } catch (error) {
                console.log(error, "axios error");
            }
        } else {
            setSearchResults([]); // Clear results if the query is too short
        }
    };

    useEffect(() => {
        getHomeList();
    }, []);

    const renderAnimeList = (title, data) => {
        if (!data) return null;

        return (
            <ThemedView style={styles.sectionContainer}>
                <ThemedText type="title" style={styles.sectionTitle}>
                    {title}
                </ThemedText>
                <FlashList
                    data={data}
                    keyExtractor={(item, index) => index.toString()}
                    estimatedItemSize={50}
                    horizontal
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.animeItem}
                            onPress={() => {
                                router.push({
                                    pathname: "watchpage",
                                    params: {
                                        id: item.id,
                                    },
                                });
                            }}
                        >
                            <Image
                                source={{ uri: item.poster }}
                                style={styles.animePoster}
                            />
                            <ThemedText
                                numberOfLines={2}
                                type="subtitle"
                                style={styles.animeName}
                            >
                                {item.name}
                            </ThemedText>
                        </TouchableOpacity>
                    )}
                />
            </ThemedView>
        );
    };

    const renderSearchResults = () => {
        if (searchResults.length === 0) return null;

        return (
            <ThemedView
                style={[
                    styles.sectionContainer,
                    {
                        borderWidth: SIZE(1),
                        height: SIZE(250),
                        marginBottom: SIZE(10),
                        borderBottomRightRadius: SIZE(8),
                        borderBottomLeftRadius: SIZE(8),
                        borderTopWidth: 0,
                        borderColor: Colors.light.tabIconSelected,
                    },
                ]}
            >
                <ThemedText
                    type="title"
                    style={[styles.sectionTitle, { marginLeft: SIZE(10) }]}
                >
                    Search Results
                </ThemedText>
                <FlashList
                    data={searchResults}
                    keyExtractor={(item, index) => index.toString()}
                    estimatedItemSize={50}
                    horizontal
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.animeItem}
                            onPress={() => {
                                router.push({
                                    pathname: "watchpage",
                                    params: {
                                        id: item.id,
                                    },
                                });
                            }}
                        >
                            <Image
                                source={{ uri: item.poster }}
                                style={styles.animePoster}
                            />
                            <ThemedText
                                numberOfLines={2}
                                type="subtitle"
                                style={styles.animeName}
                            >
                                {item.name}
                            </ThemedText>
                            <ThemedText
                                type="subtitle"
                                style={styles.animeInfo}
                            >
                                {item.moreInfo.join(" • ")}
                            </ThemedText>
                        </TouchableOpacity>
                    )}
                />
            </ThemedView>
        );
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
        <ParallaxScrollView
            headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
            headerImage={
                <Image
                    resizeMode="cover"
                    source={require("@/assets/images/AnimPlay.png")}
                    style={styles.reactLogo}
                />
            }
        >
            {/* Search Bar */}
            <ThemedView style={styles.searchContainer}>
                <TextInput
                    style={[
                        styles.searchInput,
                        {
                            borderBottomRightRadius:
                                searchQuery && searchResults.length > 0 ? 0 : 8,
                            borderBottomLeftRadius:
                                searchQuery && searchResults.length > 0 ? 0 : 8,
                            borderColor: Colors.light.tabIconSelected,
                            color: Colors.light.tabIconSelected,
                        },
                    ]}
                    placeholder="Search for anime..."
                    placeholderTextColor={Colors.light.tabIconSelected}
                    value={searchQuery}
                    onChangeText={handleSearch}
                />
                {/* Display Search Results */}
                {searchQuery && renderSearchResults()}
            </ThemedView>

            {/* Display Home Lists */}
            {renderAnimeList(
                "Completed Animes",
                animeHomeList?.latestCompletedAnimes
            )}
            {renderAnimeList(
                "Latest Episode Animes",
                animeHomeList?.latestEpisodeAnimes
            )}
            {renderAnimeList(
                "Most Favorite Animes",
                animeHomeList?.mostFavoriteAnimes
            )}
            {renderAnimeList(
                "Most Popular Animes",
                animeHomeList?.mostPopularAnimes
            )}
            {renderAnimeList(
                "Top Airing Animes",
                animeHomeList?.topAiringAnimes
            )}
            {renderAnimeList(
                "Top Upcoming Animes",
                animeHomeList?.topUpcomingAnimes
            )}
            {renderAnimeList("Trending Animes", animeHomeList?.trendingAnimes)}
        </ParallaxScrollView>
    );
};

export default HomeScreen;

const styles = StyleSheet.create({
    reactLogo: {
        width: "100%",
        height: SIZE(155),
    },
    searchContainer: {
        // padding: 16,
    },
    searchInput: {
        height: SIZE(40),
        borderColor: "#333",
        borderWidth: SIZE(1),
        paddingHorizontal: SIZE(10),
        borderRadius: SIZE(8),
        color: "#000",
    },
    sectionContainer: {
        marginBottom: SIZE(30),
        height: SIZE(200),
    },
    sectionTitle: {
        fontSize: SIZE(20),
        fontWeight: "bold",
        marginBottom: SIZE(10),
        color: Colors.light.tabIconSelected,
    },
    animeItem: {
        marginRight: SIZE(10),
        alignItems: "center",
    },
    animePoster: {
        width: SIZE(100),
        height: SIZE(150),
        borderRadius: SIZE(10),
    },
    animeName: {
        marginTop: SIZE(5),
        textAlign: "center",
        width: SIZE(100),
        fontSize: SIZE(12),
        color: Colors.light.tabIconSelected,
    },
    animeInfo: {
        fontSize: SIZE(12),
        color: "#666",
        textAlign: "center",
    },
    modalContainer: {
        backgroundColor: "white",
        padding: SIZE(20),
        borderRadius: SIZE(10),
        width: "80%",
    },
    modalTitle: {
        fontSize: SIZE(18),
        fontWeight: "bold",
        marginBottom: SIZE(10),
    },
    confirmButton: {
        backgroundColor: "#007BFF",
        padding: SIZE(10),
        borderRadius: SIZE(5),
        alignItems: "center",
        marginTop: SIZE(10),
    },
    buttonText: {
        color: "white",
        fontWeight: "bold",
    },
});
