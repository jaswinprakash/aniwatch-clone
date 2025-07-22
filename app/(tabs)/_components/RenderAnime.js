import { StyleSheet, Image, TouchableOpacity, View } from "react-native";
import React, { useState } from "react";
import { ThemedView } from "../../../components/ThemedView";
import { ThemedText } from "../../../components/ThemedText";
import LottieView from "lottie-react-native";
import { SIZE } from "../../../constants/Constants";
import { TouchableRipple } from "react-native-paper";
import { FlashList } from "@shopify/flash-list";
import { Colors } from "@/constants/Colors";
import { router } from "expo-router";

const RenderAnime = ({ title, data, info, setAnimeId, type }) => {
    const [imageLoading, setImageLoading] = useState(true);
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
                renderItem={({ item }) => (
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
                                        source={require("../../../assets/lottie/loader-3.json")}
                                        autoPlay
                                        loop
                                        style={{
                                            position: "absolute",
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
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
                )}
            />
        </ThemedView>
    );
};

export default React.memo(RenderAnime);

const styles = StyleSheet.create({
    sectionContainer: {
        marginBottom: SIZE(10),
        height: SIZE(240),
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    sectionTitle: {
        fontSize: SIZE(20),
        marginBottom: SIZE(10),
        color: Colors.light.tabIconSelected,
    },
    sectionLink: {
        fontSize: SIZE(14),
        color: Colors.light.tabIconSelected,
        marginBottom: SIZE(10),
    },
    animeItem: {
        marginRight: SIZE(8),
        alignItems: "center",
        height: SIZE(240),
    },
    animePoster: {
        width: SIZE(130),
        height: SIZE(190),
        borderRadius: SIZE(10),
    },
    animeName: {
        marginTop: SIZE(5),
        textAlign: "center",
        width: SIZE(130),
        fontSize: SIZE(12),
        color: Colors.light.tabIconSelected,
    },
});
