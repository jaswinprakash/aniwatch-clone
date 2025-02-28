import {
    ImageBackground,
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
} from "react-native";
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

const InfoPage = () => {
    const route = useRoute();
    const [animeInfo, setAnimeInfo] = useState(null);
    const [qTip, setQtip] = useState(null);
    const [pageLoading, setPageLoading] = useState(true);
    const [showFullDescription, setShowFullDescription] = useState(false); // State for toggling description

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
            setPageLoading(false);
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
            <Text style={styles.relatedAnimeName} numberOfLines={2}>
                {item.name}
            </Text>
        </View>
    );

    return (
        <SafeAreaView
            style={{ flex: 1, backgroundColor: Colors.dark.background }}
        >
            <ScrollView>
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
                        <View
                            style={{
                                position: "absolute",
                                top: SIZE(10),
                                left: SIZE(10),
                                flexDirection: "row",
                                gap: SIZE(5),
                            }}
                        >
                            {qTip?.anime?.quality && (
                                <MiniItem data={qTip?.anime?.type} />
                            )}
                            {qTip?.anime?.quality && (
                                <MiniItem data={qTip?.anime?.quality} />
                            )}
                        </View>
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
                    <ThemedText
                        type="default"
                        style={styles.description}
                        numberOfLines={showFullDescription ? undefined : 5}
                        ellipsizeMode="tail"
                    >
                        {animeInfo?.anime?.info?.description}
                    </ThemedText>
                    {animeInfo?.anime?.info?.description?.length > 200 && (
                        <TouchableOpacity
                            onPress={() =>
                                setShowFullDescription(!showFullDescription)
                            }
                        >
                            <ThemedText style={styles.showMoreButton}>
                                {showFullDescription
                                    ? "Show Less"
                                    : "Show More"}
                            </ThemedText>
                        </TouchableOpacity>
                    )}
                    <View style={styles.detailsContainer}>
                        <ThemedText style={styles.detailText}>
                            Aired: {animeInfo?.anime?.moreInfo?.aired}
                        </ThemedText>
                        <ThemedText style={styles.detailText}>
                            Duration: {animeInfo?.anime?.moreInfo?.duration}
                        </ThemedText>
                        <ThemedText style={styles.detailText}>
                            Genres:{" "}
                            {animeInfo?.anime?.moreInfo?.genres?.join(", ")}
                        </ThemedText>
                        <ThemedText style={styles.detailText}>
                            MAL Score: {animeInfo?.anime?.moreInfo?.malscore}
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
                        keyExtractor={(item) => item.id}
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
        marginBottom: SIZE(8),
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
});
