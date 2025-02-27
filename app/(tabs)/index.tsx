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
import FastImage from "@d11/react-native-fast-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";

export const HomeScreen = () => {
    const [animeHomeList, setAnimeHomeList] = useState(null);
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
                                rippleColor="rgba(140, 82, 255, 0.5)"
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
            <View
                style={{
                    borderColor: Colors.light.tabIconSelected,
                    height: SIZE(60),
                    borderBottomWidth: SIZE(1),
                    paddingHorizontal: SIZE(16),
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <Image
                    style={{ height: SIZE(30), width: SIZE(200) }}
                    source={require("@/assets/images/AnimPlay.png")}
                />
                <TouchableRipple
                    hitSlop={15}
                    rippleColor="rgba(140, 82, 255, 0.5)"
                    borderless={true}
                    onPress={() => {
                        router.push({
                            pathname: "searchpage",
                        });
                    }}
                    style={{ borderRadius: SIZE(15) }}
                >
                    <MaterialIcons
                        name="search"
                        size={SIZE(30)}
                        color={Colors.light.tabIconSelected}
                    />
                </TouchableRipple>
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
