import LottieView from "lottie-react-native";
import React from "react";
import { StyleSheet } from "react-native";
import { ThemedText } from "../../../components/ThemedText";
import { ThemedView } from "../../../components/ThemedView";
import { Colors } from "../../../constants/Colors";
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
                source={require("../../../assets/lottie/loader2.json")}
                autoPlay
                loop
                style={{
                    width: SIZE(100),
                    height: SIZE(100),
                }}
            />
            <ThemedText
                type="subtitle"
                style={{
                    color: Colors.light.tabIconSelected,
                    textShadowColor: Colors.dark.black,
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

export default React.memo(VideoLoader);

const styles = StyleSheet.create({});
