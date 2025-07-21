import { StyleSheet, Text, View } from "react-native";
import React, { useState } from "react";
import { ThemedView } from "../../../components/ThemedView";
import { ThemedText } from "../../../components/ThemedText";
import LottieView from "lottie-react-native";
import { SIZE } from "../../../constants/Constants";
import { TouchableRipple } from "react-native-paper";
import { FlashList } from "@shopify/flash-list";
import FastImage from "@d11/react-native-fast-image";
import { Colors } from "@/constants/Colors";
import { router } from "expo-router";

const RenderAnime = ({ title, data, info, setAnimeId }) => {
    const [imageLoading, setImageLoading] = useState(true);
    if (!data) return null;

    return (
        <ThemedView style={styles.sectionContainer}>
            <ThemedText type="title" style={styles.sectionTitle}>
                {title}
            </ThemedText>
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
                                <FastImage
                                    source={{
                                        uri: item.poster,
                                        priority: FastImage.priority.high,
                                    }}
                                    style={styles.animePoster}
                                    onLoadStart={() => setImageLoading(true)}
                                    onLoadEnd={() => setImageLoading(false)}
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

export default RenderAnime;

const styles = StyleSheet.create({
    sectionContainer: {
        marginBottom: SIZE(30),
        height: SIZE(260),
    },
    sectionTitle: {
        fontSize: SIZE(20),
        marginBottom: SIZE(10),
        color: Colors.light.tabIconSelected,
    },
    animeItem: {
        marginRight: SIZE(10),
        alignItems: "center",
        height: SIZE(260),
    },
    animePoster: {
        width: SIZE(150),
        height: SIZE(220),
        borderRadius: SIZE(10),
    },
    animeName: {
        marginTop: SIZE(5),
        textAlign: "center",
        width: SIZE(120),
        fontSize: SIZE(12),
        color: Colors.light.tabIconSelected,
    },
});
