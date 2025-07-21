import { StyleSheet, View, ScrollView, FlatList } from "react-native";
import React, { useEffect, useState } from "react";
import { useRoute } from "@react-navigation/native";
import FastImage from "@d11/react-native-fast-image";
import { SIZE } from "../../constants/Constants";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../constants/Colors";
import { apiConfig } from "../../AxiosConfig";
import { FlashList } from "@shopify/flash-list";
import { ThemedText } from "../../components/ThemedText";
import { TouchableRipple } from "react-native-paper";
import Spotlight from "./_components/Spotlight";
import AnimeDetails from "./_components/AnimeDetails";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAnimeHistory } from "@/store/AnimeHistoryContext";
import RenderAnime from "../(tabs)/_components/RenderAnime";
import LottieView from "lottie-react-native";

const InfoPage = () => {
    const route = useRoute();
    const [animeInfo, setAnimeInfo] = useState(null);
    const [qTip, setQtip] = useState(null);
    const [pageLoading, setPageLoading] = useState(true);
    const [animeId, setAnimeId] = useState(route?.params?.id);
    const history = useAnimeHistory();
    const animeHistory = useAnimeHistory();
    const playbackInfo = animeHistory.find((item) => item.animeId === animeId);

    const getAnimeInfo = async (id) => {
        setPageLoading(true);
        try {
            const response = await apiConfig.get(
                `/api/v2/hianime/anime/${animeId}`
            );
            setAnimeInfo(response.data.data);
            setPageLoading(false);
        } catch (error) {
            console.log(error, "axios error - info page");
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
            console.log(error, "axios error - info page qtip");
        }
    };

    useEffect(() => {
        getAnimeInfo();
        getQtipInfo();
    }, [animeId]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
    };

    if (pageLoading) {
        return (
            <SafeAreaView
                style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
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
            </SafeAreaView>
        );
    }
    const renderVoiceActorItem = ({ item }) => (
        <View style={styles.voiceActorItem}>
            <FastImage
                source={{ uri: item.character.poster }}
                style={styles.characterImage}
            />
            <ThemedText type="subtitle" style={styles.characterName}>
                {item.character.name}
            </ThemedText>
            <FastImage
                source={{ uri: item.voiceActor.poster }}
                style={styles.voiceActorImage}
            />
            <ThemedText type="subtitle" style={styles.voiceActorName}>
                {item.voiceActor.name}
            </ThemedText>
        </View>
    );

    const validVoiceActors =
        animeInfo?.anime?.info?.charactersVoiceActors?.filter(
            (item) =>
                item.character?.name &&
                item.character?.poster &&
                item.voiceActor?.name &&
                item.voiceActor?.poster
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
                            router.navigate({
                                pathname: "watchpage",
                                params: {
                                    id: animeInfo?.anime?.info?.id,
                                    ...(playbackInfo && {
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
                        rippleColor={Colors.dark.backgroundPress}
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
                                {playbackInfo
                                    ? `Continue (${
                                          playbackInfo?.episodeNumber
                                      } - ${formatTime(
                                          playbackInfo?.currentTime
                                      )})`
                                    : "Play"}
                            </ThemedText>
                        </View>
                    </TouchableRipple>
                    {/* <TouchableRipple
                        onPress={() => {}}
                        rippleColor={Colors.dark.backgroundPress}
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
                    </TouchableRipple> */}
                    <View style={styles.episodeContainer}>
                        {qTip?.anime?.episodes?.sub && (
                            <View
                                style={{
                                    borderWidth: SIZE(1),
                                    borderColor: Colors.light.tabIconSelected,
                                    borderRadius: SIZE(6),
                                    height: SIZE(40),
                                    paddingHorizontal: SIZE(10),
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <ThemedText
                                    style={{
                                        color: Colors.light.tabIconSelected,
                                    }}
                                >
                                    SUB : {qTip?.anime?.episodes?.sub}
                                </ThemedText>
                            </View>
                        )}
                        {qTip?.anime?.episodes?.dub && (
                            <View
                                style={{
                                    borderWidth: SIZE(1),
                                    borderColor: Colors.light.tabIconSelected,
                                    borderRadius: SIZE(6),
                                    height: SIZE(40),
                                    paddingHorizontal: SIZE(10),
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <ThemedText
                                    style={{
                                        color: Colors.light.tabIconSelected,
                                    }}
                                >
                                    DUB : {qTip?.anime?.episodes?.dub}
                                </ThemedText>
                            </View>
                        )}
                    </View>
                </View>
                <AnimeDetails animeInfo={animeInfo} qTip={qTip} />
                {validVoiceActors?.length > 0 && (
                    <View style={styles.voiceActorsContainer}>
                        <ThemedText type="title" style={styles.sectionTitle}>
                            Voice Actors
                        </ThemedText>
                        <FlatList
                            data={validVoiceActors}
                            renderItem={renderVoiceActorItem}
                            keyExtractor={(item) => item.character.id}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                        />
                    </View>
                )}
                <View style={styles.relatedAnimesContainer}>
                    <RenderAnime
                        title={" Related Animes"}
                        data={animeInfo?.relatedAnimes}
                        info={true}
                        setAnimeId={setAnimeId}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default InfoPage;

const styles = StyleSheet.create({
    relatedAnimesContainer: {
        marginTop: SIZE(16),
        paddingHorizontal: SIZE(16),
        marginBottom: SIZE(16),
    },
    sectionTitle: {
        fontSize: SIZE(20),
        color: Colors.light.tabIconSelected,
        marginBottom: SIZE(12),
    },
    playText: {
        fontSize: SIZE(13),
        color: Colors.light.tabIconSelected,
        marginLeft: SIZE(5),
    },
    episodeContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: SIZE(5),
    },
    voiceActorsContainer: {
        paddingHorizontal: SIZE(16),
    },
    voiceActorItem: {
        width: SIZE(120),
        alignItems: "center",
    },
    characterImage: {
        width: SIZE(100),
        height: SIZE(100),
        borderRadius: SIZE(50),
    },
    characterName: {
        fontSize: SIZE(14),
        color: Colors.light.tabIconSelected,
        marginTop: SIZE(5),
        textAlign: "center",
    },
    voiceActorImage: {
        width: SIZE(100),
        height: SIZE(100),
        borderRadius: SIZE(50),
        marginTop: SIZE(10),
    },
    voiceActorName: {
        fontSize: SIZE(14),
        color: Colors.light.tabIconSelected,
        marginTop: SIZE(5),
        textAlign: "center",
    },
});
