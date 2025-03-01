import React, { useState, useEffect, useRef } from "react";
import { View, Image, StyleSheet, ActivityIndicator } from "react-native";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { apiConfig } from "../../AxiosConfig";
import { router } from "expo-router";
import { Colors } from "@/constants/Colors";
import { SIZE } from "@/constants/Constants";
import { TouchableRipple } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import LottieView from "lottie-react-native";
import RenderAnime from "./_components/RenderAnime";
export const HomeScreen = () => {
    const [animeHomeList, setAnimeHomeList] = useState(null);
    const [pageLoading, setPageLoading] = useState(true);
    const [imageLoading, setImageLoading] = useState(true);

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
            {pageLoading ? (
                <View
                    style={{
                        flex: 1,
                        justifyContent: "center",
                        borderWidth: 1,
                        alignItems: "center",
                    }}
                >
                    <LottieView
                        source={require("../../assets/lottie/loader-3.json")}
                        autoPlay
                        loop
                        style={{
                            width: SIZE(200),
                            height: SIZE(200),
                        }}
                    />
                </View>
            ) : (
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
                    <>
                        <RenderAnime
                            title="Latest Episode Animes"
                            data={animeHomeList?.latestEpisodeAnimes}
                        />
                        <RenderAnime
                            title="Most Popular Animes"
                            data={animeHomeList?.mostPopularAnimes}
                        />
                        <RenderAnime
                            title="Most Favorite Animes"
                            data={animeHomeList?.mostFavoriteAnimes}
                        />
                        <RenderAnime
                            title="Top Airing Animes"
                            data={animeHomeList?.topAiringAnimes}
                        />
                        <RenderAnime
                            title="Top Upcoming Animes"
                            data={animeHomeList?.topUpcomingAnimes}
                        />
                        <RenderAnime
                            title="Trending Animes"
                            data={animeHomeList?.trendingAnimes}
                        />
                        <RenderAnime
                            title="Completed Animes"
                            data={animeHomeList?.latestCompletedAnimes}
                        />
                    </>
                </ParallaxScrollView>
            )}
        </SafeAreaView>
    );
};

export default HomeScreen;

const styles = StyleSheet.create({
    reactLogo: {
        width: "100%",
        height: SIZE(155),
    },
    animeInfo: {
        fontSize: SIZE(12),
        color: "#666",
        textAlign: "center",
    },
});
