import { ImageBackground, StyleSheet, View, ScrollView } from "react-native";
import React, { useEffect, useState } from "react";
import { useRoute } from "@react-navigation/native";
import FastImage from "@d11/react-native-fast-image";
import { ThemedView } from "../../components/ThemedView";
import { SIZE } from "../../constants/Constants";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../constants/Colors";
import { apiConfig } from "../../AxiosConfig";
import { FlashList } from "@shopify/flash-list";
import { ThemedText } from "../../components/ThemedText";
import { ActivityIndicator, TouchableRipple } from "react-native-paper";
import MiniItem from "./_components/MiniItem";
import { LinearGradient } from "expo-linear-gradient";
import { AntDesign, MaterialIcons } from "@expo/vector-icons";

const InfoPage = () => {
    const route = useRoute();
    const [animeInfo, setAnimeInfo] = useState(null);
    const [qTip, setQtip] = useState(null);
    const [pageLoading, setPageLoading] = useState(true);
    console.log(qTip, "qtippppppp");

    const getAnimeInfo = async (id) => {
        setPageLoading(true);
        try {
            const response = await apiConfig.get(
                `/api/v2/hianime/anime/${id ? id : route?.params?.id}`
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
                `/api/v2/hianime/qtip/${id ? id : route?.params?.id}`
            );
            setQtip(response.data.data);
            // setPageLoading(false);
        } catch (error) {
            console.log(error, "axios error");
        }
    };

    useEffect(() => {
        getAnimeInfo();
        getQtipInfo();
    }, []);

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
                    getAnimeInfo(item.id);
                    getQtipInfo(item.id);
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
                {/* Anime Poster and Background */}
                <ThemedView style={styles.imageContainer}>
                    <ImageBackground
                        style={[styles.backgroundImage]}
                        source={{ uri: animeInfo?.anime?.info?.poster }}
                        resizeMode="cover"
                        blurRadius={2}
                    >
                        <FastImage
                            style={[styles.fastImage]}
                            source={{
                                uri: animeInfo?.anime?.info?.poster,
                                priority: FastImage.priority.high,
                            }}
                            resizeMode="contain"
                        />
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
                            style={styles.topGradient}
                        >
                            <View style={styles.itemCommon}>
                                {qTip?.anime?.quality && (
                                    <MiniItem data={qTip?.anime?.type} />
                                )}
                                {qTip?.anime?.quality && (
                                    <MiniItem data={qTip?.anime?.quality} />
                                )}
                            </View>
                            <View style={styles.itemCommon}>
                                <AntDesign
                                    name="clockcircle"
                                    size={SIZE(18)}
                                    color={Colors.light.tabIconSelected}
                                />
                                <ThemedText
                                    type="default"
                                    style={{
                                        color: Colors.light.tabIconSelected,
                                    }}
                                >
                                    {animeInfo?.anime?.moreInfo?.duration}
                                </ThemedText>
                            </View>
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
                            style={styles.bottomGradient}
                        >
                            {qTip?.anime?.aired && (
                                <View style={styles.itemCommon}>
                                    <MaterialIcons
                                        name="calendar-month"
                                        size={SIZE(20)}
                                        color={Colors.light.tabIconSelected}
                                    />
                                    <ThemedText
                                        type="default"
                                        style={{
                                            color: Colors.light.tabIconSelected,
                                        }}
                                    >
                                        {qTip?.anime?.aired}
                                    </ThemedText>
                                </View>
                            )}
                            {qTip?.anime?.malscore && (
                                <View style={styles.itemCommon}>
                                    <MaterialIcons
                                        name="star"
                                        size={SIZE(20)}
                                        color={Colors.light.tabIconSelected}
                                    />
                                    <ThemedText
                                        type="default"
                                        style={{
                                            color: Colors.light.tabIconSelected,
                                        }}
                                    >
                                        {qTip?.anime?.malscore}
                                    </ThemedText>
                                </View>
                            )}
                        </LinearGradient>
                    </ImageBackground>
                </ThemedView>
                {/* Anime Details */}
                <View style={styles.infoContainer}>
                    <ThemedText type="title" style={styles.title}>
                        {animeInfo?.anime?.info?.name}
                    </ThemedText>
                    <ThemedText type="subtitle" style={styles.detailText}>
                        Japanese -{animeInfo?.anime?.moreInfo?.japanese}
                    </ThemedText>
                    <View>
                        <ScrollView
                            nestedScrollEnabled
                            style={styles.descScroll}
                        >
                            <ThemedText
                                type="default"
                                style={styles.description}
                                ellipsizeMode="tail"
                            >
                                {animeInfo?.anime?.info?.description}
                            </ThemedText>
                        </ScrollView>
                        <LinearGradient
                            colors={[
                                "transparent",
                                "rgba(0, 0, 0, 0.1)",
                                "rgba(0, 0, 0, 0.2)",
                                "rgba(0, 0, 0, 0.3)",
                                "rgba(0, 0, 0, 0.4)",
                            ]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0, y: 1 }}
                            style={{
                                position: "absolute",
                                bottom: SIZE(0),
                                width: "100%",
                                zIndex: 1000,
                                height: SIZE(30),
                                borderColor: "red",
                            }}
                        ></LinearGradient>
                    </View>
                    <View style={styles.detailsContainer}>
                        {animeInfo?.anime?.moreInfo?.status ==
                            "Finished Airing" && (
                            <ThemedText style={styles.detailText}>
                                Aired: {animeInfo?.anime?.moreInfo?.aired}
                            </ThemedText>
                        )}
                        <ThemedText style={styles.detailText}>
                            Genres:{" "}
                            {animeInfo?.anime?.moreInfo?.genres?.join(", ")}
                        </ThemedText>
                        <ThemedText style={styles.detailText}>
                            Premiered: {animeInfo?.anime?.moreInfo?.premiered}
                        </ThemedText>
                        <ThemedText style={styles.detailText}>
                            Status: {animeInfo?.anime?.moreInfo?.status}
                        </ThemedText>
                        <ThemedText style={styles.detailText}>
                            Studios: {animeInfo?.anime?.moreInfo?.studios}
                        </ThemedText>
                    </View>
                </View>
                {/* Related Animes Section */}
                <View style={styles.relatedAnimesContainer}>
                    <ThemedText style={styles.sectionTitle}>
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
    imageContainer: {
        height: SIZE(250),
        backgroundColor: "#000",
        justifyContent: "center",
        alignItems: "center",
    },
    backgroundImage: {
        height: "100%",
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
    },
    fastImage: {
        height: "100%",
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    infoContainer: {
        padding: SIZE(16),
    },
    title: {
        fontSize: SIZE(24),
        color: Colors.light.tabIconSelected,
        marginBottom: SIZE(8),
    },
    description: {
        fontSize: SIZE(13),
        color: Colors.light.tabIconSelected,
        lineHeight: SIZE(16),
        marginBottom: SIZE(8),
        marginTop: SIZE(3),
    },
    detailsContainer: {
        marginTop: SIZE(16),
    },
    detailText: {
        fontSize: SIZE(14),
        color: Colors.light.tabIconSelected,
        marginBottom: SIZE(8),
    },
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
        width: SIZE(120),
        marginRight: SIZE(12),
    },
    relatedAnimeImage: {
        width: "100%",
        height: SIZE(150),
        borderRadius: SIZE(8),
    },
    relatedAnimeName: {
        fontSize: SIZE(14),
        color: Colors.light.tabIconSelected,
        marginTop: SIZE(8),
        textAlign: "center",
    },
    showMoreButton: {
        color: Colors.dark.text,
        fontSize: SIZE(14),
        marginTop: SIZE(8),
    },
    topGradient: {
        position: "absolute",
        top: SIZE(0),
        flexDirection: "row",
        gap: SIZE(5),
        width: "100%",
        paddingTop: SIZE(10),
        paddingHorizontal: SIZE(10),
        alignItems: "center",
        justifyContent: "space-between",
    },
    itemCommon: {
        alignItems: "center",
        flexDirection: "row",
        gap: SIZE(5),
    },
    bottomGradient: {
        position: "absolute",
        bottom: SIZE(0),
        flexDirection: "row",
        gap: SIZE(5),
        width: "100%",
        paddingBottom: SIZE(10),
        paddingHorizontal: SIZE(10),
        justifyContent: "space-between",
    },
    descScroll: {
        maxHeight: SIZE(100),
        borderWidth: SIZE(1),
        borderColor: Colors.light.tabIconSelected,
        borderRadius: SIZE(5),
        paddingHorizontal: SIZE(5),
        backgroundColor: "rgba(140, 82, 255, 0.2)",
    },
});
