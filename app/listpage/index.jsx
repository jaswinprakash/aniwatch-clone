import { ThemedView } from "@/components/ThemedView";
import { useRoute } from "@react-navigation/native";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import LottieView from "lottie-react-native";
import { useEffect, useState } from "react";
import { Image, ImageBackground, StyleSheet, View } from "react-native";
import { TouchableRipple } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiConfig } from "../../AxiosConfig";
import { ThemedText } from "../../components/ThemedText";
import { Colors } from "../../constants/Colors";
import { SIZE } from "../../constants/Constants";

const ListPage = () => {
    const route = useRoute();
    const [currentPage, setCurrentPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
    const [data, setData] = useState([]);
    const [pageLoading, setPageLoading] = useState(true);

    const fetchData = async () => {
        try {
            const response = await apiConfig.get(
                `/api/v2/hianime/category/${route?.params?.type}?page=1`
            );
            setCurrentPage(response.data.data.currentPage);
            setHasNextPage(response.data.data.hasNextPage);
            setData(response.data.data.animes);
            setPageLoading(false);
        } catch (error) {
            console.log(error, "axios error - search perform");
        } finally {
            setPageLoading(false);
        }
    };

    const handleLoadMore = async () => {
        if (hasNextPage) {
            setIsFetchingNextPage(true);
            try {
                const response = await apiConfig.get(
                    `/api/v2/hianime/category/${route?.params?.type}?page=${
                        currentPage + 1
                    }`
                );
                setCurrentPage(response.data.data.currentPage);
                setHasNextPage(response.data.data.hasNextPage);
                setData((prev) => [...prev, ...response.data.data.animes]);
            } catch (error) {
                console.log(error, "axios error - search load more");
            } finally {
                setIsFetchingNextPage(false);
            }
        }
    };

    useEffect(() => {
        fetchData();
    }, [route]);

    if (pageLoading) {
        return (
            <SafeAreaView
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
            </SafeAreaView>
        );
    }
    return (
        <SafeAreaView
            style={{ flex: 1, backgroundColor: Colors.dark.background }}
        >
            <ThemedView
                style={{
                    paddingHorizontal: SIZE(16),
                    height: SIZE(40),
                    justifyContent: "center",
                    backgroundColor: Colors.dark.background,
                }}
            >
                <ThemedText
                    type="title"
                    style={{
                        color: Colors.light.tabIconSelected,
                        fontSize: SIZE(20),
                    }}
                >
                    {route?.params?.title}
                </ThemedText>
            </ThemedView>
            <View style={{ paddingHorizontal: SIZE(16), flex: 1 }}>
                <FlashList
                    showsVerticalScrollIndicator={false}
                    data={data}
                    keyExtractor={(item, index) => index.toString()}
                    estimatedItemSize={50}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={
                        isFetchingNextPage ? (
                            <LottieView
                                source={require("../../assets/lottie/loader2.json")}
                                autoPlay
                                loop
                                style={{
                                    alignSelf: "center",
                                    width: SIZE(100),
                                    height: SIZE(100),
                                }}
                            />
                        ) : null
                    }
                    renderItem={({ item }) => (
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
                            style={[
                                styles.animeItem,
                                { marginBottom: SIZE(16) },
                            ]}
                        >
                            <ImageBackground
                                style={[
                                    styles.animeItem,
                                    { backgroundColor: "rgba(0, 0, 0, 0.2)" },
                                ]}
                                source={{ uri: item.poster }}
                                blurRadius={10}
                                resizeMode="cover"
                            >
                                <View
                                    style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                    }}
                                >
                                    <View>
                                        <Image
                                            style={styles.animePoster}
                                            source={{
                                                uri: item.poster,
                                            }}
                                            resizeMode="cover"
                                        />
                                    </View>
                                    <View style={{ width: "64%" }}>
                                        <ThemedText
                                            numberOfLines={2}
                                            type="title"
                                            style={styles.animeName}
                                        >
                                            {item.name}
                                        </ThemedText>
                                        <View
                                            style={{
                                                flexDirection: "row",
                                                gap: SIZE(5),
                                                marginBottom: SIZE(5),
                                            }}
                                        >
                                            {item.type && (
                                                <ThemedText
                                                    type="subtitle"
                                                    style={[
                                                        styles.animeInfo,
                                                        {
                                                            padding: SIZE(5),
                                                            backgroundColor:
                                                                Colors.light
                                                                    .tabIconSelected,
                                                            borderRadius:
                                                                SIZE(6),
                                                        },
                                                    ]}
                                                >
                                                    {item.type}
                                                </ThemedText>
                                            )}
                                            {item.duration && (
                                                <ThemedText
                                                    type="subtitle"
                                                    style={[
                                                        styles.animeInfo,
                                                        {
                                                            padding: SIZE(5),
                                                            backgroundColor:
                                                                Colors.light
                                                                    .tabIconSelected,
                                                            borderRadius:
                                                                SIZE(6),
                                                        },
                                                    ]}
                                                >
                                                    {item.duration}
                                                </ThemedText>
                                            )}
                                            {item.rating && (
                                                <ThemedText
                                                    type="subtitle"
                                                    style={[
                                                        styles.animeInfo,
                                                        {
                                                            padding: SIZE(5),
                                                            backgroundColor:
                                                                Colors.light
                                                                    .tabIconSelected,
                                                            borderRadius:
                                                                SIZE(6),
                                                        },
                                                    ]}
                                                >
                                                    {item.rating}
                                                </ThemedText>
                                            )}
                                        </View>
                                        {item.episodes && (
                                            <View
                                                style={{
                                                    flexDirection: "row",
                                                    gap: SIZE(5),
                                                }}
                                            >
                                                {item.episodes.dub && (
                                                    <ThemedText
                                                        type="subtitle"
                                                        style={[
                                                            styles.animeInfo,
                                                            {
                                                                padding:
                                                                    SIZE(5),
                                                                backgroundColor:
                                                                    Colors.light
                                                                        .tabIconSelected,
                                                                borderRadius:
                                                                    SIZE(6),
                                                            },
                                                        ]}
                                                    >
                                                        DUB :{" "}
                                                        {item.episodes.dub}
                                                    </ThemedText>
                                                )}
                                                {item.episodes.dub && (
                                                    <ThemedText
                                                        type="subtitle"
                                                        style={[
                                                            styles.animeInfo,
                                                            {
                                                                padding:
                                                                    SIZE(5),
                                                                backgroundColor:
                                                                    Colors.light
                                                                        .tabIconSelected,
                                                                borderRadius:
                                                                    SIZE(6),
                                                            },
                                                        ]}
                                                    >
                                                        SUB :{" "}
                                                        {item.episodes.sub}
                                                    </ThemedText>
                                                )}
                                                {item.episodes.raw && (
                                                    <ThemedText
                                                        type="subtitle"
                                                        style={[
                                                            styles.animeInfo,
                                                            {
                                                                padding:
                                                                    SIZE(5),
                                                                backgroundColor:
                                                                    Colors.light
                                                                        .tabIconSelected,
                                                                borderRadius:
                                                                    SIZE(6),
                                                            },
                                                        ]}
                                                    >
                                                        RAW :{" "}
                                                        {item.episodes.raw}
                                                    </ThemedText>
                                                )}
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </ImageBackground>
                        </TouchableRipple>
                    )}
                />
            </View>
        </SafeAreaView>
    );
};

export default ListPage;

const styles = StyleSheet.create({
    animeItem: {
        marginRight: SIZE(10),
        flexDirection: "row",
        borderRadius: SIZE(10),
        width: "100%",
        overflow: "hidden",
    },
    animePoster: {
        width: SIZE(120),
        height: SIZE(170),
        borderRadius: SIZE(10),
        marginRight: SIZE(10),
    },
    animeName: {
        marginBottom: SIZE(5),
        fontSize: SIZE(30),
        color: Colors.light.tabIconSelected,
        textShadowColor: Colors.dark.black,
        textShadowOffset: {
            width: 1,
            height: 1,
        },
        textShadowRadius: 2,
    },
    animeInfo: {
        fontSize: SIZE(12),
        color: Colors.light.white,
        textShadowColor: Colors.dark.black,
        textShadowOffset: {
            width: 1,
            height: 1,
        },
        textShadowRadius: 2,
        lineHeight: SIZE(13),
    },
});
