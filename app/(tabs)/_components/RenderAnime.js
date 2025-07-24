import { Colors } from "@/constants/Colors";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import LottieView from "lottie-react-native";
import React, { useState } from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { TouchableRipple } from "react-native-paper";
import { ThemedText } from "../../../components/ThemedText";
import { ThemedView } from "../../../components/ThemedView";
import { SIZE } from "../../../constants/Constants";

const AnimeItem = ({ item, info, setAnimeId }) => {
    const [imageLoading, setImageLoading] = useState(true);

    return (
        <View style={styles.animeItem}>
            <TouchableRipple
                rippleColor={Colors.dark.backgroundPress}
                borderless={true}
                style={{ borderRadius: SIZE(10) }}
                onPress={() => {
                    if (info) {
                        setAnimeId(item.id);
                    } else {
                        router.navigate({
                            pathname: "infopage",
                            params: {
                                id: item.id,
                            },
                        });
                    }
                }}
            >
                <>
                    {imageLoading && (
                        <LottieView
                            source={require("../../../assets/lottie/loader2.json")}
                            autoPlay
                            loop
                            style={{
                                position: "absolute",
                                alignSelf: "center",
                                width: SIZE(100),
                                height: SIZE(100),
                                top: "28%",
                            }}
                        />
                    )}
                    <Image
                        style={styles.animePoster}
                        source={{ uri: item.poster }}
                        resizeMode="cover"
                        onLoadEnd={() => {
                            setImageLoading(false);
                        }}
                    />
                </>
            </TouchableRipple>

            <ThemedText
                numberOfLines={2}
                type="subtitle"
                style={styles.animeName}
            >
                {item.name}
            </ThemedText>
        </View>
    );
};

const RenderAnime = ({ title, data, info, setAnimeId, type }) => {
    if (!data) return null;

    return (
        <ThemedView style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
                <ThemedText type="title" style={styles.sectionTitle}>
                    {title}
                </ThemedText>
                <TouchableOpacity
                    onPress={() => {
                        router.navigate({
                            pathname: "listpage",
                            params: {
                                type: type,
                                title: title,
                            },
                        });
                    }}
                >
                    <ThemedText type="title" style={styles.sectionLink}>
                        See all
                    </ThemedText>
                </TouchableOpacity>
            </View>

            <FlashList
                data={data}
                keyExtractor={(item, index) => index.toString()}
                estimatedItemSize={50}
                horizontal
                contentContainerStyle={{ paddingHorizontal: SIZE(16) }}
                renderItem={({ item }) => (
                    <AnimeItem
                        item={item}
                        info={info}
                        setAnimeId={setAnimeId}
                    />
                )}
            />
        </ThemedView>
    );
};

export default React.memo(RenderAnime);

const styles = StyleSheet.create({
    sectionContainer: {},
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: SIZE(16),
    },
    sectionTitle: {
        fontSize: SIZE(20),
        marginBottom: SIZE(10),
        color: Colors.light.tabIconSelected,
    },
    sectionLink: {
        fontSize: SIZE(14),
        color: Colors.light.white,
        marginBottom: SIZE(10),
    },
    animeItem: {
        marginRight: SIZE(8),
        alignItems: "center",
        height: SIZE(268),
    },
    animePoster: {
        width: SIZE(150),
        height: SIZE(230),
        borderRadius: SIZE(10),
    },
    animeName: {
        marginTop: SIZE(5),
        textAlign: "center",
        width: SIZE(150),
        fontSize: SIZE(12),
        color: Colors.light.tabIconSelected,
    },
});
