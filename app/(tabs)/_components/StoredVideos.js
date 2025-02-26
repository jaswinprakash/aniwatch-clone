import { Image, StyleSheet, Text, View } from "react-native";
import React, { useEffect, useState } from "react";
import { apiConfig } from "@/AxiosConfig";
import { ThemedText } from "@/components/ThemedText";
import { SIZE } from "@/constants/Constants";
import { Colors } from "@/constants/Colors";
import { TouchableRipple } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";

const StoredVideos = ({ id, episode, time }) => {
    const [animeInfo, setAnimeInfo] = useState();
    const [pageLoading, setPageLoading] = useState(true);
    const getAnimeInfo = async () => {
        try {
            const response = await apiConfig.get(`/api/v2/hianime/anime/${id}`);
            setAnimeInfo(response.data.data);
            setPageLoading(false);
        } catch (error) {
            console.log(error, "axios error");
        }
    };

    useEffect(() => {
        getAnimeInfo();
    }, [id]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
    };
    return (
        <View style={{ width: "100%" }}>
            <TouchableRipple
                onPress={() => {
                    router.push({
                        pathname: "watchpage",
                        params: {
                            id: id,
                            history: true,
                        },
                    });
                }}
                rippleColor="rgba(255, 255, 255, 0.2)"
                borderless={true}
                style={{
                    borderRadius: SIZE(10),
                    borderColor: Colors.light.tabIconSelected,
                    borderWidth: SIZE(1),
                }}
            >
                <View style={{ width: "100%" }}>
                    <View style={styles.main}>
                        <View style={styles.leftContent}>
                            <Image
                                style={styles.imageContainer}
                                src={animeInfo?.anime?.info?.poster}
                            />
                        </View>
                        <View
                            style={{
                                justifyContent: "space-between",
                                flexDirection: "row",
                            }}
                        >
                            <View style={styles.rightContent}>
                                <ThemedText
                                    type="title"
                                    numberOfLines={1}
                                    style={{
                                        color: Colors.light.tabIconSelected,
                                        fontSize: SIZE(20),
                                    }}
                                >
                                    {animeInfo?.anime?.info?.name}
                                </ThemedText>
                                <ThemedText
                                    type="subtitle"
                                    style={{
                                        color: Colors.light.tabIconSelected,
                                        fontSize: SIZE(15),
                                    }}
                                >
                                    Episode - {episode}
                                </ThemedText>
                                <ThemedText
                                    type="subtitle"
                                    style={{
                                        color: Colors.light.tabIconSelected,
                                        fontSize: SIZE(15),
                                        bottom: SIZE(10),
                                        position: "absolute",
                                    }}
                                >
                                    Click to resume ({formatTime(time)})
                                </ThemedText>
                            </View>
                            <TouchableRipple
                                hitSlop={10}
                                onPress={() => {}}
                                rippleColor="rgba(255, 255, 255, 0.2)"
                                borderless={true}
                                style={{
                                    justifyContent: "center",
                                    alignSelf: "center",
                                    borderRadius: SIZE(5),
                                }}
                            >
                                <MaterialIcons
                                    name="delete"
                                    size={SIZE(24)}
                                    color={Colors.light.tabIconSelected}
                                />
                            </TouchableRipple>
                        </View>
                    </View>
                </View>
            </TouchableRipple>
        </View>
    );
};

export default StoredVideos;

const styles = StyleSheet.create({
    main: {
        flexDirection: "row",
        borderRadius: SIZE(10),
        width: "100%",
    },
    leftContent: {
        width: SIZE(100),
        height: SIZE(150),
        borderRadius: SIZE(10),
        marginRight: SIZE(10),
    },
    imageContainer: {
        height: "100%",
        borderRadius: SIZE(10),
    },
    rightContent: {
        width: "65%",
    },
});
