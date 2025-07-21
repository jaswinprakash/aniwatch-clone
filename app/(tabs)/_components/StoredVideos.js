import { StyleSheet, View } from "react-native";
import React, { useEffect, useState } from "react";
import { apiConfig } from "@/AxiosConfig";
import { ThemedText } from "@/components/ThemedText";
import { SIZE } from "@/constants/Constants";
import { Colors } from "@/constants/Colors";
import { TouchableRipple } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image, ImageBackground } from "expo-image";
import { useDispatch } from "react-redux";
import { deletePlayback } from "@/store/playbackSlice";
import { SkeletonLoader } from "@/components/SkeletonLoader";

const StoredVideos = ({ id, episode, time }) => {
    const blurhash =
        "|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[";

    const [animeInfo, setAnimeInfo] = useState();
    const [pageLoading, setPageLoading] = useState(true);
    const dispatch = useDispatch();
    const getAnimeInfo = async () => {
        try {
            const response = await apiConfig.get(`/api/v2/hianime/anime/${id}`);
            setAnimeInfo(response.data.data);
            setPageLoading(false);
        } catch (error) {
            console.log(error, "axios error - info - stored");
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

    if (pageLoading) {
        return (
            <SkeletonLoader
                height={SIZE(120)}
                width={SIZE(100)}
                style={{
                    width: "100%",
                    marginBottom: SIZE(10),
                    borderRadius: SIZE(10),
                }}
                backgroundColor={Colors.dark.background}
            />
        );
    }
    return (
        <View style={{ width: "100%", marginBottom: SIZE(20) }}>
            <TouchableRipple
                onPress={() => {
                    router.navigate({
                        pathname: "watchpage",
                        params: {
                            id: id,
                            history: true,
                            episode: episode,
                        },
                    });
                }}
                rippleColor={Colors.dark.backgroundPress}
                borderless={true}
                style={{
                    borderRadius: SIZE(10),
                }}
            >
                <ImageBackground
                    style={[
                        styles.animeItem,
                        { backgroundColor: "rgba(0, 0, 0, 0.2)" },
                    ]}
                    source={{ uri: animeInfo?.anime?.info?.poster }}
                    contentFit="cover"
                    blurRadius={1}
                    placeholder={{ blurhash }}
                    transition={1000}
                >
                    <View style={{ width: "100%" }}>
                        <View style={styles.main}>
                            <View style={styles.leftContent}>
                                <Image
                                    style={styles.imageContainer}
                                    source={{
                                        uri: animeInfo?.anime?.info?.poster,
                                    }}
                                    placeholder={{ blurhash }}
                                    contentFit="cover"
                                    transition={1000}
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
                                        numberOfLines={2}
                                        style={{
                                            color: Colors.light.tabIconSelected,
                                            fontSize: SIZE(20),
                                            textShadowColor: Colors.dark.black,
                                            textShadowOffset: {
                                                width: 1,
                                                height: 1,
                                            },
                                            textShadowRadius: 2,
                                        }}
                                    >
                                        {animeInfo?.anime?.info?.name}
                                    </ThemedText>
                                    <ThemedText
                                        type="subtitle"
                                        style={{
                                            color: Colors.light.tabIconSelected,
                                            fontSize: SIZE(15),
                                            bottom: SIZE(30),
                                            position: "absolute",
                                            textShadowColor: Colors.dark.black,
                                            textShadowOffset: {
                                                width: 1,
                                                height: 1,
                                            },
                                            textShadowRadius: 2,
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
                                            textShadowColor: Colors.dark.black,
                                            textShadowOffset: {
                                                width: 1,
                                                height: 1,
                                            },
                                            textShadowRadius: 2,
                                        }}
                                    >
                                        Played time : {formatTime(time)}
                                    </ThemedText>
                                </View>
                                <TouchableRipple
                                    hitSlop={10}
                                    onPress={() => {
                                        dispatch(deletePlayback(id));
                                    }}
                                    rippleColor={Colors.dark.backgroundPress}
                                    borderless={true}
                                    style={{
                                        position: "absolute",
                                        bottom: SIZE(10),
                                        right: SIZE(40),
                                        borderRadius: SIZE(5),
                                        backgroundColor:
                                            Colors.light.tabIconSelected,
                                        height: SIZE(30),
                                        width: SIZE(30),
                                        justifyContent: "center",
                                        alignItems: "center",
                                    }}
                                >
                                    <MaterialIcons
                                        name="delete-forever"
                                        size={SIZE(24)}
                                        color={Colors.dark.text}
                                        style={{
                                            textShadowColor: Colors.dark.black,
                                            textShadowOffset: {
                                                width: 1,
                                                height: 1,
                                            },
                                            textShadowRadius: 2,
                                        }}
                                    />
                                </TouchableRipple>
                            </View>
                        </View>
                    </View>
                </ImageBackground>
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
        height: SIZE(140),
        borderRadius: SIZE(10),
        marginRight: SIZE(10),
    },
    imageContainer: {
        height: "100%",
        borderRadius: SIZE(10),
    },
    rightContent: {
        width: "80%",
        gap: SIZE(5),
    },
});
