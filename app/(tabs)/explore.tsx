import { ScrollView, StyleSheet, Text, View } from "react-native";
import React, { useState } from "react";

import StoredVideos from "./_components/StoredVideos";
import { SIZE } from "@/constants/Constants";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import { useAnimeHistory } from "@/store/AnimeHistoryContext";

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
                    height: SIZE(60),
                    justifyContent: "center",
                    borderBottomWidth: SIZE(1),
                    borderColor: Colors.light.tabIconSelected,
                    backgroundColor: "transparent",
                }}
            >
                <ThemedText
                    type="title"
                    style={{
                        color: Colors.light.tabIconSelected,
                        fontSize: SIZE(20),
                    }}
                >
                    Continue watching
                </ThemedText>
            </ThemedView>
            <ScrollView style={{ padding: SIZE(16) }}>
                {history?.map((item, index) => (
                    <StoredVideos
                        key={index}
                        id={item?.animeId}
                        episode={item?.episodeNumber}
                        time={item?.currentTime}
                    />
                ))}
            </ScrollView>
        </SafeAreaView>
    );
};

export default Profile;

const styles = StyleSheet.create({});
