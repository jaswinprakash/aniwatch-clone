import { Image, ImageBackground, StyleSheet, Text, View } from "react-native";
import React from "react";
import { ThemedView } from "../../../components/ThemedView";
import VideoLoader from "./VideoLoader";
import { SIZE, SIZES } from "../../../constants/Constants";
import { Colors } from "../../../constants/Colors";

const PlayerLoader = ({
    uri,
    videoLoading,
    selectedEpisode,
    error,
    episodeLoading,
}) => {
    return (
        <ThemedView style={styles.imageContainer}>
            <ImageBackground
                style={[
                    styles.backgroundImage,
                    {
                        position: videoLoading ? "absolute" : "relative",
                    },
                ]}
                source={{ uri: uri }}
                resizeMode="cover"
                blurRadius={2}
            >
                {error && !videoLoading && !episodeLoading && (
                    <ThemedText type="title" style={styles.errorText}>
                        Unable to play please try again later
                    </ThemedText>
                )}
                <Image
                    style={[
                        styles.fastImage,
                        {
                            position: videoLoading ? "absolute" : "relative",
                        },
                    ]}
                    source={{ uri: uri }}
                    resizeMode="contain"
                />
                {videoLoading && (
                    <VideoLoader selectedEpisode={selectedEpisode} />
                )}
            </ImageBackground>
        </ThemedView>
    );
};

export default React.memo(PlayerLoader);

const styles = StyleSheet.create({
    imageContainer: {
        flex: 1,
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
    errorText: {
        color: Colors.light.error,
        fontSize: SIZE(20),
        marginBottom: SIZE(10),
        position: "absolute",
        top: SIZES.wp,
        left: SIZES.wp,
        alignSelf: "center",
        textAlign: "center",
        zIndex: 100,
        boxShadow: "rgba(0, 0, 0, 0.5) 0px 5px 15px",
        backgroundColor: "rgba(0, 187, 255, 0.8)",
        borderRadius: SIZE(6),
        padding: SIZE(5),
        lineHeight: SIZE(18),
    },
});
