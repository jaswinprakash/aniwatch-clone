import { StyleSheet, View, ScrollView } from "react-native";
import React, { useEffect, useState } from "react";
import { useRoute } from "@react-navigation/native";
import FastImage from "@d11/react-native-fast-image";
import { SIZE } from "../../constants/Constants";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../constants/Colors";
import { apiConfig } from "../../AxiosConfig";
import { FlashList } from "@shopify/flash-list";
import { ThemedText } from "../../components/ThemedText";
import { ActivityIndicator, TouchableRipple } from "react-native-paper";
import Spotlight from "./_components/Spotlight";
import AnimeDetails from "./_components/AnimeDetails";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAnimeHistory } from "@/store/AnimeHistoryContext";

const InfoPage = () => {
    const route = useRoute();
    const [animeInfo, setAnimeInfo] = useState(null);
    const [qTip, setQtip] = useState(null);
    const [pageLoading, setPageLoading] = useState(true);
    const [animeId, setAnimeId] = useState(route?.params?.id);
    const [continueWatching, setContinueWatching] = useState(false);
    const history = useAnimeHistory();
    // console.log(history, "qtippppppp");

    const getAnimeInfo = async (id) => {
        setPageLoading(true);
        try {
            const response = await apiConfig.get(
                `/api/v2/hianime/anime/${animeId}`
            );
            setAnimeInfo(response.data.data);
            setPageLoading(false);
        } catch (error) {
            console.log(error, "axios error");
        }
    };

    const getQtipInfo = async (id) => {
        setPageLoading(true);
        try {
            const response = await apiConfig.get(
                `/api/v2/hianime/qtip/${animeId}`
            );
            setQtip(response.data.data);
            // setPageLoading(false);
        } catch (error) {
            console.log(error, "axios error");
        }
    };
    useEffect(() => {
        history.find((item) => item.animeId === animeId)
            ? setContinueWatching(true)
            : setContinueWatching(false);
    }, [animeId]);

    useEffect(() => {
        getAnimeInfo();
        getQtipInfo();
    }, [animeId]);

    if (pageLoading) {
        return (
            <SafeAreaView
                style={{ flex: 1, backgroundColor: Colors.dark.background }}
            >
                <ActivityIndicator
                    size={"small"}
                    color={Colors.light.tabIconSelected}
                    style={{ flex: 1 }}
                />
            </SafeAreaView>
        );
    }

    const renderRelatedAnime = ({ item }) => (
        <View style={styles.relatedAnimeItem}>
            <TouchableRipple
                onPress={() => {
                    setAnimeId(item.id);
                }}
                rippleColor="rgba(140, 82, 255, 0.5)"
                borderless={true}
                style={styles.relatedAnimeImage}
            >
                <FastImage
                    style={styles.relatedAnimeImage}
                    source={{ uri: item.poster }}
                    resizeMode="cover"
                />
            </TouchableRipple>
            <ThemedText style={styles.relatedAnimeName} numberOfLines={2}>
                {item.name}
            </ThemedText>
        </View>
    );

    return (
        <SafeAreaView
            style={{
                flex: 1,
                backgroundColor: Colors.dark.background,
            }}
        >
            <ScrollView
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
            >
                <Spotlight animeInfo={animeInfo} qTip={qTip} />
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        width: "100%",
                        justifyContent: "space-between",
                        paddingTop: SIZE(16),
                        paddingHorizontal: SIZE(16),
                    }}
                >
                    <TouchableRipple
                        onPress={() => {
                            router.push({
                                pathname: "watchpage",
                                params: {
                                    id: animeInfo?.anime?.info?.id,
                                    ...(continueWatching && {
                                        history: true,
                                        episode: history.find(
                                            (item) =>
                                                item.animeId ===
                                                animeInfo?.anime?.info?.id
                                        )?.episodeNumber,
                                    }),
                                },
                            });
                        }}
                        rippleColor="rgba(140, 82, 255, 0.5)"
                        borderless={true}
                        style={{ borderRadius: SIZE(6), width: "48%" }}
                    >
                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                borderColor: Colors.light.tabIconSelected,
                                borderWidth: SIZE(1),
                                borderRadius: SIZE(6),
                                height: SIZE(40),
                                justifyContent: "center",
                            }}
                        >
                            <MaterialIcons
                                name="play-circle-outline"
                                size={SIZE(20)}
                                color={Colors.light.tabIconSelected}
                            />
                            <ThemedText type="subtitle" style={styles.playText}>
                                {continueWatching
                                    ? "Continue Watching"
                                    : "Play"}
                            </ThemedText>
                        </View>
                    </TouchableRipple>
                    <TouchableRipple
                        onPress={() => {}}
                        rippleColor="rgba(140, 82, 255, 0.5)"
                        borderless={true}
                        style={{ borderRadius: SIZE(6), width: "48%" }}
                    >
                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                borderColor: Colors.light.tabIconSelected,
                                borderWidth: SIZE(1),
                                borderRadius: SIZE(6),
                                height: SIZE(40),
                                justifyContent: "center",
                            }}
                        >
                            <MaterialIcons
                                name="download"
                                size={SIZE(20)}
                                color={Colors.light.tabIconSelected}
                            />
                            <ThemedText type="subtitle" style={styles.playText}>
                                Download
                            </ThemedText>
                        </View>
                    </TouchableRipple>
                </View>
                <AnimeDetails animeInfo={animeInfo} qTip={qTip} />
                {/* Related Animes Section */}
                <View style={styles.relatedAnimesContainer}>
                    <ThemedText type="subtitle" style={styles.sectionTitle}>
                        Related Animes
                    </ThemedText>
                    <FlashList
                        data={animeInfo?.relatedAnimes}
                        renderItem={renderRelatedAnime}
                        keyExtractor={(item, index) => index.toString()}
                        horizontal
                        estimatedItemSize={150}
                        showsHorizontalScrollIndicator={false}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default InfoPage;

const styles = StyleSheet.create({
    relatedAnimesContainer: {
        marginTop: SIZE(24),
        paddingHorizontal: SIZE(16),
        marginBottom: SIZE(16),
    },
    sectionTitle: {
        fontSize: SIZE(20),
        color: Colors.light.tabIconSelected,
        marginBottom: SIZE(12),
    },
    relatedAnimeItem: {
        width: SIZE(150),
        height: SIZE(280),
        marginRight: SIZE(12),
    },
    relatedAnimeImage: {
        width: SIZE(150),
        height: SIZE(220),
        borderRadius: SIZE(8),
    },
    relatedAnimeName: {
        fontSize: SIZE(14),
        color: Colors.light.tabIconSelected,
        marginTop: SIZE(5),
        textAlign: "center",
        lineHeight: SIZE(16),
    },
    playText: {
        fontSize: SIZE(14),
        color: Colors.light.tabIconSelected,
        marginLeft: SIZE(5),
    },
});
