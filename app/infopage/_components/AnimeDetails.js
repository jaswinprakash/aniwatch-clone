import { ScrollView, StyleSheet, Text, View } from "react-native";
import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import MarqueeText from "@react-native-oh-tpl/react-native-marquee";
import { SIZE } from "../../../constants/Constants";
import { Colors } from "../../../constants/Colors";
import { ThemedText } from "../../../components/ThemedText";
const AnimeDetails = ({ animeInfo, qTip }) => {
    return (
        <View style={styles.infoContainer}>
            <View style={styles.titleContainer}>
                <View style={styles.marquee}>
                    <MarqueeText
                        style={styles.marquee}
                        speed={0.5}
                        marqueeOnStart={true}
                        loop={true}
                        delay={1000}
                    >
                        {animeInfo?.anime?.info?.name}
                    </MarqueeText>
                </View>
                <View style={styles.episodeContainer}>
                    {qTip?.anime?.episodes?.sub && (
                        <ThemedText
                            style={{
                                color: Colors.light.tabIconSelected,
                                borderWidth: SIZE(1),
                                borderColor: Colors.light.tabIconSelected,
                                borderRadius: SIZE(6),
                                padding: SIZE(4),
                            }}
                        >
                            SUB : {qTip?.anime?.episodes?.sub}
                        </ThemedText>
                    )}
                    {qTip?.anime?.episodes?.dub && (
                        <ThemedText
                            style={{
                                color: Colors.light.tabIconSelected,
                                borderWidth: SIZE(1),
                                borderColor: Colors.light.tabIconSelected,
                                borderRadius: SIZE(6),
                                padding: SIZE(4),
                            }}
                        >
                            DUB : {qTip?.anime?.episodes?.dub}
                        </ThemedText>
                    )}
                </View>
            </View>
            <ThemedText type="subtitle" style={styles.detailText}>
                Native name : {animeInfo?.anime?.moreInfo?.japanese}
            </ThemedText>
            <View>
                <ScrollView nestedScrollEnabled style={styles.descScroll}>
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
                {animeInfo?.anime?.moreInfo?.status == "Finished Airing" && (
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                        }}
                    >
                        <ThemedText style={styles.detailTitle}>
                            Aired:
                        </ThemedText>
                        <ThemedText style={styles.detailValue}>
                            {animeInfo?.anime?.moreInfo?.aired}
                        </ThemedText>
                    </View>
                )}
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                    }}
                >
                    <ThemedText style={styles.detailTitle}>Genres:</ThemedText>
                    <ThemedText style={styles.detailValue}>
                        {animeInfo?.anime?.moreInfo?.genres?.join(", ")}
                    </ThemedText>
                </View>
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                    }}
                >
                    <ThemedText style={styles.detailTitle}>
                        Premiered:
                    </ThemedText>
                    <ThemedText style={styles.detailValue}>
                        {animeInfo?.anime?.moreInfo?.premiered}
                    </ThemedText>
                </View>
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                    }}
                >
                    <ThemedText style={styles.detailTitle}>Status:</ThemedText>
                    <ThemedText style={styles.detailValue}>
                        {animeInfo?.anime?.moreInfo?.status}
                    </ThemedText>
                </View>
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                    }}
                >
                    <ThemedText style={styles.detailTitle}>Studios:</ThemedText>
                    <ThemedText style={styles.detailValue}>
                        {animeInfo?.anime?.moreInfo?.studios}
                    </ThemedText>
                </View>
            </View>
        </View>
    );
};

export default AnimeDetails;

const styles = StyleSheet.create({
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
    detailTitle: {
        fontSize: SIZE(14),
        color: Colors.light.tabIconSelected,
        marginRight: SIZE(5),
        fontFamily: "Exo2Bold",
    },
    detailValue: {
        fontSize: SIZE(14),
        color: Colors.light.tabIconSelected,
        width: "85%",
    },
    descScroll: {
        maxHeight: SIZE(100),
        borderWidth: SIZE(1),
        borderColor: Colors.light.tabIconSelected,
        borderRadius: SIZE(5),
        paddingHorizontal: SIZE(5),
        backgroundColor: "rgba(140, 82, 255, 0.2)",
    },
    titleContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        marginBottom: SIZE(10),
    },
    marquee: {
        fontSize: SIZE(24),
        color: Colors.light.tabIconSelected,
        fontFamily: "Exo2Bold",
        flexShrink: 1,
        flexGrow: 1,
        marginRight: SIZE(10),
    },
    episodeContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: SIZE(10),
    },
});
