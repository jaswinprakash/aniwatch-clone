import React, { useState, useEffect } from "react";
import { View, StyleSheet, Dimensions, ImageBackground } from "react-native";
import { apiConfig } from "../../AxiosConfig";
import { router } from "expo-router";
import { Colors } from "@/constants/Colors";
import { SIZE } from "@/constants/Constants";
import { TouchableRipple } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import LottieView from "lottie-react-native";
import RenderAnime from "./_components/RenderAnime";
import Carousel from "react-native-reanimated-carousel";
import { ThemedText } from "@/components/ThemedText";
import { LinearGradient } from "expo-linear-gradient";
import { ScrollView } from "react-native-gesture-handler";
import Constants from "expo-constants";

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
            console.log(error, "axios error - home");
            setPageLoading(false);
        }
    };

    useEffect(() => {
        getHomeList();
    }, []);

    const CarouselItem = React.memo(({ item }) => {
        return (
            <TouchableRipple
                rippleColor={Colors.dark.backgroundPress}
                borderless={true}
                onPress={() => {
                    router.navigate({
                        pathname: "infopage",
                        params: {
                            id: item.id,
                        },
                    });
                }}
                style={{ position: "relative" }}
            >
                <ImageBackground
                    style={[styles.carouselImage]}
                    source={{ uri: item.poster }}
                    resizeMode="cover"
                >
                    <LinearGradient
                        colors={[
                            "rgba(0, 0, 0, 0.9)",
                            "rgba(0, 0, 0, 0.8)",
                            "rgba(0, 0, 0, 0.7)",
                            "rgba(0, 0, 0, 0.6)",
                            "rgba(0, 0, 0, 0.5)",
                            "rgba(0, 0, 0, 0.4)",
                            "rgba(0, 0, 0, 0.3)",
                            "rgba(0, 0, 0, 0.2)",
                            "rgba(0, 0, 0, 0.1)",
                            "rgba(0, 0, 0, 0.05)",
                            "rgba(0, 0, 0, 0.01)",
                            "transparent",
                        ]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                    >
                        <View style={{ height: SIZE(50) }}></View>
                    </LinearGradient>
                    <ThemedText
                        style={{
                            color: Colors.light.tabIconSelected,
                            fontSize: SIZE(30),
                            textShadowColor: Colors.dark.black,
                            textShadowOffset: {
                                width: SIZE(2),
                                height: SIZE(2),
                            },
                            textShadowRadius: SIZE(2),
                            padding: SIZE(5),
                            position: "absolute",
                            top: Constants.statusBarHeight + 190,
                            zIndex: 100,
                        }}
                        type="title"
                    >
                        {item.name}
                    </ThemedText>
                    <LinearGradient
                        colors={[
                            "transparent",
                            "rgba(10, 25, 41, 0.1)",
                            "rgba(10, 25, 41, 0.2)",
                            "rgba(10, 25, 41, 0.3)",
                            "rgba(10, 25, 41, 0.4)",
                            "rgba(10, 25, 41, 0.5)",
                            "rgba(10, 25, 41, 0.6)",
                            "rgba(10, 25, 41, 0.7)",
                            "rgba(10, 25, 41, 0.8)",
                            "rgba(10, 25, 41, 0.9)",
                            "rgba(10, 25, 41, 1.0)",
                        ]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                    >
                        <View
                            style={{
                                height: SIZE(100),
                            }}
                        >
                            <View
                                style={{
                                    flexDirection: "row",
                                    justifyContent: "flex-end",
                                    gap: SIZE(5),
                                    padding: SIZE(5),
                                    position: "absolute",
                                    right: 0,
                                    bottom: 0,
                                }}
                            >
                                {item?.otherInfo?.map((info, index) => {
                                    return (
                                        <View
                                            key={index}
                                            style={{
                                                borderRadius: SIZE(6),
                                                backgroundColor:
                                                    Colors.light
                                                        .tabIconSelected,
                                                marginBottom: SIZE(5),
                                                height: SIZE(24),
                                            }}
                                        >
                                            <ThemedText
                                                style={{
                                                    color: Colors.light.white,
                                                    fontSize: SIZE(14),
                                                    textShadowColor:
                                                        Colors.dark.black,
                                                    textShadowOffset: {
                                                        width: 1,
                                                        height: 1,
                                                    },
                                                    textShadowRadius: 2,
                                                    lineHeight: SIZE(14),
                                                    padding: SIZE(5),
                                                }}
                                                type="title"
                                            >
                                                {info}
                                            </ThemedText>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    </LinearGradient>
                </ImageBackground>
            </TouchableRipple>
        );
    });

    return (
        <View style={{ flex: 1 }}>
            {!pageLoading && (
                <TouchableRipple
                    hitSlop={15}
                    rippleColor={Colors.dark.backgroundPress}
                    borderless={true}
                    onPress={() => {
                        router.navigate({
                            pathname: "searchpage",
                        });
                    }}
                    style={{
                        borderTopLeftRadius: SIZE(20),
                        borderBottomLeftRadius: SIZE(20),
                        position: "absolute",
                        top: Constants.statusBarHeight + 5,
                        right: SIZE(0),
                        zIndex: 100,
                        backgroundColor: Colors.light.tabIconSelected,
                        width: SIZE(40),
                        height: SIZE(40),
                        justifyContent: "center",
                        alignItems: "center",
                        paddingLeft: SIZE(8),
                    }}
                >
                    <MaterialIcons
                        name="search"
                        size={SIZE(30)}
                        color={Colors.dark.text}
                        style={{
                            textShadowColor: Colors.dark.black,
                            textShadowOffset: {
                                width: 1,
                                height: 1,
                            },
                            textShadowRadius: 2,
                        }}
                    />
                </TouchableRipple>
            )}

            {pageLoading ? (
                <View
                    style={{
                        flex: 1,
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor: Colors.dark.background,
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
                <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={styles.carouselContainer}>
                        <Carousel
                            loop
                            autoPlay
                            autoPlayInterval={3000} // Slide every 3 seconds
                            width={Dimensions.get("window").width}
                            height={SIZE(350)} // Adjust height as needed
                            data={animeHomeList?.spotlightAnimes}
                            renderItem={({ item }) => (
                                <CarouselItem item={item} />
                            )}
                        />
                    </View>
                    <View
                        style={{
                            backgroundColor: Colors.dark.background,
                            overflow: "visible",
                            paddingTop: SIZE(20),
                        }}
                    >
                        <RenderAnime
                            title="Latest Episode Animes"
                            data={animeHomeList?.latestEpisodeAnimes}
                            type="recently-updated"
                        />
                        <RenderAnime
                            title="Most Popular Animes"
                            data={animeHomeList?.mostPopularAnimes}
                            type="most-popular"
                        />
                        <RenderAnime
                            title="Most Favorite Animes"
                            data={animeHomeList?.mostFavoriteAnimes}
                            type="most-favorite"
                        />
                        <RenderAnime
                            title="Top Airing Animes"
                            data={animeHomeList?.topAiringAnimes}
                            type="top-airing"
                        />
                        <RenderAnime
                            title="Top Upcoming Animes"
                            data={animeHomeList?.topUpcomingAnimes}
                            type="top-upcoming"
                        />
                        <RenderAnime
                            title="Trending Animes"
                            data={animeHomeList?.trendingAnimes}
                            type="ona"
                        />
                        <RenderAnime
                            title="Completed Animes"
                            data={animeHomeList?.latestCompletedAnimes}
                            type="completed"
                        />
                    </View>
                </ScrollView>
            )}
        </View>
    );
};

export default HomeScreen;

const styles = StyleSheet.create({
    reactLogo: {
        width: "100%",
        height: SIZE(300),
    },
    animeInfo: {
        fontSize: SIZE(12),
        color: "#666",
        textAlign: "center",
    },
    carouselContainer: {
        width: "100%",
        height: SIZE(350), // Adjust height as needed
    },
    carouselImage: {
        width: "100%",
        height: "100%",
        justifyContent: "space-between",
    },
});
