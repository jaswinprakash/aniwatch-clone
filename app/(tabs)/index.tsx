import React, { useState, useEffect, useRef } from "react";
import { View, Image, StyleSheet, ActivityIndicator } from "react-native";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { FlashList } from "@shopify/flash-list";
import { apiConfig } from "../../AxiosConfig";
import { router } from "expo-router";
import { Colors } from "@/constants/Colors";
import { SIZE } from "@/constants/Constants";
import { TouchableRipple } from "react-native-paper";
import { TextInput } from "react-native-paper";
import FastImage from "@d11/react-native-fast-image";
import { SafeAreaView } from "react-native-safe-area-context";

export const HomeScreen = () => {
    const [animeHomeList, setAnimeHomeList] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [pageLoading, setPageLoading] = useState(true);
    const [searchLoading, setSearchLoading] = useState(false);

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
        setSearchLoading(true);
        setSearchQuery(query);
        if (query.length > 2) {
            // Only search if the query has more than 2 characters
            try {
                const response = await apiConfig.get(
                    `/api/v2/hianime/search/suggestion?q=${query}`
                );
                setSearchResults(response.data.data.suggestions);
                setSearchLoading(false);
            } catch (error) {
                console.log(error, "axios error");
                setSearchLoading(false);
            }
        } else {
            setSearchResults([]); // Clear results if the query is too short
            setSearchLoading(false);
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
                        <View style={styles.animeItem}>
                            <TouchableRipple
                                rippleColor="rgba(0, 0, 0, 0.5)"
                                borderless={true}
                                style={{ borderRadius: SIZE(10) }}
                                onPress={() => {
                                    router.push({
                                        pathname: "watchpage",
                                        params: {
                                            id: item.id,
                                        },
                                    });
                                }}
                            >
                                <FastImage
                                    source={{
                                        uri: item.poster,
                                        priority: FastImage.priority.high,
                                    }}
                                    style={styles.animePoster}
                                />
                            </TouchableRipple>

                            <ThemedText
                                numberOfLines={2}
                                type="subtitle"
                                style={styles.animeName}
                            >
                                {item.name}
                            </ThemedText>
                        </View>
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
                        borderWidth: SIZE(2),
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
                        <View style={styles.animeItem}>
                            <TouchableRipple
                                rippleColor="rgba(0, 0, 0, 0.5)"
                                borderless={true}
                                style={{ borderRadius: SIZE(10) }}
                                onPress={() => {
                                    router.push({
                                        pathname: "watchpage",
                                        params: {
                                            id: item.id,
                                        },
                                    });
                                }}
                            >
                                <FastImage
                                    source={{
                                        uri: item.poster,
                                        priority: FastImage.priority.normal,
                                    }}
                                    style={styles.animePoster}
                                />
                            </TouchableRipple>
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
                        </View>
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
        <SafeAreaView style={{ flex: 1 }}>
            <View style={[styles.searchContainer]}>
                <TextInput
                    contentStyle={{ fontFamily: "Exo2Medium" }}
                    mode="outlined"
                    label="Search for anime..."
                    placeholder="Search"
                    placeholderTextColor={Colors.light.tabIconSelected}
                    value={searchQuery}
                    onChangeText={handleSearch}
                    outlineStyle={{
                        borderColor: Colors.light.tabIconSelected,
                        borderRadius: SIZE(10),
                    }}
                    outlineColor={Colors.light.tabIconSelected}
                    textColor={Colors.light.tabIconSelected}
                    theme={{
                        colors: {
                            primary: Colors.light.tabIconSelected,
                            onSurfaceVariant: Colors.light.tabIconSelected,
                        },
                        fonts: {
                            bodyLarge: {
                                fontFamily: "Exo2Medium",
                            },
                        },
                    }}
                    left={
                        <TextInput.Icon
                            icon="magnify"
                            color={Colors.light.tabIconSelected}
                        />
                    }
                    right={
                        searchLoading ? (
                            <TextInput.Icon
                                icon={() => (
                                    <ActivityIndicator
                                        size="small"
                                        color={Colors.light.tabIconSelected}
                                    />
                                )}
                            />
                        ) : null
                    }
                />
                {/* Display Search Results */}
                <View
                    style={{
                        position: "absolute",
                        alignSelf: "center",
                        zIndex: 10000,
                        top: SIZE(85),
                        width: "100%",
                    }}
                >
                    {searchQuery && renderSearchResults()}
                </View>
            </View>
            <ParallaxScrollView
                headerBackgroundColor={{
                    light: "#A1CEDC",
                    dark: "#1D3D47",
                }}
                headerImage={
                    <Image
                        resizeMode="cover"
                        source={require("@/assets/images/AnimPlay.png")}
                        style={styles.reactLogo}
                    />
                }
            >
                {/* Display Home Lists */}
                {renderAnimeList(
                    "Latest Episode Animes",
                    animeHomeList?.latestEpisodeAnimes
                )}
                {renderAnimeList(
                    "Most Popular Animes",
                    animeHomeList?.mostPopularAnimes
                )}
                {renderAnimeList(
                    "Most Favorite Animes",
                    animeHomeList?.mostFavoriteAnimes
                )}
                {renderAnimeList(
                    "Top Airing Animes",
                    animeHomeList?.topAiringAnimes
                )}
                {renderAnimeList(
                    "Top Upcoming Animes",
                    animeHomeList?.topUpcomingAnimes
                )}
                {renderAnimeList(
                    "Trending Animes",
                    animeHomeList?.trendingAnimes
                )}
                {renderAnimeList(
                    "Completed Animes",
                    animeHomeList?.latestCompletedAnimes
                )}
            </ParallaxScrollView>
        </SafeAreaView>
    );
};

export default HomeScreen;

const styles = StyleSheet.create({
    reactLogo: {
        width: "100%",
        height: SIZE(155),
    },
    searchContainer: {
        padding: 16,
    },
    sectionContainer: {
        marginBottom: SIZE(30),
        height: SIZE(200),
    },
    sectionTitle: {
        fontSize: SIZE(20),
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
});
