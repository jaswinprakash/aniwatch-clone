import { ScrollView, StyleSheet, Text, View } from "react-native";
import React, { useState } from "react";

import StoredVideos from "./_components/StoredVideos";
import { getAnimeHistory } from "@/store/storage";
import { useFocusEffect } from "expo-router";
import { SIZE } from "@/constants/Constants";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";

const Profile = () => {
    const [history, setHistory] = useState([]);

    useFocusEffect(
        React.useCallback(() => {
            const fetchHistory = async () => {
                const animeHistory = await getAnimeHistory();
                setHistory(animeHistory);
            };

            fetchHistory();

            return () => {};
        }, [])
    );

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
