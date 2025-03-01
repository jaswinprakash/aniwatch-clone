import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { ThemedText } from "../../../components/ThemedText";
import { ThemedView } from "../../../components/ThemedView";
import { Colors } from "../../../constants/Colors";
import LottieView from "lottie-react-native";
import { SIZE } from "../../../constants/Constants";
const VideoLoader = ({ selectedEpisode }) => {
    return (
        <ThemedView
            style={{
                position: "absolute",
                height: "100%",
                width: "100%",
                backgroundColor: "rgba(0, 0, 0, 0.4)",
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            <LottieView
                source={require("../../../assets/lottie/loader-2.json")}
                autoPlay
                loop
                style={{ width: SIZE(200), height: SIZE(200) }}
            />
            <ThemedText
                type="subtitle"
                style={{
                    color: Colors.light.tabIconSelected,
                    textShadowColor: "#000",
                    textShadowOffset: {
                        width: 1,
                        height: 1,
                    },
                    textShadowRadius: 2,
                }}
            >
                Loading Episode {selectedEpisode}
            </ThemedText>
        </ThemedView>
    );
};

export default VideoLoader;

const styles = StyleSheet.create({});
