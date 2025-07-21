import React, { useState, useEffect, useRef } from "react";
import {
    View,
    Image,
    StyleSheet,
    ActivityIndicator,
    Dimensions,
    ImageBackground,
} from "react-native";
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
import Carousel from "react-native-reanimated-carousel";
import { ThemedText } from "@/components/ThemedText";
import { LinearGradient } from "expo-linear-gradient";
import { ThemedView } from "@/components/ThemedView";

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

    return (
        <SafeAreaView style={{ flex: 1 }}>
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
                    top: SIZE(10),
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
                <ParallaxScrollView
                    headerBackgroundColor={{
                        light: "#A1CEDC",
                        dark: "#1D3D47",
                    }}
                    headerImage={
                        <View style={styles.carouselContainer}>
                            <Carousel
                                loop
                                autoPlay
                                autoPlayInterval={3000} // Slide every 3 seconds
                                width={Dimensions.get("window").width}
                                height={SIZE(300)} // Adjust height as needed
                                data={animeHomeList?.spotlightAnimes}
                                renderItem={({ item }) => (
                                    <TouchableRipple
                                        rippleColor={
                                            Colors.dark.backgroundPress
                                        }
                                        borderless={true}
                                        onPress={() => {
                                            router.navigate({
                                                pathname: "infopage",
                                                params: {
                                                    id: item.id,
                                                },
                                            });
                                        }}
                                    >
                                        <ImageBackground
                                            source={{ uri: item.poster }}
                                            style={styles.carouselImage}
                                            resizeMode="cover"
                                        >
                                            <LinearGradient
                                                colors={[
                                                    "rgba(0, 0, 0, 0.6)",
                                                    "rgba(0, 0, 0, 0.5)",
                                                    "rgba(0, 0, 0, 0.4)",
                                                    "rgba(0, 0, 0, 0.3)",
                                                    "rgba(0, 0, 0, 0.2)",
                                                    "rgba(0, 0, 0, 0.1)",
                                                    "transparent",
                                                ]}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 0, y: 1 }}
                                            >
                                                <ThemedText
                                                    style={{
                                                        color: Colors.light
                                                            .tabIconSelected,
                                                        fontSize: SIZE(30),
                                                        textShadowColor:
                                                            Colors.dark.black,
                                                        textShadowOffset: {
                                                            width: SIZE(2),
                                                            height: SIZE(2),
                                                        },
                                                        textShadowRadius:
                                                            SIZE(2),
                                                        padding: SIZE(5),
                                                    }}
                                                    type="title"
                                                >
                                                    {item.name}
                                                </ThemedText>
                                            </LinearGradient>
                                            <LinearGradient
                                                colors={[
                                                    "transparent",
                                                    "rgba(0, 0, 0, 0.1)",
                                                    "rgba(0, 0, 0, 0.2)",
                                                    "rgba(0, 0, 0, 0.3)",
                                                    "rgba(0, 0, 0, 0.4)",
                                                    "rgba(0, 0, 0, 0.5)",
                                                    "rgba(0, 0, 0, 0.6)",
                                                ]}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 0, y: 1 }}
                                                style={{
                                                    flexDirection: "row",
                                                    justifyContent: "flex-end",
                                                    gap: SIZE(5),
                                                    padding: SIZE(5),
                                                }}
                                            >
                                                {item?.otherInfo?.map(
                                                    (info, index) => {
                                                        return (
                                                            <View
                                                                key={index}
                                                                style={{
                                                                    borderRadius:
                                                                        SIZE(6),
                                                                    backgroundColor:
                                                                        Colors
                                                                            .light
                                                                            .tabIconSelected,
                                                                    marginBottom:
                                                                        SIZE(5),
                                                                }}
                                                            >
                                                                <ThemedText
                                                                    style={{
                                                                        color: Colors
                                                                            .light
                                                                            .white,
                                                                        fontSize:
                                                                            SIZE(
                                                                                14
                                                                            ),
                                                                        textShadowColor:
                                                                            Colors
                                                                                .dark
                                                                                .black,
                                                                        textShadowOffset:
                                                                            {
                                                                                width: 1,
                                                                                height: 1,
                                                                            },
                                                                        textShadowRadius: 2,
                                                                        lineHeight:
                                                                            SIZE(
                                                                                14
                                                                            ),
                                                                        padding:
                                                                            SIZE(
                                                                                5
                                                                            ),
                                                                    }}
                                                                    type="title"
                                                                >
                                                                    {info}
                                                                </ThemedText>
                                                            </View>
                                                        );
                                                    }
                                                )}
                                            </LinearGradient>
                                        </ImageBackground>
                                    </TouchableRipple>
                                )}
                            />
                        </View>
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
        height: SIZE(300),
    },
    animeInfo: {
        fontSize: SIZE(12),
        color: "#666",
        textAlign: "center",
    },
    carouselContainer: {
        width: "100%",
        height: SIZE(300), // Adjust height as needed
    },
    carouselImage: {
        width: "100%",
        height: "100%",
        justifyContent: "space-between",
    },
});
