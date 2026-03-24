import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import { SIZE } from "@/constants/Constants";
import { MaterialIcons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import LottieView from "lottie-react-native";
import React, { useEffect, useState } from "react";
import { Dimensions, ImageBackground, StyleSheet, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { TouchableRipple } from "react-native-paper";
import Carousel from "react-native-reanimated-carousel";
import { apiConfig } from "../../AxiosConfig";
import { FlashList } from "@shopify/flash-list";
import RenderAnime from "../_components/RenderAnime";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const HomeScreen = () => {
    const [animeHomeList, setAnimeHomeList] = useState<any[] | null>(null);
    const [pageLoading, setPageLoading] = useState(true);
    const [imageLoading, setImageLoading] = useState(true);
    const insets = useSafeAreaInsets();
    const tabBarHeight = SIZE(50) + insets.bottom;

    const getHomeList = async () => {
        setPageLoading(true);
        try {
            // Older API call: const response = await apiConfig.get("/api/v2/hianime/home");
            const response = await apiConfig.get("/home");
            setAnimeHomeList(response.data.sections);
            setPageLoading(false);
        } catch (error) {
            console.log(error, "axios error - home");
            setPageLoading(false);
        }
    };

    useEffect(() => {
        getHomeList();
    }, []);

    const CarouselItem = React.memo(({ item }: { item: any }) => {
        return (
            <TouchableRipple
                rippleColor={Colors.dark.backgroundPress}
                borderless={true}
                onPress={() => {
                    router.navigate({
                        pathname: "/infopage",
                        params: {
                            id: item.slug, // Using slug as id
                        },
                    });
                }}
                style={{ position: "relative" }}
            >
                <ImageBackground
                    style={[styles.carouselImage]}
                    source={{ uri: item.poster_url }} // Using poster_url
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
                        numberOfLines={2}
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
                            top: Constants.statusBarHeight + 170,
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
                                {item?.badge && (
                                    <View
                                        style={{
                                            borderRadius: SIZE(6),
                                            backgroundColor:
                                                Colors.light.tabIconSelected,
                                            marginBottom: SIZE(5),
                                            height: SIZE(24),
                                        }}
                                    >
                                        <ThemedText
                                            style={{
                                                color: Colors.light.white,
                                                fontSize: SIZE(14),
                                                textShadowColor: Colors.dark.black,
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
                                            {item.badge}
                                        </ThemedText>
                                    </View>
                                )}
                            </View>
                        </View>
                    </LinearGradient>
                </ImageBackground>
            </TouchableRipple>
        );
    });

    const bannerSection = animeHomeList?.find((sec: any) => sec.section === "Banner");
    const otherSections = animeHomeList?.filter(
        (sec: any) => sec.section !== "Banner"
    );

    const OptimizedFlashList = FlashList as any;

    return (
        <View style={{ flex: 1, backgroundColor: Colors.dark.background }}>
            {!pageLoading && (
                <TouchableRipple
                    hitSlop={15}
                    rippleColor={Colors.dark.backgroundPress}
                    borderless={true}
                    onPress={() => {
                        router.navigate({
                            pathname: "/searchpage",
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
                        source={require("../../assets/lottie/loader2.json")}
                        autoPlay
                        loop
                        style={{
                            width: SIZE(100),
                            height: SIZE(100),
                        }}
                    />
                </View>
            ) : (
                <OptimizedFlashList
                    removeClippedSubviews={true}
                    maxToRenderPerBatch={4}
                    windowSize={5}
                    initialNumToRender={3}
                    data={otherSections}
                    keyExtractor={(item: any, index: number) => index.toString()}
                    estimatedItemSize={SIZE(300)}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: tabBarHeight }}
                    ListHeaderComponent={
                        bannerSection && (
                            <View style={styles.carouselContainer}>
                                <Carousel
                                    loop
                                    autoPlay
                                    autoPlayInterval={4000} // Slide every 3 seconds
                                    width={Dimensions.get("window").width}
                                    height={SIZE(350)} // Adjust height as needed
                                    data={bannerSection.movies.slice(0, 5)}
                                    renderItem={({ item }: { item: any }) => (
                                        <CarouselItem item={item} />
                                    )}
                                />
                            </View>
                        )
                    }
                    ListHeaderComponentStyle={{
                        marginBottom: SIZE(20),
                    }}
                    renderItem={({ item: section }: { item: any }) => (
                        <RenderAnime
                            title={section.section}
                            data={section.movies.map((movie: any) => ({
                                ...movie,
                                poster: movie.poster_url,
                                id: movie.slug,
                            }))}
                            info={false}
                            setAnimeId={() => { }}
                            type={section.section.toLowerCase().replace(" ", "-")}
                            home
                        />
                    )}
                />
            )}
        </View>
    );
};

export default HomeScreen;

const styles = StyleSheet.create({
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
