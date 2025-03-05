import { ImageBackground, StyleSheet, Text, View } from "react-native";
import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import FastImage from "@d11/react-native-fast-image";
import { SIZE } from "../../../constants/Constants";
import { Colors } from "../../../constants/Colors";
import { ThemedText } from "../../../components/ThemedText";
import { ThemedView } from "../../../components/ThemedView";
import MiniItem from "./MiniItem";

const Spotlight = ({ animeInfo, qTip }) => {
    return (
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
                        {animeInfo?.anime?.info?.stats?.rating && (
                            <MiniItem
                                data={animeInfo?.anime?.info?.stats?.rating}
                            />
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
    );
};

export default Spotlight;

const styles = StyleSheet.create({
    imageContainer: {
        height: SIZE(250),
        backgroundColor: Colors.dark.black,
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
});
