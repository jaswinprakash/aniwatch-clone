import { ScrollView, StyleSheet, Text, View } from "react-native";
import React, { useState } from "react";

import StoredVideos from "./_components/StoredVideos";
import { SIZE } from "@/constants/Constants";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import { useAnimeHistory } from "@/store/AnimeHistoryContext";
import LottieView from "lottie-react-native";
const Profile = () => {
    const history = useAnimeHistory();

    return (
        <SafeAreaView
            style={{
                flex: 1,
            }}
        >
            <ThemedView
                style={{
                    paddingHorizontal: SIZE(16),
                    height: SIZE(40),
                    justifyContent: "center",
                    backgroundColor: Colors.dark.background,
                }}
            >
                <ThemedText
                    type="title"
                    style={{
                        color: Colors.light.tabIconSelected,
                        fontSize: SIZE(20),
                    }}
                >
                    Watch History
                </ThemedText>
            </ThemedView>
            {!history?.length ? (
                <View
                    style={{
                        flex: 1,
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor: Colors.dark.background,
                    }}
                >
                    <LottieView
                        source={require("../../assets/lottie/no-data.json")}
                        autoPlay
                        loop
                        style={{ width: SIZE(200), height: SIZE(200) }}
                    />
                </View>
            ) : (
                <ScrollView
                    style={{
                        paddingHorizontal: SIZE(16),
                        backgroundColor: Colors.dark.background,
                    }}
                >
                    {history?.map((item, index) => (
                        <StoredVideos
                            key={index}
                            id={item?.animeId}
                            episode={item?.episodeNumber}
                            time={item?.currentTime}
                        />
                    ))}
                </ScrollView>
            )}
        </SafeAreaView>
    );
};

export default Profile;

const styles = StyleSheet.create({});
